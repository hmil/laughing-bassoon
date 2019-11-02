import * as React from 'react';
import { AppContext } from '../state/AppContext';
import { AbtNode, AbtRoot } from '../abt/Abt';
import { hoverHighlight, selectNode } from '../state/AppActions';
import { TreeView } from './widgets/TreeView';

export function SemanticViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    return <div style={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
        }}>
            <h2 style={{
                padding: '10px 12px',
                margin: 0,    
                fontSize: '16px',
                fontWeight: 600
            }}>Structure</h2>
            { state.abt != null 
                ? <TreeView
                        root={state.abt}
                        hoveredNodes={state.hoveredNodes.map(id => id.toString())}
                        selectedNodes={state.selectedNodes.map(id => id.toString())}
                        identify={identifyNode}
                        render={renderNode}
                        onHover={node => dispatch(hoverHighlight({ids: [node.id]}))}
                        onSelect={node => dispatch(selectNode({ ids: [node.id] }))}
                        getChildren={getNodeChildren}
                ></TreeView>
                : <div>No data</div>
            }
        </div>;
}

function getNodeChildren(node: AbtNode) {
    return node.children || [];
}

function renderNode(node: AbtNode) {
    return node.name;
}

function identifyNode(node: AbtNode | AbtRoot) {
    return `${node.id}`;
}