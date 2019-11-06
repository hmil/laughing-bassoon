import * as React from 'react';
import { H_LINE_BOTTOM } from '../styles/relief'
import { COLOR_HIGHLIGHT, COLOR_TEXT_HIGHLIGHT } from '../styles/colors';
import { If } from 'ui/react/tsx-helpers';
import { useCallback, useMemo } from 'ui/react/hooks';

const treeViewDefaultState = {
    hiddenNodes: [] as string[]
}

export interface RenderNodeProps<T> {
    node: T;
    onChange: (t: T) => void;
}

function notImplemented(): never {
    throw new Error('Not implemented');
}

export interface TreeViewAdapter<T> {
    isHovered: boolean;
    node: T;
    getChildren(): TreeViewAdapter<T>[];
}

interface TreeViewContext<T> {
    identify(t: T): string;
    hiddenNodes: string[];
    selectedNodes: string[];
    onOver?: (node: T) => void;
    onOut?: (node: T) => void;
    onSelect?: (node: T) => void;
    toggleNode: (id: string) => void;
    renderHeader(node: RenderNodeProps<T>): string | JSX.Element;
    renderBody?: (node: RenderNodeProps<T>) => string | JSX.Element | undefined;
    setChild(parent: T, node: T, i: number): T;
}

const TreeViewContext = React.createContext<TreeViewContext<unknown>>({
    identify: notImplemented,
    hiddenNodes: [],
    selectedNodes: [],
    toggleNode: notImplemented,
    renderHeader: notImplemented,
    setChild: notImplemented
});

// TODO: Many of these props should go in a context
interface TreeNodeProps<T> {
    level: number;
    onChange: (node: T) => void;
    index: number;
    parent: T;
    adapter: TreeViewAdapter<T>;
}

function mouseInteractionCallback<T>(node: T, onOver?: (node: T) => void) {
    return () => onOver && onOver(node);
}

function toggleNodeCallback(id: string, toggleNode: (id: string) => void) {
    return (evt: React.MouseEvent) => {
        if (evt.button !== 0) return;
        evt.stopPropagation();
        toggleNode(id);
    };
}

function onChangeCallback<T>(onChange: (n: T) => void, setChild: TreeViewContext<T>['setChild'], parent: T, index: number) {
    return (n: T) => {
        onChange(setChild(parent, n, index));
    };
}

const TreeNode = React.memo(function _TreeNode<T>(props: TreeNodeProps<any>) {

    const ctx = React.useContext(TreeViewContext as React.Context<TreeViewContext<T>>);

    const node = props.adapter.node;
    const id = ctx.identify(node);
    const children = props.adapter.getChildren();
    const hasChildren = children != null && children.length > 0;
    const isExpanded = ctx.hiddenNodes.indexOf(id) < 0; 
    const padding = props.level * 20 + 4;
    const isSelected = ctx.selectedNodes.indexOf(id) >= 0;
    const currentHasHighlight = props.adapter.isHovered; // >= 0; // || children.hasHighlight;

    const onChange = useCallback(onChangeCallback, [props.onChange, ctx.setChild, props.parent, props.index]);

    const body = ctx.renderBody != null ? ctx.renderBody({ node: node, onChange}) : undefined;

    const onMouseOver = useCallback(mouseInteractionCallback, [node, ctx.onOver]);
    const onMouseOut = useCallback(mouseInteractionCallback, [node, ctx.onOut]);
    const onClick = useCallback(mouseInteractionCallback, [node, ctx.onSelect]);
    const toggleNode = useCallback(toggleNodeCallback, [id, ctx.toggleNode]);

    return (
        <div    key={id} 
                style={(hasChildren && isExpanded) ? H_LINE_BOTTOM : undefined }>
            <div    style={{
                        // paddingRight > paddingLeft to leave space for an eventual sroll bar
                        padding: `6px 15px 6px ${padding + 5}px`,
                        cursor: 'default',
                        backgroundColor: isSelected ? COLOR_HIGHLIGHT : currentHasHighlight ? '#ffffff10' : 'transparent',
                        color: isSelected ? COLOR_TEXT_HIGHLIGHT : undefined,
                    }}
                    onMouseOver={onMouseOver}
                    onMouseOut={onMouseOut}
                    onClick={onClick}>
                <If cond={children.length > 0}>
                    <span style={{
                                paddingRight: '5px',
                                width: '18px',
                                display: 'inline-block'
                            }}
                            onClick={toggleNode}>{
                        isExpanded ? <span>&#9662;</span> : <span>&#9656;</span>
                    }</span>
                </If>
                { ctx.renderHeader({ node: node, onChange}) }
            </div>
            <If cond={body != null && isExpanded === true}>
                <div style={{
                        padding: "5px",
                        ...H_LINE_BOTTOM
                    }}>
                    {body}
                </div>
            </If>
            <If cond={isExpanded}>
                <div style={{
                    // paddingLeft: `${padding}px`
                }}>{
                    children.map((c, i) => <TreeNode
                            index={i}
                            key={i}
                            level={props.level + 1}
                            onChange={onChange}
                            adapter={c}
                            parent={node}></TreeNode>)
                }</div>
            </If>
        </div>
    );
});


