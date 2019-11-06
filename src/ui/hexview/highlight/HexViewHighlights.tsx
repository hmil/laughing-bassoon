import * as React from 'react';
import { HexViewContext } from '../Context';
import { CHUNK_SIZE } from '../Config';
import { AppContext } from '../../../state/AppContext';
import { selectNode } from '../../../state/AppActions';
import { UIPresentationServiceInjector, UIPresentationService, AbtUITree } from 'ui/services/UIPresentationService';
import { callback } from 'ui/react/hooks';
import { AppActions } from 'state/AppState';
import { If } from 'ui/react/tsx-helpers';


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
        backgroundColor: `rgba(${props.color}, ${props.hover ? '0.35' : '0.25'})`,
        left: `calc(${props.left}ch - 1px)`,
        width: `calc(${props.width}ch + 1px)`,
        top: `${props.top * lineHeight}px`,
        height: `${Math.max((props.bottom - props.top + 1) * lineHeight - 1, 0)}px`,
        ...(props.overflowTop ? {} : {borderTop: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`}),
        ...(props.overflowBottom ? {} : {borderBottom: `1px solid rgba(${props.color}, ${props.hover ? 1 : 0.4})`}),
    }
}


interface HighlightProps {
    start: number;
    end: number;
    color: string;
    isActive: boolean;
    isSelected: boolean;
    adapter: HighlightAdapter;
    id: number;
}

const onEnterCallback = callback((uiService: UIPresentationService, id: number) => () => {
    uiService.hoverNodes([id]);
});

const onClickCallback = callback((dispatch: React.Dispatch<AppActions>, id: number) => () => dispatch(selectNode({ids: [id]})));

const Highlight = React.memo(function _Highlight({ start, adapter, end, color, isActive, isSelected, id}: HighlightProps) {

    const uiService = React.useContext(UIPresentationServiceInjector);
    const appContext = React.useContext(AppContext);

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
        color = '255, 211, 0';
    }

    
    const onMouseEnter = onEnterCallback(uiService, id);
    const onClick = onClickCallback(appContext.dispatch, id);

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

export const RecursiveHighlight = React.memo(function _RecursiveHighlight(props: {abt: AbtUITree, offset: number, adapter: HighlightAdapter}) {
    const node = props.abt.node;
    return <React.Fragment>
        <If cond={node.start < props.offset + CHUNK_SIZE && node.end > props.offset}>
            <Highlight  id={node.id} 
                        isSelected={false}
                        isActive={props.abt.hovered} 
                        adapter={props.adapter} 
                        color={props.abt.color}
                        start={node.start - props.offset} 
                        end={node.end - props.offset}></Highlight>
            { props.abt.children.map(c => <RecursiveHighlight
                    key={c.node.id}
                    abt={c}
                    offset={props.offset}
                    adapter={props.adapter}></RecursiveHighlight>)}
        </If>
    </React.Fragment>;
});

export const HexViewHighlights = React.memo(function _HexViewHighlights(props: HexViewHighlightsProps) {

    const { abt } = React.useContext(HexViewContext);

    return <div>
        { abt.children.map(c => <RecursiveHighlight
                    key={c.node.id}
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
