import * as React from 'react';
import { memo, useCallback } from 'ui/react/hooks';
import { If } from 'ui/react/tsx-helpers';

import { COLOR_HIGHLIGHT, COLOR_TEXT_HIGHLIGHT } from '../styles/colors';
import { H_LINE_BOTTOM } from '../styles/relief';

const treeViewDefaultState = {
    hiddenNodes: [] as number[]
}

function notImplemented(): never {
    throw new Error('Not implemented');
}

export interface TreeViewAdapter<T> {
    isHovered: boolean;
    isSelected: boolean;
    node: T;
    useChildren(): Array<() => TreeViewAdapter<T>>;
}

interface TreeViewContext<T> {
    hiddenNodes: number[];
    onOver?: (node: T) => void;
    onOut?: (node: T) => void;
    onSelect?: (node: T) => void;
    toggleNode: (id: number) => void;
    renderHeader(node: T): string | JSX.Element;
    renderBody?: (node: T) => string | JSX.Element | undefined;
}

const TreeViewContext = React.createContext<TreeViewContext<unknown>>({
    hiddenNodes: [],
    toggleNode: notImplemented,
    renderHeader: notImplemented,
});

// TODO: Many of these props should go in a context
interface TreeNodeProps<T extends TreeElement<T>> {
    node: T;
    level: number;
    index: number;
}

function mouseInteractionCallback<T>(node: T, onEvent?: (node: T) => void) {
    return () => onEvent && onEvent(node);
}

function toggleNodeCallback(id: number, toggleNode: (id: number) => void) {
    return (evt: React.MouseEvent) => {
        if (evt.button !== 0) return;
        evt.stopPropagation();
        toggleNode(id);
    };
}

const TreeNode = React.memo(function _TreeNode<T extends TreeElement<T>>(props: TreeNodeProps<T>) {

    const ctx = React.useContext(TreeViewContext as React.Context<TreeViewContext<T>>);

    const children = props.node.children;

    const node = props.node;
    const id = props.node.id;
    const hasChildren = children != null && children.length > 0;
    const isExpanded = ctx.hiddenNodes.indexOf(id) < 0; 
    const padding = props.level * 20 + 4;
    const isSelected = props.node.isSelected;
    const currentHasHighlight = props.node.isHovered; // >= 0; // || children.hasHighlight;

    const body = ctx.renderBody != null ? ctx.renderBody(node) : undefined;

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
                { ctx.renderHeader(node) }
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
                            node={c}
                            index={i}
                            key={i}
                            level={props.level + 1}
                        ></TreeNode>)
                }</div>
            </If>
        </div>
    );
});

export type TreeElement<T extends TreeElement<T>> = {
    readonly children: ReadonlyArray<T>;
    readonly id: number;
    readonly isSelected: boolean;
    readonly isHovered: boolean;
}

export interface TreeViewProps<T extends TreeElement<T>> {
    root: T;
    onOver?: (node: T) => void;
    onOut?: (node: T) => void;
    onSelect?: (node: T) => void;
    renderHeader(node: T): string | JSX.Element;
    renderBody?: (node: T) => string | JSX.Element | undefined;
}

const makeTreeContext = memo(<T extends TreeElement<T>>(
        renderBody: TreeViewProps<T>['renderBody'],
        hiddenNodes: number[],
        onOut: TreeViewProps<T>['onOut'],
        onOver: TreeViewProps<T>['onOver'],
        onSelect: TreeViewProps<T>['onSelect'],
        renderHeader: TreeViewProps<T>['renderHeader'],
        toggleNode: (id: number) => void): TreeViewContext<T> => ({
    renderBody: renderBody,
    hiddenNodes: hiddenNodes,
    onOut: onOut,
    onOver: onOver,
    onSelect: onSelect,
    renderHeader: renderHeader,
    toggleNode: toggleNode,
}));

export function TreeView<T extends TreeElement<T>>(props: TreeViewProps<T>) {
    const [state, setState] = React.useState(treeViewDefaultState);

    const toggleNode = React.useCallback((id: number) => {
        const currentNodes = state.hiddenNodes
        const index = currentNodes.indexOf(id);
        setState({
            hiddenNodes: index >= 0 
                    ? [ ...currentNodes.slice(0, index), ...currentNodes.slice(index + 1)]
                    : [ ...state.hiddenNodes, id ]
        });
    }, [state, setState]);

    const TContext = TreeViewContext as React.Context<TreeViewContext<T>>;

    const ctx = makeTreeContext<T>(props.renderBody, state.hiddenNodes, props.onOut, props.onOver, props.onSelect, props.renderHeader, toggleNode);

    return <div>
        <TContext.Provider value={ctx}>
            <TreeViewChildren
                data={props.root.children}
            ></TreeViewChildren>
        </TContext.Provider>
    </div>;
}

function TreeViewChildren<T extends TreeElement<T>>(props: { data: ReadonlyArray<TreeElement<T>> }) {
    return <React.Fragment>
        { props.data.map((c, i) => <TreeNode
            node={c}
            index={i}
            key={i}
            level={0}
            ></TreeNode>)
        }
    </React.Fragment>
}