export interface TreeViewProps<T> {
    identify(t: T): string;
    setChild(parent: T, node: T, i: number): T;
    adapter: TreeViewAdapter<T>;
    hoveredNodes?: string[];
    selectedNodes?: string[];
    onOver?: (node: T) => void;
    onOut?: (node: T) => void;
    onSelect?: (node: T) => void;
    renderHeader(node: RenderNodeProps<T>): string | JSX.Element;
    renderBody?: (node: RenderNodeProps<T>) => string | JSX.Element | undefined;
    onChange?: (node: T) => void;
}

const EMPTY_SElECTION = [] as Array<string>;

export function TreeView<T>(props: TreeViewProps<T>) {

    const selectedNodes = props.selectedNodes || EMPTY_SElECTION;

    const [state, setState] = React.useState(treeViewDefaultState);

    const toggleNode = React.useCallback((id: string) => {
        const currentNodes = state.hiddenNodes
        const index = currentNodes.indexOf(id);
        setState({
            hiddenNodes: index >= 0 
                    ? [ ...currentNodes.slice(0, index), ...currentNodes.slice(index + 1)]
                    : [ ...state.hiddenNodes, id ]
        });
    }, [state, setState]);

    const TContext = TreeViewContext as React.Context<TreeViewContext<T>>;

    const ctx = useMemo(makeTreeContext, [props.renderBody, props.setChild, state.hiddenNodes, props.identify, props.onOut, props.onOver, props.onSelect, props.renderHeader, selectedNodes, toggleNode])

    return <div>
        <TContext.Provider value={ctx}>

            { props.adapter.getChildren().map((c, i) => <TreeNode
                                index={i}
                                onChange={props.onChange || noop}
                                parent={props.adapter.node}
                                key={i}
                                level={0}
                                adapter={c}
                                ></TreeNode>) } {/*renderChildren(props.root, 0, props.onChange || (() => {})).elements }*/}
        </TContext.Provider>
    </div>;
}

function makeTreeContext<T>(
        renderBody: TreeViewProps<T>['renderBody'],
        setChild: TreeViewProps<T>['setChild'],
        hiddenNodes: string[],
        identify: TreeViewProps<T>['identify'],
        onOut: TreeViewProps<T>['onOut'],
        onOver: TreeViewProps<T>['onOver'],
        onSelect: TreeViewProps<T>['onSelect'],
        renderHeader: TreeViewProps<T>['renderHeader'],
        selectedNodes: string[],
        toggleNode: (id: string) => void): () => TreeViewContext<T> {
    return () => ({
        renderBody: renderBody,
        setChild: setChild,
        hiddenNodes: hiddenNodes,
        identify: identify,
        onOut: onOut,
        onOver: onOver,
        onSelect: onSelect,
        renderHeader: renderHeader,
        selectedNodes: selectedNodes,
        toggleNode: toggleNode,
    });
}

function noop() {}