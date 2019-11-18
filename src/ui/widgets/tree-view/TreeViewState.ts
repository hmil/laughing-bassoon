
export interface TreeViewNode<T> {
    data: T;
    id: string;
    children: TreeViewNode<T>[];
}

export interface TreeViewModel<T> {
    type: 'model';
    id: string;
    height: number;
    hasChildren: boolean;
    data: T;
    children: Array<Spacer | TreeViewModel<T>>;
    level: number;
}

export interface Spacer {
    type: 'spacer';
    height: number;
}

export class TreeViewState<T> {

    public static createEmpty<T>(): TreeViewState<T> {
        return new TreeViewState([], [], [], []);
    }

    public static create<T>(data: TreeViewNode<T>[]): TreeViewState<T> {
        return new TreeViewState([], [], [], this.processNodes(data));
    }

    private static processNodes<T>(data: TreeViewNode<T>[]): Array<Spacer | TreeViewModel<T>> {
        function rec(data: TreeViewNode<T>[], level: number): Array<Spacer | TreeViewModel<T>> {
            let res = new Array<Spacer | TreeViewModel<T>>();
            data.forEach(value => {
                let children: Array<Spacer | TreeViewModel<T>> = [];
                if (value.children.length > 0) {
                    children = rec(value.children, level + 1);
                }
                res.push({
                    id: value.id,
                    height: 30,
                    data: value.data,
                    hasChildren: value.children.length > 0,
                    level,
                    children,
                    type: 'model'
                });
                res.push(...children);
            });
            if (res.length === 0 || res[res.length - 1].type !== 'spacer') {
                res.push({
                    type: 'spacer',
                    height: 1
                });
            }

            return res;
        }
        return rec(data, 0);
    }

    private constructor(
            public readonly hoveredNodes: string[],
            public readonly selectedNodes: string[],
            public readonly collapsedNodes: string[],
            public readonly data: Array<Spacer | TreeViewModel<T>>) {}

    // TODO: The state must be flattened in order to compute the actual height and render partial children etc...
    public get totalHeight(): number {
        return this.data.reduce((acc, d) => acc + d.height, 0);
    }

    public getIndexAtY(y: number, inclusive: boolean): number {
        if (this.data.length === 0) {
            return 0;
        }
        let current = this.data[0].height;
        for (let i = 1 ; i < this.data.length ; i++) {
            if (current >= y) {
                return i - (inclusive === true ? 0 : 1);
            }
            current += this.data[i].height;
        }
        return this.data.length;
    }

    public getYForNode(nodeIndex: number): number {
        let y = 0;
        for (let i = 0 ; i < nodeIndex ; i++) {
            y += this.data[i].height;
        }
        return y;
    }

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

    public toggleNode(node: TreeViewModel<T>): TreeViewState<T> {
        const idx = this.collapsedNodes.indexOf(node.id);
        const isExpanded = idx < 0;

        let data = this.data;

        let indexStart = -1;
        let indexEnd = -1;

        for (let i = 0 ; i < this.data.length ; i++) {
            const model = this.data[i];
            if (model.type === 'model' && model.id === node.id) {
                indexStart = i + 1;
                break;
            }
        }

        if (isExpanded) {
            for (let i = indexStart ; i < this.data.length ; i++) {
                const model = this.data[i];
                if (model.type === 'model' && model.level <= node.level) {
                    indexEnd = i;
                    break;
                }
            }
    
            if (indexStart >= 0 && indexEnd >= 0) {
                data = [...this.data.slice(0, indexStart), ...this.data.slice(indexEnd)];
            }
        } else {
            if (indexStart >= 0) {
                data = [...this.data.slice(0, indexStart), ...node.children, ...this.data.slice(indexStart)];
            }
        }


        return new TreeViewState(
            this.hoveredNodes,
            this.selectedNodes,
            isExpanded ? [...this.collapsedNodes, node.id] : arrayRemove(this.collapsedNodes, idx),
            data
        );
    }
}

function arrayRemove<T>(input: ReadonlyArray<T>, index: number): T[] {
    return [...input.slice(0, index), ...input.slice(index + 1)];
}