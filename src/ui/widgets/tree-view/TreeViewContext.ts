import * as React from 'react';

import { TreeViewNode, TreeViewState } from './TreeViewState';

export interface TreeViewContext<T> {
    state: TreeViewState<T>;
    onChange(state: TreeViewState<T>): void;
    renderHeader(node: TreeViewNode<T>): string | JSX.Element;
    onOver(node: TreeViewNode<T>): void;
    onOut(node: TreeViewNode<T>): void;
    onSelect(node: TreeViewNode<T>): void;
}
export const TreeViewContext = React.createContext<TreeViewContext<unknown>>({
    state: TreeViewState.createEmpty(),
    renderHeader: notImplemented,
    onChange: notImplemented,
    onOver: notImplemented,
    onOut: notImplemented,
    onSelect: notImplemented
});

function notImplemented(): never {
    throw new Error('Not implemented');
}
