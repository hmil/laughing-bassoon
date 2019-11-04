import * as React from 'react';
import { H_LINE_BOTTOM } from '../styles/relief'
import { COLOR_HIGHLIGHT, COLOR_TEXT_HIGHLIGHT } from '../styles/colors';

const treeViewDefaultState = {
    hiddenNodes: [] as string[]
}

export interface RenderNodeProps<T> {
    node: T;
    onChange: (t: T) => void;
}

export interface TreeViewProps<T> {
    identify(t: T): string;
    getChildren(t: T): T[];
    setChild(parent: T, node: T, i: number): T;
    root: T;
    hoveredNodes?: string[];
    selectedNodes?: string[];
    onHover?: (node: T) => void;
    onSelect?: (node: T) => void;
    renderHeader(node: RenderNodeProps<T>): string | JSX.Element;
    renderBody?: (node: RenderNodeProps<T>) => string | JSX.Element | undefined;
    onChange?: (node: T) => void;
}

export function TreeView<T>(props: TreeViewProps<T>) {

    const hoveredNodes = props.hoveredNodes || [];
    const selectedNodes = props.selectedNodes || [];

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

    function renderChildren(node: T, level: number, onChangeParent: (n: T) => void) {
        let hasHighlight = false;
        const elements = props.getChildren(node).map((c, i) => {
            const id = props.identify(c);
            const children = renderChildren(c, level + 1, onChange);
            const currentHasHighlight = hoveredNodes.indexOf(id) >= 0 || children.hasHighlight;
            const isExpanded = state.hiddenNodes.indexOf(id) < 0; 
            const isSelected = selectedNodes.indexOf(id) >= 0;
            const padding = level * 20 + 4;
            const subChildren = props.getChildren(c);
            const hasChildren = subChildren != null && subChildren.length > 0;
            hasHighlight = hasHighlight || currentHasHighlight;

            function onChange(n: T) {
                onChangeParent(props.setChild(node, n, i));
            }

            const body = props.renderBody != null ? props.renderBody({ node: c, onChange}) : undefined;

            return <div key={id} style={(hasChildren && isExpanded) ? H_LINE_BOTTOM : undefined }>
                <div style={{
                            // paddingRight > paddingLeft to leave space for an eventual sroll bar
                            padding: `6px 15px 6px ${padding + 5}px`,
                            cursor: 'default',
                            backgroundColor: isSelected ? COLOR_HIGHLIGHT : currentHasHighlight ? '#ffffff10' : 'transparent',
                            color: isSelected ? COLOR_TEXT_HIGHLIGHT : undefined,
                        }}
                        onMouseEnter={() => props.onHover && props.onHover(c)}
                        onClick={() => props.onSelect && props.onSelect(c)}>
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
                    { props.renderHeader({ node: c, onChange}) }
                </div>
                { body != null && isExpanded === true ?
                    <div style={{
                            padding: "5px",
                            ...H_LINE_BOTTOM
                        }}>
                        {body}
                    </div> :
                undefined }
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

    return <div>
        { renderChildren(props.root, 0, props.onChange || (() => {})).elements }
    </div>;
}