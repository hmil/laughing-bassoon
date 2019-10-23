import * as React from 'react';
import { AppContext } from '../state/AppContext';
import { AbtNode, AbtRoot } from '../abt/Abt';
import { hoverHighlight, toggleSemanticNode, selectNode } from '../state/AppActions';

export function SemanticViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    function renderChildren(node: AbtNode | AbtRoot, level: number) {
        let hasHighlight = false;
        const elements = node.children ? node.children.map(c => {
            const children = renderChildren(c, level + 1);
            const currentHasHighlight = c.id === state.hoveredNode || children.hasHighlight;
            const isExpanded = state.semanticViewer.expandedNodes.indexOf(c.id) < 0; // TODO: temporarilly inverted 
            const isSelected = state.selectedNode === c.id;
            const padding = level * 20 + 4;
            const hasChildren = c.children != null && c.children.length > 0;
            hasHighlight = hasHighlight || currentHasHighlight;
            return <div key={c.id} style={{
                borderBottom: ( hasChildren && isExpanded) ? '1px #1a1a1a solid' : undefined,
                boxShadow: ( hasChildren && isExpanded) ? '#ffffff13 0px 1px 0px 0px' : undefined
            }}>
                <div style={{
                            padding: `6px ${padding + 5}px`,
                            cursor: 'default',
                            backgroundColor: isSelected ? '#d6b30a' : currentHasHighlight ? '#ffffff10' : 'transparent',
                            color: isSelected ? '#333' : undefined,
                        }}
                        onMouseEnter={() => dispatch(hoverHighlight({id: c.id}))}
                        onClick={() => dispatch(selectNode({ id: c.id }))}>
                    { (c.children && c.children.length > 0) ?
                        <span style={{
                                    paddingRight: '5px',
                                    width: '18px',
                                    display: 'inline-block'
                                }}
                                onClick={evt => {
                                    evt.stopPropagation();
                                    dispatch(toggleSemanticNode({id: c.id}))
                                }}>{ isExpanded ? 
                            <span>&#9662;</span> :
                            <span>&#9656;</span>
                        }</span> : undefined
                    }
                    { c.name }
                </div>
                { isExpanded ? <div style={{
                    // paddingLeft: `${padding}px`
                }}>{ children.elements }</div> : undefined }
            </div>
        }) : [];

        return {
            hasHighlight,
            elements
        };
    }

    return <div style={{
        width: '400px',
        backgroundColor: '#2f2f2f',
        boxShadow: 'rgba(255, 255, 255, 0.09) -0.25px 1px 1px 0px inset, #00000047 2px 2px 4px',
        zIndex: 200,
        marginTop: '2px',
        borderRadius: '3px'
    }}>
        { state.abt != null 
            ? <div style={{
                display: 'flex',
                flexDirection: 'column',
                height: '100%'
            }}>
                <h2 style={{
                    padding: '10px 12px',
                    margin: 0,    
                    fontSize: '16px',
                    fontWeight: 600
                }}>Blocks</h2>
                <div style={{
                    borderTop: '1px #1a1a1a solid',
                    boxShadow: 'inset 0px 0.5px 1px 0px #ffffff17',
                    flexShrink: 1,
                    overflow: 'auto'
                }}>
                    { renderChildren(state.abt, 0).elements }
                </div>
            </div>
            : 'No data'
        }
    </div>
}