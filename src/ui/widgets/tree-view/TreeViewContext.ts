import * as React from 'react';

import { TreeViewState, TreeViewModel } from './TreeViewState';

export interface TreeViewContext<T> {
    state: TreeViewState<T>;
    onChange(state: TreeViewState<T>): void;
    renderHeader(node: TreeViewModel<T>): string | JSX.Element;
    onOver(node: TreeViewModel<T>): void;
    onOut(node: TreeViewModel<T>): void;
    onSelect(node: TreeViewModel<T>): void;
    dragCandidate: TreeViewModel<T> | null;
    dragEnabled: boolean;
}
export const TreeViewContext = React.createContext<TreeViewContext<unknown>>({
    state: TreeViewState.createEmpty(),
    renderHeader: notImplemented,
    onChange: notImplemented,
    onOver: notImplemented,
    onOut: notImplemented,
    onSelect: notImplemented,
    dragCandidate: null,
    dragEnabled: false
});

function notImplemented(): never {
    throw new Error('Not implemented');
}
