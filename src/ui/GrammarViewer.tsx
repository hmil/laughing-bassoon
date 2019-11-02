import * as React from 'react';

import { AnyElement, ParserDefinition } from '../parser/model';
import { uniqId } from '../parser/uid';
import { hoverHighlight, selectNode } from '../state/AppActions';
import { AppContext } from '../state/AppContext';
import { TreeView } from './widgets/TreeView';
import { dumbFindNodes, findNodesByOrigin } from '../state/AppState';

const idMap = new WeakMap<AnyElement | ParserDefinition, string>();


export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    function getHoveredNodes() {
        if (state.abt == null) {
            return [];
        }
        const nodes = dumbFindNodes(state.abt, state.hoveredNodes);
        
        return nodes.map(n => identifyNode(n.origin));
    }

    function getSelectedNodes() {
        if (state.abt == null) {
            return [];
        }
        const nodes = dumbFindNodes(state.abt, state.selectedNodes);

        return nodes.map(n => identifyNode(n.origin));
    }

    function onHover(node: AnyElement | ParserDefinition) {
        const id = identifyNode(node);
        if (state.abt == null) {
            return;
        }

        const nodes = findNodesByOrigin(state.abt, id, identifyNode);
        dispatch(hoverHighlight({ids: nodes.map(n => n.id)}));
    }

    function onSelect(node: AnyElement | ParserDefinition) {
        const id = identifyNode(node);
        if (state.abt == null) {
            return;
        }

        const nodes = findNodesByOrigin(state.abt, id, identifyNode);
        dispatch(selectNode({ids: nodes.map(n => n.id)}));
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
                ? <TreeView<AnyElement | ParserDefinition>
                        root={state.grammar}
                        hoveredNodes={getHoveredNodes()}
                        selectedNodes={getSelectedNodes()}
                        identify={identifyNode}
                        render={renderNode}
                        onHover={onHover}
                        onSelect={onSelect}
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