import * as React from 'react';
import { HexViewContext } from '../Context';
import { CHUNK_SIZE } from '../Config';
import { AppContext } from 'projects/forge/src/state/AppContext';
import { hoverHighlight, selectNode } from 'projects/forge/src/state/AppActions';

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
        backgroundColor: `rgba(${props.color}, ${props.hover ? '0.35' : '0.25'})`,
        // mixBlendMode: 'screen',
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

function Highlight({ start, adapter, end, color, isActive, id}: HighlightProps) {

    const startX = start % 16;
    const endX = end % 16;
    const startY = Math.floor(start / 16);
    const endY = Math.floor(end / 16);

    const appContext = React.useContext(AppContext);
    function onMouseEnter() {
        return () => {
            appContext.dispatch(hoverHighlight({id}));
        };
    }

    function onClick() {
        appContext.dispatch(selectNode({id}));
    }

    function showActive() {
        return /*hover !== 'none' ||*/ isActive === true;
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
            onMouseEnter={onMouseEnter()}
            onClick={onClick}
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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>
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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>
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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>
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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>

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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>
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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>
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
                onMouseEnter={onMouseEnter()}
                onClick={onClick}></div>
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

    const { highlights } = React.useContext(HexViewContext);
    const appContext = React.useContext(AppContext);

    return <div style={{
        position: 'relative'
    }} >
        {highlights.filter(h => h.start >= props.offset && h.end <= props.offset + CHUNK_SIZE).map(h =>
            <Highlight key={h.nodeId} 
                    id={h.nodeId} 
                    isActive={h.nodeId === appContext.state.hoveredNode} 
                    adapter={props.adapter} 
                    color={h.color} 
                    start={h.start - props.offset} 
                    end={h.end - props.offset}></Highlight>
        )}
        { props.selection.start >= props.offset && props.selection.end <= props.offset + CHUNK_SIZE ? 
            <Highlight id={-1} 
                adapter={props.adapter} 
                color="255, 0, 0" 
                start={props.selection.start - props.offset} 
                end={props.selection.end - props.offset} 
                isActive={props.selection.isActive || appContext.state.hoveredNode === -1}></Highlight>
            : undefined
        }
    </div>
}