import { TreeViewState, TreeViewNode } from 'ui/widgets/tree-view/TreeViewState';
import { uniqId } from 'parser/uid';
import { ParserGrammar, GrammarInstruction } from 'parser/domain/Grammar';
import { arrayInsert } from 'std/readonly-arrays';


export class Grammar {

    public static importFromParser(def: ParserGrammar): Grammar {
        const elements: Map<string, GrammarElement> = new Map();
        const parents: Map<string, string> = new Map();

        function createTrailer(): string {
            const trailer: TrailerGrammarElement = {
                type: 'trailer',
                id: `${uniqId()}`,
                children: [],
                ref: undefined
            };
            elements.set(trailer.id, trailer);
            return trailer.id;
        }

        function importElements(source: ReadonlyArray<GrammarInstruction>): string[] {
            return source.map(content => {
                switch (content.type) {
                    case 'container': {
                        const children = [...importElements(content.content), createTrailer()];
                        children.forEach(c => parents.set(c, content.id));
                        
                        elements.set(content.id, {
                            id: content.id,
                            children: children,
                            type: 'container',
                            ref: content.ref,
                            size: content.size
                        });
                        break;
                    }
                    case 'fixed': {
                        elements.set(content.id, {
                            id: content.id,
                            type: 'value',
                            children: [],
                            ref: content.ref,
                            size: content.size,
                            codec: content.codec,
                            constraints: content.constraints
                        });
                        break;
                    }
                    case 'repeat': {
                        const children = [...importElements(content.do), createTrailer()];
                        children.forEach(c => parents.set(c, content.id));
                        elements.set(content.id, {
                            id: content.id,
                            type: 'repeat',
                            children: children,
                            ref: content.ref,
                            until: importElements(content.until)
                        });
                        break;
                    }
                    case 'if': {
                        const children = [...importElements(content.then || []), createTrailer()];
                        children.forEach(c => parents.set(c, content.id));
                        elements.set(content.id, {
                            id: content.id,
                            type: 'if',
                            children: children,
                            ref: content.ref,
                            condition: content.condition
                        });
                        break;
                    }
                }
                return content.id;
            });
        }

        const roots = importElements(def.root);

        return new Grammar(def, def.type, roots, elements, parents);
    }

    private _asParserGrammar: ParserGrammar | null = null;

    constructor(
            private original: ParserGrammar,
            private mimeType: string,
            private roots: string[],
            private elements: Map<string, GrammarElement>,
            private parentsMapping: Map<string, string>) {
    }

    public getRootElements(): GrammarElement[] {
        return this.roots.map(id => this.getElement(id)).filter(removeNulls);
    }

    public asTreeViewState(previous?: TreeViewState<GrammarElement>): TreeViewState<GrammarElement> {

        // TODO Prune garbage
        // const elements = new Map<string, GrammarElement>();
        // const parentsMapping = new Map<string, string>();

        const exportNodes = (nodes: readonly string[]): TreeViewNode<GrammarElement>[] => {
            return nodes.map(id => {
                const el = this.elements.get(id);
                if (el == null) {
                    return null;
                }
                // elements.set(id, el);
                const children = exportNodes(el.children);
                // Collect garbage in children
                if (children.length !== el.children.length) {
                    this.elements.set(id, {
                        ...el,
                        children: children.map(n => n.id)
                    });
                }
                // children.forEach(child => {
                //     parentsMapping.set(child.id, el.id);
                // });
                return {
                    id,
                    children: children,
                    data: el
                }
            }).filter(removeNulls);
        };
        const nodes: TreeViewNode<GrammarElement>[] = exportNodes(this.roots);
        if (nodes.length !== this.roots.length) {
            // There is some garbage to collect
            this.roots = nodes.map(n => n.id);
        }

        // this.elements = elements;
        // this.parentsMapping = parentsMapping;

        if (previous) {
            return previous.setData(nodes);
        } else {
            return TreeViewState.create(nodes);
        }
    }

    public get asParserGrammar(): ParserGrammar {
        if (this._asParserGrammar == null) {
            const root = this.roots.map(root => this.exportGrammarElement(root)).filter(removeNulls);
            this._asParserGrammar = {
                codecs: this.original.codecs,
                root: root,
                type: this.mimeType
            };
        }
        return this._asParserGrammar;
    }

