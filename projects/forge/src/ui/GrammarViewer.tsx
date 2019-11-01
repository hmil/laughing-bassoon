import * as React from 'react';

import { AnyElement, ParserDefinition } from '../parser/model';
import { uniqId } from '../parser/uid';
import { hoverHighlight, selectNode } from '../state/AppActions';
import { AppContext } from '../state/AppContext';
import { TreeView } from './widgets/TreeView';
import { dumbFindNode } from '../state/AppState';

const idMap = new WeakMap<AnyElement | ParserDefinition, string>();


export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    function getHoveredNode() {
        if (state.abt == null || state.hoveredNode == null) {
            return '';
        }
        const node = dumbFindNode(state.abt, state.hoveredNode);
        
        return node != null ? identifyNode(node.origin) : '';
    }

    function getSelectedNode() {
        if (state.abt == null || state.selectedNode == null) {
            return '';
        }
        const node = dumbFindNode(state.abt, state.selectedNode);
        
        return node != null ? identifyNode(node.origin) : '';
    }

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
            }}>Grammar</h2>
            { state.grammar != null 
                ? <TreeView
                        root={state.grammar}
                        hoveredNode={getHoveredNode()}
                        selectedNode={getSelectedNode()}
                        identify={identifyNode}
                        render={renderNode}
                        onHover={node => {}}
                        onSelect={node => {}}
                        getChildren={getNodeChildren}
                ></TreeView>
                : <div>No data</div>
            }
        </div>;
}


function getNodeChildren(node: AnyElement | ParserDefinition): AnyElement[] {
    // TODO: Switch case
    if ('content' in node) {
        return node.content != null ? node.content : [];
    }

    switch (node.type) {
        case 'repeat':
            return [...node.until, ...node.do];
    }

    return [];
}

function renderNode(node: AnyElement | ParserDefinition) {
    return 'name' in node ? node.name : '';
}

function identifyNode(node: AnyElement | ParserDefinition) {
    let id = idMap.get(node);
    if (id == null) {
        id = `${uniqId()}`
        idMap.set(node, id);
    }
    return `${id}`;
}