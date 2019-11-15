import * as React from 'react';

import { TreeViewNode, TreeViewState } from './TreeViewState';
import { TreeViewContext } from './TreeViewContext';
import { TreeViewElement } from './TreeViewElement';


export interface TreeViewProps<T> {
    state: TreeViewState<T>;
    onChange(state: TreeViewState<T>): void;
    renderHeader(node: TreeViewNode<T>): string | JSX.Element;
    onOver?(node: TreeViewNode<T>): void;
    onOut?(node: TreeViewNode<T>): void;
    onSelect?(node: TreeViewNode<T>): void;
}

export function TreeView<T>(props: TreeViewProps<T>) {

    const onOver = props.onOver || ((node: TreeViewNode<T>) => props.onChange(props.state.hoverNode(node.id)));
    const onOut = props.onOut || ((node: TreeViewNode<T>) => props.onChange(props.state.unhoverNode(node.id)));
    const onSelect = props.onSelect || ((node: TreeViewNode<T>) => props.onChange(props.state.unselectAll().selectNode(node.id)));

    const TContext = TreeViewContext as React.Context<TreeViewContext<T>>;
    return <TContext.Provider value={{
        state: props.state,
        onChange: props.onChange,
        renderHeader: props.renderHeader,
        onOver, onOut, onSelect
    }}>
        <div>
            { props.state.data.map(d => <TreeViewElement data={d} level={0} key={d.id}/>) }
        </div>
    </TContext.Provider>
}
