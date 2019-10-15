import * as React from 'react';
import { useState } from 'react';
import { HexViewContext } from './Context';
import { hoverHighlight } from './HexViewActions';
import { CHUNK_SIZE } from './Config';

const lineHeight = 15;


function highlightStyle(props: {
            color: string;
            top: number;
            left: number;
            width: number;
            bottom: number;
            hover: boolean;
        }): React.CSSProperties {
    return {
        position: 'absolute',
        borderTop: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`,
        borderBottom: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`,
        borderLeft: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`,
        borderRight: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`,
        backgroundColor: `rgba(${props.color}, 0.1)`,
        left: `calc(${props.left}ch - 1px)`,
        width: `calc(${props.width}ch + 1px)`,
        top: `${props.top * lineHeight}px`,
        height: `${Math.max((props.bottom - props.top + 1) * lineHeight - 1, 0)}px`
    }
}


interface HighlightProps {
    start: number;
    end: number;
    color: string;
    isActive?: boolean;
    adapter: HighlightAdapter;
    id: number;
}

type Direction = 'top' | 'left' | 'bottom' | 'right' | 'center';

function Highlight({ start, adapter, end, color, isActive, id}: HighlightProps) {

    const startX = start % 16;
    const endX = end % 16;
    const startY = Math.floor(start / 16);
    const endY = Math.floor(end / 16);

    const {state, dispatch} = React.useContext(HexViewContext);
    const [hover, setHover] = useState<'none' | Direction>('none');
    function onMouseEnter(direction: Direction) {
        return () => {
            setHover(direction);
            dispatch(hoverHighlight({id}));
        };
    }
    function onMouseLeave(direction: Direction) {
        return () => {
            if (hover === direction) {
                setHover('none');
                if (state.hoveredHighlight === id) {
                    dispatch(hoverHighlight({ id: null }));
                }
            }
        }
    }

    function showActive() {
        return hover !== 'none' || isActive === true;
    }

    if (endY - startY === 0) { // single line
        return <div
            style={highlightStyle({
                top: startY,
                bottom: startY,
                left: adapter.mapByteToCharOffset(startX),
                width: adapter.mapByteToCharOffset(endX) - adapter.mapByteToCharOffset(startX) + adapter.byteSize,
                color: color,
                hover: showActive()
            })}
            onMouseEnter={onMouseEnter('top')}
            onMouseLeave={onMouseLeave('top')}
        ></div>;

    } else if (endY - startY === 1 && startX > endX) { // Two lines, No overlap
        return <div>
            <div
                style={{
                    ...highlightStyle({
                        top: startY,
                        bottom: startY,
                        left: adapter.mapByteToCharOffset(startX),
                        width: adapter.mapByteToCharOffset(15) - adapter.mapByteToCharOffset(startX) + adapter.byteSize,
                        color: color,
                        hover: showActive()
                    }),
                    borderRight: 'none'
                }}
                onMouseEnter={onMouseEnter('top')}
                onMouseLeave={onMouseLeave('top')}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: endY,
                        bottom: endY,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(endX) + adapter.byteSize,
                        color: color,
                        hover: showActive()
                    }),
                    borderLeft: 'none'
                }}
                onMouseEnter={onMouseEnter('top')}
                onMouseLeave={onMouseLeave('top')}></div>
        </div>;
    } else {
        return <div>
            <div
                style={{
                    ...highlightStyle({
                        top: startY,
                        bottom: startY,
                        left: adapter.mapByteToCharOffset(startX),
                        width: adapter.mapByteToCharOffset(15) - adapter.mapByteToCharOffset(startX) + adapter.byteSize,
                        color: color,
                        hover: showActive()
                    }),
                    borderBottom: 'none',
                    borderRight: 'none'
                }}
                onMouseEnter={onMouseEnter('top')}
                onMouseLeave={onMouseLeave('top')}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: startY + 1,
                        bottom: endY - 1,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(15) + adapter.byteSize,
                        color: color,
                        hover: showActive()
                    }),
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                }}
                onMouseEnter={onMouseEnter('center')}
                onMouseLeave={onMouseLeave('center')}></div>

            <div
                style={{
                    ...highlightStyle({
                        top: endY - 1,
                        bottom: endY - 1,
                        left: adapter.mapByteToCharOffset(endX) + adapter.byteSize,
                        width: adapter.mapByteToCharOffset(15) - adapter.mapByteToCharOffset(endX),
                        color: color,
                        hover: showActive()
                    }),
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    backgroundColor: 'none'
                }}
                onMouseEnter={onMouseEnter('right')}
                onMouseLeave={onMouseLeave('right')}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: startY + 1,
                        bottom: startY + 1,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(startX),
                        color: color,
                        hover: showActive()
                    }),
                    borderBottom: 'none',
                    borderRight: 'none',
                    borderLeft: 'none',
                    backgroundColor: 'none'
                }}
                onMouseEnter={onMouseEnter('left')}
                onMouseLeave={onMouseLeave('left')}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: endY,
                        bottom: endY,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(endX) + adapter.byteSize,
                        color: color,
                        hover: showActive()
                    }),
                    borderTop: 'none',
                    borderLeft: 'none'
                }}
                onMouseEnter={onMouseEnter('bottom')}
                onMouseLeave={onMouseLeave('bottom')}></div>
        </div>;
    }
}

export interface HighlightAdapter {
    /**
     * Maps a line offset in bytes into an offset in printable character width.
     */
    mapByteToCharOffset: (byte: number) => number;

    /**
     * width (in printable characters) occupied by one byte.
     */
    byteSize: number;
}


export interface HexViewHighlightsProps {
    selection: {
        start: number;
        end: number;
        isActive: boolean;
    };
    adapter: HighlightAdapter;
    offset: number;
}

export function HexViewHighlights(props: HexViewHighlightsProps) {

    const { state } = React.useContext(HexViewContext);

    return <div style={{
        position: 'relative'
    }} >
        {state.highlights.filter(h => h.start >= props.offset && h.end <= props.offset + CHUNK_SIZE).map((h, id) =>
            <Highlight key={id} 
                    id={id} 
                    isActive={id === state.hoveredHighlight} 
                    adapter={props.adapter} 
                    color={h.color} 
                    start={h.start - props.offset} 
                    end={h.end - props.offset}></Highlight>
        )}
        <Highlight id={-1} 
                adapter={props.adapter} 
                color="255, 0, 0" 
                start={props.selection.start} 
                end={props.selection.end} 
                isActive={props.selection.isActive || state.hoveredHighlight === -1}></Highlight>
    </div>
}