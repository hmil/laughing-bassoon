import { FileStructureNode } from 'ui/domain/structure/Structure';
import * as React from 'react';
import { AppActions } from 'ui/state/AppReducer';
import { callback } from 'ui/react/hooks';
import { If } from 'ui/react/tsx-helpers';

import { hoverStructureNode, selectStructureNode } from 'ui/state/AppActions';
import { AppContext } from 'ui/state/AppContext';
import { CHUNK_SIZE } from '../Config';
import { HexViewContext } from '../Context';


const lineHeight = 15;

function highlightStyle(props: {
            color: string;
            top: number;
            left: number;
            width: number;
            bottom: number;
            hover: boolean;
            overflowTop: boolean;
            overflowBottom: boolean;
        }): React.CSSProperties {
    return {
        position: 'absolute',
        borderLeft: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`,
        borderRight: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`,
        backgroundColor: `rgba(${props.color}, ${props.hover ? '0.7' : '0.5'})`,
        left: `calc(${props.left}ch - 1px)`,
        width: `calc(${props.width}ch + 1px)`,
        top: `${props.top * lineHeight + 1}px`,
        height: `${Math.max((props.bottom - props.top + 1) * lineHeight, 0)}px`,
        ...(props.overflowTop ? {} : {borderTop: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`}),
        ...(props.overflowBottom ? {} : {borderBottom: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`}),
    }
}


interface HighlightProps {
    start: number;
    end: number;
    color: string;
    adapter: HighlightAdapter;
    node: FileStructureNode;
}

const onEnterCallback = callback((dispatch: React.Dispatch<AppActions>, node: FileStructureNode) => () => {
    dispatch(hoverStructureNode(node));
});

const onClickCallback = callback((dispatch: React.Dispatch<AppActions>, node: FileStructureNode) => () => dispatch(selectStructureNode(node)));

const Highlight = React.memo(function _Highlight({ start, adapter, end, color, node}: HighlightProps) {
    const appContext = React.useContext(AppContext);
    const { selectedNodes, hoveredNodes } = React.useContext(HexViewContext);

    const isSelected = selectedNodes.indexOf(`${node.id}`) >= 0;
    const isActive = hoveredNodes.indexOf(`${node.id}`) >= 0;

    if (start >= end) {
        // Can't highlight something which has no width
        return null;
    }

    let startX = start % 16;
    let endX = (end - 1) % 16;
    let startY = Math.floor(start / 16);
    let endY = Math.floor((end - 1) / 16);
    const overflowTop = startY < 0;
    const overflowBottom = endY >= Math.floor(CHUNK_SIZE / 16);

    if (overflowTop) {
        startX = 0;
        startY = 0;
    }
    if (overflowBottom) {
        endY = Math.floor(CHUNK_SIZE / 16) - 1;
        endX = 15;
    }

    if (isSelected) {
        color = '183, 151, 0';
    }

    
    const onMouseEnter = onEnterCallback(appContext.dispatch, node);
    const onClick = onClickCallback(appContext.dispatch, node);

    const showActive = isSelected || isActive;

    if (endY - startY === 0) { // single line
        return <div
            style={highlightStyle({
                top: startY,
                bottom: startY,
                left: adapter.mapByteToCharOffset(startX),
                width: adapter.mapByteToCharOffset(endX) - adapter.mapByteToCharOffset(startX) + adapter.byteSize,
                color: color,
                hover: showActive,
                overflowTop, overflowBottom
            })}
            onMouseEnter={onMouseEnter}
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
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderRight: 'none'
                }}
                onMouseEnter={onMouseEnter}
                onClick={onClick}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: endY,
                        bottom: endY,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(endX) + adapter.byteSize,
                        color: color,
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderLeft: 'none'
                }}
                onMouseEnter={onMouseEnter}
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
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderBottom: 'none',
                    borderRight: 'none'
                }}
                onMouseEnter={onMouseEnter}
                onClick={onClick}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: startY + 1,
                        bottom: endY - 1,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(15) + adapter.byteSize,
                        color: color,
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    borderBottom: 'none',
                }}
                onMouseEnter={onMouseEnter}
                onClick={onClick}></div>

            <div
                style={{
                    ...highlightStyle({
                        top: endY - 1,
                        bottom: endY - 1,
                        left: adapter.mapByteToCharOffset(endX) + adapter.byteSize,
                        width: adapter.mapByteToCharOffset(15) - adapter.mapByteToCharOffset(endX),
                        color: color,
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    backgroundColor: 'none'
                }}
                onMouseEnter={onMouseEnter}
                onClick={onClick}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: startY + 1,
                        bottom: startY + 1,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(startX),
                        color: color,
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderBottom: 'none',
                    borderRight: 'none',
                    borderLeft: 'none',
                    backgroundColor: 'none'
                }}
                onMouseEnter={onMouseEnter}
                onClick={onClick}></div>
            <div
                style={{
                    ...highlightStyle({
                        top: endY,
                        bottom: endY,
                        left: adapter.mapByteToCharOffset(0),
                        width: adapter.mapByteToCharOffset(endX) + adapter.byteSize,
                        color: color,
                        hover: showActive,
                        overflowTop, overflowBottom
                    }),
                    borderTop: 'none',
                    borderLeft: 'none'
                }}
                onMouseEnter={onMouseEnter}
                onClick={onClick}></div>
        </div>;
    }
});

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

export const RecursiveHighlight = React.memo(function _RecursiveHighlight(props: {abt: FileStructureNode, offset: number, adapter: HighlightAdapter}) {
    const node = props.abt;
    return <React.Fragment>
        <If cond={node.start < props.offset + CHUNK_SIZE && node.end >= props.offset}>
            <Highlight  node={node}
                        adapter={props.adapter} 
                        color={node.color}
                        start={node.start - props.offset} 
                        end={node.end - props.offset}></Highlight>
            { node.children.map(c => <RecursiveHighlight
                    key={c.id}
                    abt={c}
                    offset={props.offset}
                    adapter={props.adapter}></RecursiveHighlight>)}
        </If>
    </React.Fragment>;
});

export const HexViewHighlights = React.memo(function _HexViewHighlights(props: HexViewHighlightsProps) {

    const { abt } = React.useContext(HexViewContext);

    return <div>
        { abt?.root.children.map(c => <RecursiveHighlight
                    key={c.id}
                    abt={c}
                    offset={props.offset}
                    adapter={props.adapter}></RecursiveHighlight>)}
        {/* {highlights.filter(h => h.start < props.offset + CHUNK_SIZE && h.end > props.offset).map(h =>
            <Highlight key={h.nodeId} 
                    id={h.nodeId} 
                    isSelected={appContext.state.selectedNodes.indexOf(h.nodeId) >= 0}
                    isActive={h.hovered} 
                    adapter={props.adapter} 
                    color={h.color}
                    start={h.start - props.offset} 
                    end={h.end - props.offset}></Highlight>
        )} */}
        {/* { props.selection.start >= props.offset && props.selection.end <= props.offset + CHUNK_SIZE ? 
            <Highlight id={-1} 
                adapter={props.adapter} 
                color="255, 0, 0" 
                start={props.selection.start - props.offset} 
                end={props.selection.end - props.offset} 
                isActive={props.selection.isActive || appContext.state.hoveredNode === -1}></Highlight>
            : undefined
        } */}
    </div>
});
