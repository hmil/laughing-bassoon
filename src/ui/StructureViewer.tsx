import { FileStructureNode } from 'ui/domain/structure/Structure';
import * as React from 'react';
import { AppActions } from 'ui/state/AppReducer';

import { hoverStructureNode, selectStructureNode, updateStructureTree, unhoverStructureNode } from 'ui/state/AppActions';
import { AppContext } from 'ui/state/AppContext';
import { memo } from './react/hooks';
import { TreeView } from './widgets/tree-view/TreeView';
import { TreeViewModel, TreeViewState } from './widgets/tree-view/TreeViewState';
import { TreeViewLabel } from './widgets/tree-view/TreeViewLabel';

const handlers = memo((dispatch: React.Dispatch<AppActions>) => ({
    onOver: (node: TreeViewModel<FileStructureNode>) => dispatch(hoverStructureNode(node.data)),
    onOut: (node: TreeViewModel<FileStructureNode>) => dispatch(unhoverStructureNode(node.data)),
    onSelect: (node: TreeViewModel<FileStructureNode>) => dispatch(selectStructureNode(node.data)),
    onChange: (state: TreeViewState<FileStructureNode>) => dispatch(updateStructureTree(state))
}));

export function StructureViewer() {
    const { state, dispatch } = React.useContext(AppContext);
    const { onOver, onOut, onSelect, onChange } = handlers(dispatch);

    return <TreeView
        renderHeader={renderHeader}
        onOver={onOver}
        onOut={onOut}
        onSelect={onSelect}
        onChange={onChange}
        state={state.structureTree}
    ></TreeView>
}

function renderHeader(node: TreeViewModel<FileStructureNode>) {
    return <TreeViewLabel>
        {'name' in node.data && node.data.name || ''}
    </TreeViewLabel>
}
