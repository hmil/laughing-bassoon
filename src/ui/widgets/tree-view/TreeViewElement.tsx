import * as React from 'react';

import { TreeViewContext } from './TreeViewContext';
import { TreeViewHeader } from './TreeViewHeader';
import { TreeViewModel } from './TreeViewState';

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
                onOver={() => onOver(props.data)}
                onOut={() => onOut(props.data)}
                onClick={() => onSelect(props.data)}
                toggleNode={() => onChange(state.toggleNode(props.data.id))}
                padding={padding}  />
    </div>
}
