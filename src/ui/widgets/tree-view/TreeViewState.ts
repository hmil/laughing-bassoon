
export interface TreeViewNode<T> {
    data: T;
    id: string;
    children: TreeViewNode<T>[];
}

export class TreeViewState<T> {

    public static createEmpty<T>(): TreeViewState<T> {
        return new TreeViewState([], [], [], []);
    }

    public static create<T>(data: TreeViewNode<T>[]): TreeViewState<T> {
        return new TreeViewState([], [], [], data);
    }

    private constructor(
            public readonly hoveredNodes: string[],
            public readonly selectedNodes: string[],
            public readonly collapsedNodes: string[],
            public readonly data: TreeViewNode<T>[]) {}

    public hoverNode(node: string): TreeViewState<T> {
        return this.hoverNodes([node])
    }

    public hoverNodes(nodes: string[]): TreeViewState<T> {
        const nodesToAdd = nodes.filter(node => this.hoveredNodes.indexOf(node) < 0);
        if (nodesToAdd.length === 0) {
            return this;
        }
        return new TreeViewState(
            this.hoveredNodes.concat(nodesToAdd),
            this.selectedNodes,
            this.collapsedNodes,
            this.data
        );
    }

    public unhoverNode(node: string): TreeViewState<T> {
        const idx = this.hoveredNodes.indexOf(node);
        if (idx < 0) {
            return this;
        }
        return new TreeViewState(
            arrayRemove(this.hoveredNodes, idx),
            this.selectedNodes,
            this.collapsedNodes,
            this.data
        );
    }

    public unhoverAll(): TreeViewState<T> {
        if (this.hoveredNodes.length === 0) {
            return this;
        }
        return new TreeViewState(
            [],
            this.selectedNodes,
            this.collapsedNodes,
            this.data
        );
    }

    public selectNode(node: string): TreeViewState<T> {
        return this.selectNodes([node]);
    }

    public selectNodes(nodes: string[]): TreeViewState<T> {
        const nodesToAdd = nodes.filter(node => this.selectedNodes.indexOf(node) < 0);
        if (nodesToAdd.length === 0) {
            return this;
        }
        return new TreeViewState(
            this.hoveredNodes,
            this.selectedNodes.concat(nodesToAdd),
            this.collapsedNodes,
            this.data
        );
    }

    public unselectNode(node: string): TreeViewState<T> {
        const idx = this.selectedNodes.indexOf(node);
        if (idx < 0) {
            return this;
        }
        return new TreeViewState(
            this.hoveredNodes,
            arrayRemove(this.selectedNodes, idx),
            this.collapsedNodes,
            this.data
        );
    }

    public unselectAll(): TreeViewState<T> {
        if (this.selectedNodes.length === 0) {
            return this;
        }
        return new TreeViewState(
            this.hoveredNodes,
            [],
            this.collapsedNodes,
            this.data
        );
    }

    public toggleNode(node: string): TreeViewState<T> {
        const idx = this.collapsedNodes.indexOf(node);
        return new TreeViewState(
            this.hoveredNodes,
            this.selectedNodes,
            idx >= 0 ? arrayRemove(this.collapsedNodes, idx) : [...this.collapsedNodes, node],
            this.data
        );
    }
}

function arrayRemove<T>(input: ReadonlyArray<T>, index: number): T[] {
    return [...input.slice(0, index), ...input.slice(index + 1)];
}