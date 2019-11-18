import * as React from 'react';
import { callback } from 'ui/react/hooks';

import { TreeViewContext } from './TreeViewContext';
import { TreeViewElement } from './TreeViewElement';
import { TreeViewState, TreeViewModel } from './TreeViewState';
import { H_LINE_BOTTOM } from 'ui/styles/relief';


export interface TreeViewProps<T> {
    state: TreeViewState<T>;
    onChange(state: TreeViewState<T>): void;
    renderHeader(node: TreeViewModel<T>): string | JSX.Element;
    onOver?(node: TreeViewModel<T>): void;
    onOut?(node: TreeViewModel<T>): void;
    onSelect?(node: TreeViewModel<T>): void;
}

interface ScrollRange {
    start: number;
    end: number;
}

// TODO: Virtualize scroll of the view
export function TreeView<T>(props: TreeViewProps<T>) {

    const onOver = props.onOver || ((node: TreeViewModel<T>) => props.onChange(props.state.hoverNode(node.id)));
    const onOut = props.onOut || ((node: TreeViewModel<T>) => props.onChange(props.state.unhoverNode(node.id)));
    const onSelect = props.onSelect || ((node: TreeViewModel<T>) => props.onChange(props.state.unselectAll().selectNode(node.id)));
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [ range, setRange ] = React.useState<ScrollRange>({ start: 0, end: 0});
    const onScroll = onScrollHandler(scrollRef, props.state, setRange);

    // Initialize the virtual window
    React.useEffect(() => {
        if (scrollRef.current != null) {
            setRange(computeRange(scrollRef.current, props.state))
        }
    }, [scrollRef.current, props.state]);

    const TContext = TreeViewContext as React.Context<TreeViewContext<T>>;
    return <TContext.Provider value={{
        state: props.state,
        onChange: props.onChange,
        renderHeader: props.renderHeader,
        onOver, onOut, onSelect
    }}>
        <div style={{
            height: '100%',
            overflow: 'auto'
        }}
            ref={scrollRef}
            onScroll={onScroll}>
            <div style={{
                height: props.state.totalHeight,
                position: 'relative'
            }}>
                <div style={{
                    position: 'absolute',
                    top: `${props.state.getYForNode(range.start)}px`,
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    { props.state.data.slice(range.start, range.end).map(d => {
                        if (d.type === 'spacer') {
                            return <div style={H_LINE_BOTTOM}/>
                        } else {
                            return <TreeViewElement data={d} key={d.id}/>
                        }
                    }) }
                </div>
            </div>
        </div>
    </TContext.Provider>
}

const onScrollHandler = callback((ref: React.RefObject<HTMLDivElement>, state: TreeViewState<unknown>, setRange: (range: ScrollRange) => void) => () => {
    if (ref.current == null) {
        return;
    }
    setRange(computeRange(ref.current, state));
});


function computeRange(scrollElement: HTMLDivElement, state: TreeViewState<unknown>): ScrollRange {
    return {
        start: state.getIndexAtY(scrollElement.scrollTop - 100, false),
        end: state.getIndexAtY(scrollElement.scrollTop + scrollElement.clientHeight + 100, true)
    }
}