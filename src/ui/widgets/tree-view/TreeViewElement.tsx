import * as React from 'react';
import { If } from 'ui/react/tsx-helpers';
import { H_LINE_BOTTOM } from 'ui/styles/relief';

import { TreeViewHeader } from './TreeViewHeader';
import { TreeViewNode } from './TreeViewState';
import { TreeViewContext } from './TreeViewContext';

interface TreeViewElementProps<T> {
    data: TreeViewNode<T>;
    level: number;
}

export function TreeViewElement<T>(props: TreeViewElementProps<T>) {

    const { state, renderHeader, onChange, onOver, onOut, onSelect } = React.useContext(TreeViewContext);
    
    const hasChildren = props.data.children.length > 0;
    const isHovered = state.hoveredNodes.indexOf(props.data.id) >= 0;
    const isSelected = state.selectedNodes.indexOf(props.data.id) >= 0;
    const isExpanded = state.collapsedNodes.indexOf(props.data.id) < 0;
    const padding = props.level * 20 + 4;

    return <div key={props.data.id} style={(hasChildren && isExpanded) ? H_LINE_BOTTOM : undefined }>
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
        <If cond={isExpanded}>
            <div>
            {
                props.data.children.map(c => <TreeViewElement
                        key={c.id}
                        level={props.level + 1}
                        data={c}
                    ></TreeViewElement>)
            }
            </div>
        </If>
    </div>
}
