import * as React from 'react';

import { TreeViewContext } from './TreeViewContext';
import { TreeViewHeader } from './TreeViewHeader';
import { TreeViewModel, TreeViewState } from './TreeViewState';
import { callback } from 'ui/react/hooks';

interface TreeViewElementProps<T> {
    data: TreeViewModel<T>;
}

export function TreeViewElement<T>(props: TreeViewElementProps<T>) {

    const { state, renderHeader, onChange, onOver, onOut, onSelect } = React.useContext(TreeViewContext);
    
    const isHovered = state.hoveredNodes.indexOf(props.data.id) >= 0;
    const isSelected = state.selectedNodes.indexOf(props.data.id) >= 0;
    const isExpanded = state.collapsedNodes.indexOf(props.data.id) < 0;
    const padding = props.data.level * 20 + 4;

    return <div key={props.data.id} /* style={(hasChildren && isExpanded) ? H_LINE_BOTTOM : undefined } TODO: insert separator lines instead*/>
        <TreeViewHeader 
                data={props.data}
                renderHeader={renderHeader}
                hasHighlight={isHovered}
                isSelected={isSelected}
                isExpanded={isExpanded}
                onOver={eventHandlerCallback(props.data, onOver)}
                onOut={eventHandlerCallback(props.data, onOut)}
                onClick={eventHandlerCallback(props.data, onSelect)}
                toggleNode={toggleNodeCallback(state, props.data, onChange)}
                padding={padding}  />
    </div>
}

const eventHandlerCallback = callback(function<T>(data: TreeViewModel<T>, handler: (data: TreeViewModel<T>) => void) { return () => handler(data) })
const toggleNodeCallback = callback(function<T>(state: TreeViewState<T>, data: TreeViewModel<T>, onChange: (data: TreeViewState<T>) => void) {
    return  () => onChange(state.toggleNode(data))
});