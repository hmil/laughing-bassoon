import * as React from 'react';
import { AppContext } from '../state/AppContext';
import { AbtNode, AbtRoot } from '../abt/Abt';
import { hoverHighlight, selectNode } from '../state/AppActions';
import { TreeView, RenderNodeProps } from './widgets/TreeView';

export function SemanticViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    return <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            { state.abt != null 
                ? <TreeView
                        root={state.abt}
                        hoveredNodes={state.hoveredNodes.map(id => id.toString())}
                        selectedNodes={state.selectedNodes.map(id => id.toString())}
                        identify={identifyNode}
                        renderHeader={renderHeader}
                        onHover={node => dispatch(hoverHighlight({ids: [node.id]}))}
                        onSelect={node => dispatch(selectNode({ ids: [node.id] }))}
                        getChildren={getNodeChildren}
                        setChild={() => { throw new Error('Unsupported operation') }}
                ></TreeView>
                : <div>No data</div>
            }
        </div>;
}

function getNodeChildren(node: AbtNode) {
    return node.children || [];
}

function renderHeader({node}: RenderNodeProps<AbtNode | AbtRoot>) {
    return 'name' in node && node.name || '';
}

function identifyNode(node: AbtNode | AbtRoot) {
    return `${node.id}`;
}