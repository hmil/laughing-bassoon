import { TreeViewNode } from './TreeViewState';
import { memo, callback } from 'ui/react/hooks';
import { COLOR_HIGHLIGHT, COLOR_TEXT_HIGHLIGHT } from 'ui/styles/colors';
import * as React from 'react';
import { If } from 'ui/react/tsx-helpers';



const TOGGLE_STYLE: React.CSSProperties = {
    paddingRight: '5px',
    width: '18px',
    display: 'inline-block'
};
const Toggle = React.memo(function _Toggle(props: { isExpanded: boolean; onToggle: () => void}) {
    return <span 
    onClick={toggleHandler(props.onToggle)}
    style={TOGGLE_STYLE}>{
        props.isExpanded ? <span>&#9662;</span> : <span>&#9656;</span>
    }</span>;
});

const toggleHandler = callback((onToggle: () => void) => (evt: React.MouseEvent) => {
    evt.stopPropagation();
    onToggle();
});

const treeViewHeaderStyle = memo((padding: number, isSelected: boolean, hasHighlight: boolean): React.CSSProperties => ({
    // paddingRight > paddingLeft to leave space for an eventual sroll bar
    padding: `6px 15px 6px ${padding + 5}px`,
    cursor: 'default',
    backgroundColor: isSelected ? COLOR_HIGHLIGHT : hasHighlight ? '#ffffff10' : 'transparent',
    color: isSelected ? COLOR_TEXT_HIGHLIGHT : undefined,
}));

interface TreeViewHeaderProps<T> {
    padding: number;
    isSelected: boolean;
    hasHighlight: boolean;
    isExpanded: boolean;
    renderHeader: (node: TreeViewNode<T>) => string | JSX.Element;
    data: TreeViewNode<T>;
    toggleNode: () => void;
    onOver: () => void;
    onOut: () => void;
    onClick: () => void;
}

export const TreeViewHeader = React.memo(function _TreeViewHeader<T>(props: TreeViewHeaderProps<T>) {
    return <div 
        style={treeViewHeaderStyle(props.padding, props.isSelected, props.hasHighlight)}
        onMouseOver={props.onOver}
        onMouseOut={props.onOut}
        onClick={props.onClick}
    >
        <If cond={props.data.children.length > 0}>
            <Toggle isExpanded={props.isExpanded} onToggle={props.toggleNode}/>
        </If>
        { props.renderHeader(props.data) }
    </div>;
});
