
export interface FileStructure {
    root: FileStructureNode;
    indexByGrammarNode: {
        [k: string]: ReadonlyArray<FileStructureNode> | undefined;
    };
    readonly indexById: Map<number, FileStructureNode>;
}

export interface FileStructureNode {
    id: number;
    path: ReadonlyArray<number>;
    name: string;
    origin: number; // id of the grammar node causing this structure node
    children: ReadonlyArray<FileStructureNode>;
    childrenIndex: Map<number, FileStructureNode>;
    start: number;
    end: number;
    color: string;
}

export function updateStructureNode(tree: FileStructure, path: ReadonlyArray<number>, replacement: FileStructureNode): FileStructure {

    // Remove duplicates
    function rec(path: ReadonlyArray<number>, node: FileStructureNode): FileStructureNode {

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
        root: rec(path.slice(1), tree.root)
    };
}

export function getStructureNode(structure: FileStructure, path: ReadonlyArray<number>): FileStructureNode {
    function rec(path: ReadonlyArray<number>, node: FileStructureNode): FileStructureNode {
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
    return rec(path.slice(1), structure.root);
}
