import * as React from 'react';
import { callback } from 'ui/react/hooks';

import { TreeViewContext } from './TreeViewContext';
import { TreeViewElement } from './TreeViewElement';
import { TreeViewState, TreeViewModel } from './TreeViewState';
import { H_LINE_BOTTOM } from 'ui/styles/relief';
import { If } from 'ui/react/tsx-helpers';


export interface TreeViewProps<T> {
    state: TreeViewState<T>;
    onChange(state: TreeViewState<T>): void;
    renderHeader(node: TreeViewModel<T>): string | JSX.Element;
    onOver?(node: TreeViewModel<T>): void;
    onOut?(node: TreeViewModel<T>): void;
    onSelect?(node: TreeViewModel<T>): void;
    onRequestDrag?(node: TreeViewModel<T>): boolean;
    // Called when node is dropped into parent at position in the children array
    onDrop?(node: TreeViewModel<T>, position: number, parent: TreeViewModel<T> | null): void;
}

interface ScrollRange {
    start: number;
    end: number;
}

const PLACEHOLDER = <div>
    <div style={{
        margin: '2px 4px',
        border: '1px #999 dashed',
        height: '26px'
    }} />
</div>;

export function TreeView<T>(props: TreeViewProps<T>) {

    const onOver = props.onOver || ((node: TreeViewModel<T>) => props.onChange(props.state.hoverNode(node.id)));
    const onOut = props.onOut || ((node: TreeViewModel<T>) => props.onChange(props.state.unhoverNode(node.id)));
    const onSelect = props.onSelect || ((node: TreeViewModel<T>) => props.onChange(props.state.unselectAll().selectNode(node.id)));
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const [ range, setRange ] = React.useState<ScrollRange>({ start: 0, end: 0});
    const onScroll = onScrollHandler(scrollRef, props.state, setRange);

    const [ dragCandidate, setDragCandidate ] = React.useState<TreeViewModel<T> | null>(null);
    const [ dragAnchor, setDragAnchor ] = React.useState(0);
    const [ dragOffset, setDragOffset ] = React.useState(0);

    const dragEnabled = props.onDrop != null && props.onRequestDrag != null;

    // Initialize the virtual window
    React.useEffect(() => {
        if (scrollRef.current != null) {
            setRange(computeRange(scrollRef.current, props.state))
        }
    }, [scrollRef.current, props.state]);

    function dragUpHandler() {
        if (props.state.draggedNode != null) {
            if (props.onDrop != null) {
                props.onChange(props.state.stopDragging());
                const [parent, position] = props.state.getDropInfo();
                props.onDrop(props.state.draggedNode, position, parent);
            }
        }
        if (dragCandidate != null){
            setDragCandidate(null);
        }
    }

    function dragMouveHandler(evt: React.MouseEvent<HTMLDivElement>) {
        const currentY = evt.clientY;
        if ((evt.buttons & 0x01) === 0) {
            setDragAnchor(0);
            setDragCandidate(null);
        } else if (dragCandidate != null && props.state.isDragging() === false) {
            if (Math.abs(dragAnchor - currentY) > 3) {
                setDragAnchor(currentY);
                props.onChange(props.state.startDragNode(dragCandidate.id));
            }
        } else if (props.state.isDragging() === true) {
            setDragAnchor(currentY);
            const relativeY = evt.clientY - evt.currentTarget.getBoundingClientRect().y;
            const index = props.state.getIndexAtY(relativeY, false);
            props.onChange(props.state.updateDropIndex(index));
        } else {
            setDragAnchor(currentY);
        }
    }

    function dragDownHandler(model: TreeViewModel<T>) {
        return (evt: React.MouseEvent<HTMLDivElement>) => {
            if (props.onDrop == null || props.onRequestDrag == null || props.onRequestDrag(model) === false) {
                return;
            }
            setDragAnchor(evt.clientY);
            setDragCandidate(model);
            setDragOffset(evt.clientY - evt.currentTarget.getBoundingClientRect().y)
        };
    }

    const TContext = TreeViewContext as React.Context<TreeViewContext<T>>;
    return <TContext.Provider value={{
        state: props.state,
        onChange: props.onChange,
        renderHeader: props.renderHeader,
        onOver, onOut, onSelect,
        dragCandidate,
        dragEnabled
    }}>
        <div style={{
                height: '100%',
                overflow: 'auto',
                userSelect: 'none'
            }}
            ref={scrollRef}
            onScroll={onScroll}>
            <div onMouseMove={dragMouveHandler}
                onMouseUp={dragUpHandler}
                style={{
                    height: props.state.totalHeight,
                    position: 'relative'
                }}
            >
                <div style={{
                    position: 'absolute',
                    top: `${props.state.getYForNode(range.start)}px`,
                    width: '100%',
                    overflow: 'hidden'
                }}>
                    { props.state.data.slice(range.start, range.end).map(d => {
                        if (d.type === 'spacer') {
                            return <div style={H_LINE_BOTTOM} />
                        } else if (d.type === 'drag-placeholder') {
                            return PLACEHOLDER;
                        } else {
                            return <TreeViewElement data={d} key={d.id} onDragDown={dragDownHandler(d)}/>
                        }
                    }) }
                </div>

                <If cond={props.state.isDragging()}>
                    <div style={{
                        position: 'fixed',
                        opacity: '0.5',
                        width: '100%',
                        top: `${dragAnchor - dragOffset}px`
                    }}>
                        <TreeViewElement data={props.state.draggedNode!} onDragDown={noop}/>
                    </div>
                </If>
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

function noop() { }
