export interface Grammar {
    readonly mimeType: string;
    readonly codecs: Codec[];
    readonly definition: GrammarTree;
    readonly indexById: Map<number, GrammarTree>;
}

export interface Codec {
    readonly encode: string;
    readonly decode: string;
    readonly name: string;
    readonly type: string;
}

export interface BaseGrammarNode<T extends string> {
    readonly type: T;
    readonly path: ReadonlyArray<number>;
    readonly id: number;
    readonly ref: string | undefined;
    readonly children: ReadonlyArray<GrammarTree>;
    // For faster search
    readonly childrenIndex: Map<number, GrammarTree>;
}

export interface Size {
    readonly value: string;
    readonly unit: 'bit' | 'byte';
}

export interface ValueGrammarNode extends BaseGrammarNode<'value'> {
    readonly codec: string | undefined;
    readonly size: Size;
    readonly constraints: { type: 'isNull' }[] | undefined;
}

export interface ContainerGrammarNode extends BaseGrammarNode<'container'> {
    readonly size: Size | undefined;
}

export interface RepeatGrammarNode extends BaseGrammarNode<'repeat'> {
    readonly until: ReadonlyArray<GrammarTree>;
}

export interface IfGrammarNode extends BaseGrammarNode<'if'> {
    readonly condition: string;
}

/**
 * Placed at the end of the children list of a container for actions & style
 */
export interface TrailerNode extends BaseGrammarNode<'trailer'> {
}

export type GrammarTree = ValueGrammarNode | ContainerGrammarNode | RepeatGrammarNode | IfGrammarNode | TrailerNode;


export function updateGrammarNode(tree: Grammar, path: ReadonlyArray<number>, replacement: GrammarTree): Grammar {

    // Remove duplicates
    function rec(path: ReadonlyArray<number>, node: GrammarTree): GrammarTree {

        if (path.length == 0) {
            return replacement;
        } else {
            const segment = path[0];
            const prev = node.childrenIndex.get(segment);
            if (prev === undefined) {
                throw new Error('Node not found in index');
            }
            const index = node.children.indexOf(prev);
            if (index < 0) {
                throw new Error('Node not found in children');
            }
            const child = rec(path.slice(1), node.children[index]);
            const newIndex = new Map(node.childrenIndex);
            newIndex.set(segment, child);

            return {
                ...node,
                children: [...node.children.slice(0, index), child, ...node.children.slice(index + 1)],
                childrenIndex: newIndex
            };
        }
    }

    return {
        ...tree,
        definition: rec(path.slice(1), tree.definition)
    }
}

export function getGrammarNode(grammar: Grammar, path: ReadonlyArray<number>): GrammarTree {
    function rec(path: ReadonlyArray<number>, node: GrammarTree): GrammarTree {
        if (path.length == 0) {
            return node;
        } else {
            const segment = path[0];
            const prev = node.childrenIndex.get(segment);
            if (prev === undefined) {
                throw new Error('Node not found in index');
            }
            const index = node.children.indexOf(prev);
            if (index < 0) {
                throw new Error('Node not found in children');
            }
            return rec(path.slice(1), node.children[index]);
        }
    }
    return rec(path.slice(1), grammar.definition);
}
