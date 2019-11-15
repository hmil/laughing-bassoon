import { FileStructureNode } from 'ui/domain/structure/Structure';
import * as React from 'react';
import { AppActions } from 'ui/state/AppReducer';

import { hoverStructureNode, selectStructureNode, updateStructureTree, unhoverStructureNode } from 'ui/state/AppActions';
import { AppContext } from 'ui/state/AppContext';
import { memo } from './react/hooks';
import { TreeView } from './widgets/tree-view/TreeView';
import { TreeViewNode } from './widgets/tree-view/TreeViewState';

const handlers = memo((dispatch: React.Dispatch<AppActions>) => ({
    onOver: (node: TreeViewNode<FileStructureNode>) => dispatch(hoverStructureNode(node.data)),
    onOut: (node: TreeViewNode<FileStructureNode>) => dispatch(unhoverStructureNode(node.data)),
    onSelect: (node: TreeViewNode<FileStructureNode>) => dispatch(selectStructureNode(node.data)),
}));

export function StructureViewer() {
    const { state, dispatch } = React.useContext(AppContext);
    const { onOver, onOut, onSelect } = handlers(dispatch);

    return <TreeView
        renderHeader={renderHeader}
        onOver={onOver}
        onOut={onOut}
        onSelect={onSelect}
        onChange={s => dispatch(updateStructureTree(s))}
        state={state.structureTree}
    ></TreeView>
}

function renderHeader(node: TreeViewNode<FileStructureNode>) {
    return 'name' in node.data && node.data.name || '';
}
