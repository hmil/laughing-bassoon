import { ParserDefinition, AnyElement } from 'parser/model';
import { TreeViewState, TreeViewNode } from 'ui/widgets/tree-view/TreeViewState';
import { uniqId } from 'parser/uid';



// function makeTrailer(): TreeViewNode<TrailerGrammarElement> {
//     const id = uniqId();
//     return {
//         id: `${id}`,
//         data: {
//             id: `${id}`,
//             children: [],
//             ref: '',
//             type: 'trailer'
//         },
//         children: []
//     };
// }

// function makeGrammarTree(grammar: Grammar): TreeViewState<GrammarTree> {

//     function rec(node: GrammarTree): TreeViewNode<GrammarTree> {
//         let children = node.children.map(rec);
//         if (children.length > 0) {
//             children = children.concat([makeTrailer()]);
//         }
//         return {
//             children,
//             data: node,
//             id: `${node.id}`
//         }
//     }

//     return TreeViewState.create(grammar.definition.children.map(rec));
// }


//
//
// WIP: Re-create grammar storage structure
// Make it flat instead of tree shaped so update/move operations are easier to implement
//
//

// function importGrammar(grammar: ParserDefinition): Grammar {
//     const id = uniqId();
//     const path = [id];
//     const indexById = new Map<number, GrammarTree>();
//     const mapChild = importGrammarNode(path, indexById);
//     const children = makeChildren(grammar.content, mapChild);
//     const root: GrammarTree = {
//         id: id,
//         path: path,
//         type: 'container',
//         size: undefined,
//         ref: undefined,
//         children: children.children,
//         childrenIndex: children.childrenIndex,
//     };
//     indexById.set(id, root);
//     return {
//         codecs: grammar.codecs != null ? grammar.codecs : [],
//         mimeType: grammar.type,
//         definition: root,
//         indexById
//     };
// }

export class Grammar {

    public static importFromParser(def: ParserDefinition): Grammar {
        const elements: Map<string, GrammarElement> = new Map();
        const parents: Map<string, string> = new Map();

        function importElements(source: AnyElement[]): string[] {
            return source.map(content => {
                const children = importElements('content' in content && content.content || []);
                const id = `${uniqId()}`;
                children.forEach(c => parents.set(c, id));
                switch (content.type) {
                    case 'container': {
                        elements.set(id, {
                            id,
                            children: children,
                            type: 'container',
                            ref: content.ref,
                            size: importSize(content) 
                        });
                        break;
                    }
                    case 'fixed':
                        elements.set(id, {
                            id,
                            type: 'value',
                            children: children,
                            ref: content.ref,
                            size: importSize(content) || { value: '0', unit: 'byte' },
                            codec: content.codec,
                            constraints: content.constraints
                        });
                        break;
                    case 'repeat': {
                        const children = importElements(content.do);
                        children.forEach(c => parents.set(c, id));
                        elements.set(id, {
                            id,
                            type: 'repeat',
                            children: children,
                            ref: content.ref,
                            until: importElements(content.until)
                        });
                        break;
                    }
                    case 'if': {
                        const children = importElements(content.then || []);
                        children.forEach(c => parents.set(c, id));
                        elements.set(id, {
                            id,
                            type: 'if',
                            children: children,
                            ref: content.ref,
                            condition: content.cond
                        });
                        break;
                    }
                }
                return id;
            });
        }

        const roots = importElements(def.content);

        return new Grammar(def.codecs || [], def.type, roots, elements, parents);
    }

    private _definition: ParserDefinition | null = null;
    private _backMapping: Map<AnyElement, string> = new Map();

    constructor(
            private codecs: Codec[],
            private mimeType: string,
            private roots: string[],
            private elements: Map<string, GrammarElement>,
            private parentsMapping: Map<string, string>) {
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

    public get asParserDefinition(): ParserDefinition {
        if (this._definition == null) {
            this._definition = {
                codecs: this.codecs.length > 0 ? this.codecs : undefined,
                type: this.mimeType,
                endian: 'little',
                wordlength: 32,
                content: this.roots.map(root => this.exportGrammarElement(root)).filter(removeNulls)
            };
        }
        return this._definition;
    }

    private exportGrammarElement(id: string): AnyElement | null {
        const ret = this._exportGrammarElement(id);
        if (ret != null) {
            this._backMapping.set(ret, id);
        }
        return ret;
    }

    private _exportGrammarElement(id: string): AnyElement | null {
        const elem = this.getElement(id);
        if (elem == null) {
            console.log('No such element');
            return null;
        }

        switch (elem.type) {
            case 'container':
                return {
                    type: 'container',
                    content: elem.children.length > 0 ? elem.children.map(c => this.exportGrammarElement(c)).filter(removeNulls) : [],
                    ref: elem.ref,
                    size: elem.size == null ? undefined : elem.size.value
                };
            case 'value':
                return {
                    type: 'fixed',
                    codec: elem.codec,
                    ref: elem.ref,
                    constraints: elem.constraints,
                    ...exportSize(elem.size)
                };
            case 'if':
                return {
                    type: 'if',
                    cond: elem.condition,
                    then: elem.children.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    ref: elem.ref
                };
            case 'repeat':
                return {
                    type: 'repeat',
                    until: elem.until.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    do: elem.children.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    ref: elem.ref
                };
            case 'trailer':
                return null;
        }
    }

    public get parserBackMapping(): (el: AnyElement) => string {
        return (el) => {
            const ret = this._backMapping.get(el);
            if (ret == null) {
                return 'null';
            }
            return ret;
        };
    }

    public update(id: string, node: GrammarElement): Grammar {
        if (id !== node.id) {
            throw new Error('Trying to replace a node with a different id');
        }
        const elements = new Map(this.elements);
        elements.set(id, node);
        const parents = this.parentsMapping;
        node.children.forEach(c => parents.set(c, id));
        return new Grammar(this.codecs, this.mimeType, this.roots, elements, parents);
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
        return new Grammar(this.codecs, this.mimeType, this.roots, elements, this.parentsMapping);
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

function importSize({ size, bitSize }: { size?: string | number, bitSize?: string | number }): Size | undefined {
    if (size != null) {
        return {
            value: `${size}`,
            unit: 'byte'
        }
    } else if (bitSize != null) {
        return {
            value: `${bitSize}`,
            unit: 'bit'
        }
    }
}

function exportSize(size: Size): { size: string | number} | { bitSize: string | number } {
    return size.unit === 'byte' ? { size: size.value } : { bitSize: size.value };
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