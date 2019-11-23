import * as React from 'react';

import { TreeViewContext } from './TreeViewContext';
import { TreeViewHeader } from './TreeViewHeader';
import { TreeViewModel, TreeViewState } from './TreeViewState';
import { callback } from 'ui/react/hooks';

interface TreeViewElementProps<T> {
    data: TreeViewModel<T>;
    onDragDown: (evt: React.MouseEvent<HTMLDivElement>) => void;
}

export function TreeViewElement<T>(props: TreeViewElementProps<T>) {

    const { state, renderHeader, onChange, onOver, onOut, onSelect, dragCandidate, dragEnabled } = React.useContext(TreeViewContext);
    
    const isHovered = state.hoveredNodes.indexOf(props.data.id) >= 0;
    const isSelected = state.selectedNodes.indexOf(props.data.id) >= 0;
    const isExpanded = state.collapsedNodes.indexOf(props.data.id) < 0;
    const padding = props.data.level * 20 + 4;

    return <div key={props.data.id}>
        <TreeViewHeader 
                isDragging={dragCandidate != null && props.data.id === dragCandidate.id}
                dragEnabled={dragEnabled}
                data={props.data}
                renderHeader={renderHeader}
                hasHighlight={isHovered}
                isSelected={isSelected}
                isExpanded={isExpanded}
                onOver={eventHandlerCallback(props.data, onOver)}
                onOut={eventHandlerCallback(props.data, onOut)}
                onClick={eventHandlerCallback(props.data, onSelect)}
                onMouseDown={props.onDragDown}
                toggleNode={toggleNodeCallback(state, props.data, onChange)}
                padding={padding}  />
    </div>
}

const eventHandlerCallback = callback(function<T>(data: TreeViewModel<T>, handler: (data: TreeViewModel<T>) => void) { return () => handler(data) })
const toggleNodeCallback = callback(function<T>(state: TreeViewState<T>, data: TreeViewModel<T>, onChange: (data: TreeViewState<T>) => void) {
    return  () => onChange(state.toggleNode(data))
});