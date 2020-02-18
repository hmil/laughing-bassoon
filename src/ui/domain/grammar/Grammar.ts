import { TreeViewState, TreeViewNode } from 'ui/widgets/tree-view/TreeViewState';
import { uniqId } from 'parser/uid';
import { ParserGrammar, GrammarInstruction } from 'parser/domain/Grammar';
import { Property, Entity } from 'datastore/dsl';
import { createStore } from 'datastore/store';
import { arrayInsert } from 'std/readonly-arrays';
import { Store } from 'datastore/types';
import { checkExhaustiveSwitch } from 'std/fuckery';

const ROOT_ID = 'root';

export class Grammar {

    private static createTrailer(db: Store<GrammarElement>) {
        return db.create(TrailerGrammarElement, {
            type: 'trailer',
            id: `${uniqId()}`,
            ref: undefined,
            content: []
        });
    }

    public static importFromParser(def: ParserGrammar): Grammar {
        let db: Store<GrammarElement> = createStore(ContainerGrammarElement, RepeatGrammarElement, IfGrammarElement, TrailerGrammarElement);

        function importElements(source: ReadonlyArray<GrammarInstruction>): GrammarElement[] {
            return source.map(content => {
                switch (content.type) {
                    case 'container':
                        return db.create(ContainerGrammarElement, {
                            id: content.id,
                            content: [...importElements(content.content)],
                            type: 'container',
                            ref: content.ref,
                            size: content.size,
                            codec: content.codec,
                            constraints: content.constraints
                        });
                    case 'repeat':
                        return db.create(RepeatGrammarElement, {
                            id: content.id,
                            type: 'repeat',
                            content: [...importElements(content.do), Grammar.createTrailer(db)],
                            ref: content.ref,
                            until: importElements(content.until)
                        });
                    case 'if':
                        return db.create(IfGrammarElement, {
                            id: content.id,
                            type: 'if',
                            content: [...importElements(content.then || []), Grammar.createTrailer(db)],
                            ref: content.ref,
                            condition: content.condition
                        });
                    default:
                        checkExhaustiveSwitch(content);
                }
            });
        }

        const roots = importElements(def.root);

        const root = db.create(ContainerGrammarElement, {
            content: roots,
            id: ROOT_ID,
            type: 'container'
        });
        db = db.save(root);
        return new Grammar(def, def.type, db);
    }

    private _asParserGrammar: ParserGrammar | null = null;

    constructor(
            private original: ParserGrammar,
            private mimeType: string,
            private db: Store<GrammarElement>) {
    }

    public getRootElements(): ReadonlyArray<GrammarElement> {
        const root = this.db.get(ROOT_ID);
        if (root == null) {
            throw new Error('No root in grammar!');
        }
        return root.content;
    }

    public asTreeViewState(previous?: TreeViewState<GrammarElement>): TreeViewState<GrammarElement> {
        const exportNodes = (nodes: readonly GrammarElement[]): TreeViewNode<GrammarElement>[] => {
            return nodes.filter(removeNulls).map(el => ({
                id: el.id,
                children: exportNodes(el.content),
                data: el
            }));
        };
        const nodes: TreeViewNode<GrammarElement>[] = exportNodes(this.getRootElements());

        if (previous) {
            return previous.setData(nodes);
        } else {
            return TreeViewState.create(nodes);
        }
    }

    public get asParserGrammar(): ParserGrammar {
        if (this._asParserGrammar == null) {
            const root = this.getRootElements().map(root => this.exportGrammarElement(root)).filter(removeNulls);
            this._asParserGrammar = {
                codecs: this.original.codecs,
                root: root,
                type: this.mimeType
            };
        }
        return this._asParserGrammar;
    }

    private exportGrammarElement(elem: GrammarElement): GrammarInstruction | null {
        if (elem == null) {
            console.log('No such element');
            return null;
        }

        switch (elem.type) {
            case 'container':
                return {
                    id: elem.id,
                    type: 'container',
                    content: elem.content.length > 0 ? elem.content.map(c => this.exportGrammarElement(c)).filter(removeNulls) : [],
                    ref: elem.ref,
                    size: elem.size,
                    codec: elem.codec,
                    constraints: elem.constraints
                };
            case 'if':
                return {
                    id: elem.id,
                    type: 'if',
                    condition: elem.condition,
                    then: elem.content.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    ref: elem.ref
                };
            case 'repeat':
                return {
                    id: elem.id,
                    type: 'repeat',
                    until: elem.until.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    do: elem.content.map(c => this.exportGrammarElement(c)).filter(removeNulls),
                    ref: elem.ref
                };
            case 'trailer':
                return null;
        }
    }

    public update(node: GrammarElement): Grammar {
        const record = this.db.get(node.id);
        if (record == null) {
            throw new Error('No record to update!');
        }
        for (let k of Object.keys(node) as Array<keyof typeof node>) {
            record[k] = node[k] as any;
        }
        return new Grammar(this.original, this.mimeType, this.db.save(record));
    }

    public addRoot(node: GrammarElement, position?: number): Grammar {
        const root = this.db.get(ROOT_ID);
        if (root == null) {
            throw new Error('Grammar has no root!');
        }
        root.content = arrayInsert(root.content, position || root.content.length, node);

        return new Grammar(this.original, this.mimeType, this.db.save(root));
    }

    public createElement(_type: GrammarElement['type']): GrammarElement {
        const trailer = Grammar.createTrailer(this.db);
        return this.db.create(ContainerGrammarElement, {
            type: 'container',
            content: [
                trailer
            ],
            id: `${uniqId()}`,
            ref: 'new element',
            size: undefined
        });
    }
    
    public removeElement(id: string): Grammar {
        return new Grammar(this.original, this.mimeType, this.db.delete(id));
    }

    public getElement(id: string): GrammarElement | undefined {
        return this.db.get(id);
    }
}

@Entity()
export class BaseGrammarElement<T extends string> {

    @Property()
    public id!: string;

    @Property()
    public type!: T;

    @Property()
    public ref?: string;

    @Property({ toMany: true, fk: [BaseGrammarElement, 'parent'] })
    public content: ReadonlyArray<GrammarElement> = [];

    @Property({ toOne: true })
    public parent?: GrammarElement;
}

@Entity()
export class ContainerGrammarElement extends BaseGrammarElement<'container'> {

    @Property()
    public codec?: string;

    @Property()
    public constraints?: { type: 'isNull' }[] | undefined;
    
    @Property()
    public size?: Size = {
        value: '0',
        unit: 'bit'
    };
}

@Entity()
export class RepeatGrammarElement extends BaseGrammarElement<'repeat'> {

    @Property()
    public until: ReadonlyArray<GrammarElement> = [];
}

@Entity()
export class IfGrammarElement extends BaseGrammarElement<'if'> {

    @Property()
    public condition: string = '';
}

@Entity()
export class TrailerGrammarElement extends BaseGrammarElement<'trailer'> {

}

export interface Codec {
    readonly encode: string;
    readonly decode: string;
    readonly name: string;
    readonly type: string;
}

export interface Size {
    readonly value: string;
    readonly unit: 'bit' | 'byte';
}


export type GrammarElement = ContainerGrammarElement | RepeatGrammarElement| IfGrammarElement | TrailerGrammarElement;

function removeNulls<T>(t: T | null | undefined): t is T {
    return t != null;
}