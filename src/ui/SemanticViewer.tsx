import { FileStructureNode } from 'ui/domain/structure/Structure';
import * as React from 'react';
import { AppActions } from 'ui/state/AppReducer';

import { hoverStructureNode, selectStructureNode } from 'ui/state/AppActions';
import { AppContext } from 'ui/state/AppContext';
import { memo } from './react/hooks';
import { TreeView } from './widgets/TreeView';

const handlers = memo((dispatch: React.Dispatch<AppActions>) => ({
    onOver: (node: FileStructureNode) => dispatch(hoverStructureNode(node)),
    onOut: () => dispatch(hoverStructureNode(null)),
    onSelect: (node: FileStructureNode) => dispatch(selectStructureNode(node)),
}));

export function SemanticViewer() {
    const { state, dispatch } = React.useContext(AppContext);
    const { onOver, onOut, onSelect } = handlers(dispatch);

    if (state.structure != null) {
        return <TreeView<FileStructureNode>
            renderHeader={renderHeader}
            onOver={onOver}
            onOut={onOut}
            onSelect={onSelect}
            root={state.structure.root}
        ></TreeView>;
    } else {
        return <div>No data</div>;
    }
}

function renderHeader(node: FileStructureNode) {
    return 'name' in node && node.name || '';
}
