import * as React from 'react';

import { AppContext } from '../state/AppContext';
import { AbtNode, AbtRoot } from '../abt/Abt';
import { selectNode } from '../state/AppActions';
import { TreeView, RenderNodeProps, TreeViewAdapter } from './widgets/TreeView';
import { AppActions } from 'state/AppState';
import { memo } from './react/hooks';
import { UIPresentationServiceInjector, AbtUITree, UIPresentationService } from './services/UIPresentationService';

const handlers = memo((dispatch: React.Dispatch<AppActions>, uiService: UIPresentationService) => () => ({
    onOver: (node: AbtRoot | AbtNode) => uiService.hoverNodes([node.id]),
    onOut: () => uiService.hoverNodes([]),
    onSelect: (node: AbtRoot | AbtNode) => dispatch(selectNode({ ids: [node.id] })),
}));

const getSelectedNodes = memo((selectedNodes: number[]) => () => selectedNodes.map(id => id.toString()));

export function SemanticViewer() {

    const uiService = React.useContext(UIPresentationServiceInjector);

    const { state, dispatch } = React.useContext(AppContext);
    const { onOver, onOut, onSelect } = handlers(dispatch, uiService);
    const selectedNodes = getSelectedNodes(state.selectedNodes);

    const tree = state.abtUiState;

    if (tree != null) {
        const adapter = makeAdapter(tree);

        return <TreeView
                selectedNodes={selectedNodes}
                identify={identifyNode}
                renderHeader={renderHeader}
                onOver={onOver}
                onOut={onOut}
                onSelect={onSelect}
                setChild={notImplemented}
                adapter={adapter}
        ></TreeView>;
    } else {
        return <div>No data</div>;
    }
}

function makeAdapter(tree: AbtUITree): TreeViewAdapter<AbtRoot | AbtNode> {
    return {
        getChildren() {
            return renderChildren(tree.children);
        },
        isHovered: tree.hovered,
        node: tree.node
    };
}
const renderChildren = memo((children: AbtUITree[]) => () => children.map(n => makeAdapter(n)));

function notImplemented(): never {
    throw new Error('Unsupported operation');
}

function renderHeader({node}: RenderNodeProps<AbtNode | AbtRoot>) {
    return 'name' in node && node.name || '';
}

function identifyNode(node: AbtNode | AbtRoot) {
    return `${node.id}`;
}