    private exportGrammarElement(id: string): GrammarInstruction | null {
        const elem = this.getElement(id);
        if (elem == null) {
            console.log('No such element');
            return null;
        }

        switch (elem.type) {
            case 'container':
                return {
                    id: elem.id,
                    type: 'container',
                    content: elem.children.length > 0 ? elem.children.map(c => this.exportGrammarElement(c)).filter(removeNulls) : [],
                    ref: elem.ref,
                    size: elem.size
                };
            case 'value':
                return {
                    id: elem.id,
                    type: 'fixed',
                    codec: elem.codec,
                    ref: elem.ref,
                    constraints: elem.constraints,
                    size: elem.size
                };
            case 'if':
                return {
                    id: elem.id,
                    type: 'if',
                    condition: elem.condition,
                    then: elem.children.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    ref: elem.ref
                };
            case 'repeat':
                return {
                    id: elem.id,
                    type: 'repeat',
                    until: elem.until.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    do: elem.children.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    ref: elem.ref
                };
            case 'trailer':
                return null;
        }
    }

    public update(id: string, node: GrammarElement): Grammar {
        if (id !== node.id) {
            throw new Error('Trying to replace a node with a different id');
        }
        const elements = new Map(this.elements);
        elements.set(id, node);
        const parents = this.parentsMapping;
        node.children.forEach(c => parents.set(c, id));
        return new Grammar(this.original, this.mimeType, this.roots, elements, parents);
    }

    public addRoot(node: GrammarElement, position?: number): Grammar {
        const elements = new Map(this.elements);
        const parents = new Map(this.parentsMapping);
        if (!elements.has(node.id)) {
            elements.set(node.id, node);
        }
        node.children.forEach(c => parents.set(c, node.id));

        return new Grammar(this.original, this.mimeType, arrayInsert(this.roots, position != null ? position : this.roots.length, node.id), elements, parents);
    }

    public createElement(_type: GrammarElement['type']): GrammarElement {
        const element: GrammarElement = {
            type: 'container',
            children: [],
            id: `${uniqId()}`,
            ref: 'new element',
            size: undefined
        };
        this.elements.set(element.id, element);
        return element;
    }
    
    public removeElement(id: string): Grammar {
        const elements = new Map(this.elements);
        elements.delete(id);
        return new Grammar(this.original, this.mimeType, this.roots, elements, this.parentsMapping);
    }

    public getElement(id: string): GrammarElement | undefined {
        return this.elements.get(id);
    }

    public getParent(node: GrammarElement): GrammarElement | undefined {
        const parentId = this.parentsMapping.get(node.id);
        if (parentId == null) {
            return undefined;
        }
        return this.getElement(parentId);
    }
}

export interface Codec {
    readonly encode: string;
    readonly decode: string;
    readonly name: string;
    readonly type: string;
}

export interface BaseGrammarElement<T extends string> {
    readonly type: T;
    readonly id: string;
    readonly ref: string | undefined;
    readonly children: ReadonlyArray<string>;
}

export interface Size {
    readonly value: string;
    readonly unit: 'bit' | 'byte';
}

export interface ValueGrammarElement extends BaseGrammarElement<'value'> {
    readonly codec: string | undefined;
    readonly size: Size;
    readonly constraints: { type: 'isNull' }[] | undefined;
}

export interface ContainerGrammarElement extends BaseGrammarElement<'container'> {
    readonly size: Size | undefined;
}

export interface RepeatGrammarElement extends BaseGrammarElement<'repeat'> {
    readonly until: ReadonlyArray<string>;
}

export interface IfGrammarElement extends BaseGrammarElement<'if'> {
    readonly condition: string;
}

export interface TrailerGrammarElement extends BaseGrammarElement<'trailer'> {
}

export type GrammarElement = ValueGrammarElement | ContainerGrammarElement | RepeatGrammarElement| IfGrammarElement | TrailerGrammarElement;

function removeNulls<T>(t: T | null | undefined): t is T {
    return t != null;
}