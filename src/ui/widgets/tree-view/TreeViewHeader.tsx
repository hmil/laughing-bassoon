import { TreeViewModel } from './TreeViewState';
import { memo, callback } from 'ui/react/hooks';
import { COLOR_HIGHLIGHT, COLOR_TEXT_HIGHLIGHT, COLOR_BG_2, COLOR_BG_3 } from 'ui/styles/colors';
import * as React from 'react';
import { If } from 'ui/react/tsx-helpers';



const TOGGLE_STYLE: React.CSSProperties = {
    paddingRight: '5px',
    paddingTop: '6px',
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

const treeViewHeaderStyle = memo((
        padding: number,
        isSelected: boolean,
        hasHighlight: boolean,
        isDragging: boolean,
        canDrag: boolean): React.CSSProperties => ({
    // paddingRight > paddingLeft to leave space for an eventual sroll bar
    padding: `0 15px 0 ${padding + 5}px`,
    cursor: canDrag ? isDragging ? 'grabbing' : 'grab' : 'default',
    height: '30px',
    whiteSpace: 'nowrap',
    backgroundColor: isSelected ? COLOR_HIGHLIGHT : hasHighlight ? COLOR_BG_3 : COLOR_BG_2,
    color: isSelected ? COLOR_TEXT_HIGHLIGHT : undefined,
    display: 'flex'
}));

interface TreeViewHeaderProps<T> {
    isDragging: boolean;
    padding: number;
    isSelected: boolean;
    hasHighlight: boolean;
    isExpanded: boolean;
    dragEnabled: boolean;
    renderHeader: (node: TreeViewModel<T>) => string | JSX.Element;
    data: TreeViewModel<T>;
    toggleNode: () => void;
    onOver: () => void;
    onOut: () => void;
    onClick: () => void;
    onMouseDown: (evt: React.MouseEvent<HTMLDivElement>) => void;
}

export const TreeViewHeader = React.memo(function _TreeViewHeader<T>(props: TreeViewHeaderProps<T>) {
    return <div 
        style={treeViewHeaderStyle(props.padding, props.isSelected, props.hasHighlight, props.isDragging, props.dragEnabled)}
        onMouseOver={props.onOver}
        onMouseOut={props.onOut}
        onClick={props.onClick}
        onMouseDown={props.onMouseDown}
    >
        <If cond={props.data.hasChildren}>
            <Toggle isExpanded={props.isExpanded} onToggle={props.toggleNode}/>
        </If>
        <div style={{ flexGrow: 1}}>
            { props.renderHeader(props.data) }
        </div>
    </div>;
});
