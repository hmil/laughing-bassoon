import * as React from 'react';

const treeViewDefaultState = {
    hiddenNodes: [] as string[]
}

export interface TreeViewProps<T> {
    identify(t: T): string;
    getChildren(t: T): T[];
    root: T;
    hoveredNodes: string[];
    selectedNodes: string[];
    onHover(node: T): void;
    onSelect(node: T): void;
    render(node: T): string | JSX.Element;
}

export function TreeView<T>(props: TreeViewProps<T>) {

    const [state, setState] = React.useState(treeViewDefaultState);

    function toggleNode(id: string) {
        const currentNodes = state.hiddenNodes
        const index = currentNodes.indexOf(id);
        setState({
            hiddenNodes: index >= 0 
                    ? [ ...currentNodes.slice(0, index), ...currentNodes.slice(index + 1)]
                    : [ ...state.hiddenNodes, id ]
        });
    }

    function renderChildren(node: T, level: number) {
        let hasHighlight = false;
        const elements = props.getChildren(node).map(c => {
            const id = props.identify(c);
            const children = renderChildren(c, level + 1);
            const currentHasHighlight = props.hoveredNodes.indexOf(id) >= 0 || children.hasHighlight;
            const isExpanded = state.hiddenNodes.indexOf(id) < 0; 
            const isSelected = props.selectedNodes.indexOf(id) >= 0;
            const padding = level * 20 + 4;
            const subChildren = props.getChildren(c);
            const hasChildren = subChildren != null && subChildren.length > 0;
            hasHighlight = hasHighlight || currentHasHighlight;
            return <div key={id} style={{
                borderBottom: ( hasChildren && isExpanded) ? '1px #1a1a1a solid' : undefined,
                boxShadow: ( hasChildren && isExpanded) ? '#ffffff13 0px 1px 0px 0px' : undefined
            }}>
                <div style={{
                            padding: `6px ${padding + 5}px`,
                            cursor: 'default',
                            backgroundColor: isSelected ? '#d6b30a' : currentHasHighlight ? '#ffffff10' : 'transparent',
                            color: isSelected ? '#333' : undefined,
                        }}
                        onMouseEnter={() => props.onHover(c)}
                        onClick={() => props.onSelect(c)}>
                    { (subChildren.length > 0) ?
                        <span style={{
                                    paddingRight: '5px',
                                    width: '18px',
                                    display: 'inline-block'
                                }}
                                onClick={evt => {
                                    if (evt.button !== 0) return;
                                    evt.stopPropagation();
                                    toggleNode(id);
                                }}>{ isExpanded ? 
                            <span>&#9662;</span> :
                            <span>&#9656;</span>
                        }</span> : undefined
                    }
                    { props.render(c) }
                </div>
                { isExpanded ? <div style={{
                    // paddingLeft: `${padding}px`
                }}>{ children.elements }</div> : undefined }
            </div>
        });

        return {
            hasHighlight,
            elements
        };
    }

    return <div style={{
        borderTop: '1px #1a1a1a solid',
        boxShadow: 'inset 0px 0.5px 1px 0px #ffffff17',
        flexShrink: 1,
        overflow: 'auto'
    }}>
        { renderChildren(props.root, 0).elements }
    </div>;
}