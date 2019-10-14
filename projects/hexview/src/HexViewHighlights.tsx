import * as React from 'react';
import styled from 'styled-components';
import { useState } from 'react';

const lineHeight = 15;

const HighlightSegment = styled.div<{
    color: string;
    top: number;
    left: number;
    width: number;
    bottom: number;
}>`
    position: absolute;
    border: 1px solid rgba(${props => props.color}, 0.4);
    background-color: rgba(${props => props.color}, 0.1);
    left: calc(${props => props.left}ch - 1px);
    width: calc(${props => props.width}ch + 1px);
    top: ${props => props.top * lineHeight}px;
    height: ${props => (props.bottom - props.top + 1) * lineHeight - 1}px;

    .hover > & {
        border-color: rgba(${props => props.color}, 1);
    }
`;


interface HighlightProps {
    start: number;
    end: number;
    color: string;
    isActive?: boolean;
}

type Direction = 'top' | 'left' | 'bottom' | 'right' | 'center';

function Highlight(props: HighlightProps) {

    const startX = props.start % 16;
    const endX = props.end % 16;
    const startY = Math.floor(props.start / 16);
    const endY = Math.floor(props.end / 16);

    const [hover, setHover] = useState<'none' | Direction>('none');
    function onMouseEnter(direction: Direction) {
        return () => setHover(direction);
    }
    function onMouseLeave(direction: Direction) {
        return () => hover === direction && setHover('none');
    }

    const segments: JSX.Element[] = [];

    if (endY - startY === 0) { // single line
        segments.push(<HighlightSegment
            key="first"
            onMouseEnter={onMouseEnter('top')}
            onMouseLeave={onMouseLeave('top')}
            top={startY}
            bottom={startY}
            left={byteOffsetToHexViewLine(startX)}
            width={byteOffsetToHexViewLine(endX) - byteOffsetToHexViewLine(startX) + 2}
            color={props.color}></HighlightSegment>);

    } else if (endY - startY === 1 && startX > endX) { // Two lines, No overlap
        segments.push(<HighlightSegment
            key="first"
            style={{ borderRight: 'none' }}
            onMouseEnter={onMouseEnter('top')}
            onMouseLeave={onMouseLeave('top')}
            top={startY}
            bottom={startY}
            left={byteOffsetToHexViewLine(startX)}
            width={byteOffsetToHexViewLine(15) - byteOffsetToHexViewLine(startX) + 2}
            color={props.color}></HighlightSegment>);
        segments.push(<HighlightSegment
            key="last"
            style={{ borderLeft: 'none' }}
            onMouseEnter={onMouseEnter('top')}
            onMouseLeave={onMouseLeave('top')}
            top={endY}
            bottom={endY}
            left={byteOffsetToHexViewLine(0)}
            width={byteOffsetToHexViewLine(endX) + 2}
            color={props.color}></HighlightSegment>);
    } else {
        // First line
        segments.push(<HighlightSegment
            key="first"
            style={{
                borderBottom: 'none',
                borderRight: 'none'
            }}
            onMouseEnter={onMouseEnter('top')}
            onMouseLeave={onMouseLeave('top')}
            top={startY}
            bottom={startY}
            left={byteOffsetToHexViewLine(startX)}
            width={byteOffsetToHexViewLine(15) - byteOffsetToHexViewLine(startX) + 2}
            color={props.color}></HighlightSegment>);
    
       
    
        if (startX <= endX) { // needs horizontal fill
            // center segment
            segments.push(<HighlightSegment
                key="center"
                style={{
                    border: 'none'
                }}
                onMouseEnter={onMouseEnter('center')}
                onMouseLeave={onMouseLeave('center')}
                top={startY + 1}
                bottom={endY - 1}
                left={byteOffsetToHexViewLine(startX)}
                width={byteOffsetToHexViewLine(endX) - byteOffsetToHexViewLine(startX) + 2}
                color={props.color}></HighlightSegment>);

            // right segment
            segments.push(<HighlightSegment
                key="right"
                style={{
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none'
                }}
                onMouseEnter={onMouseEnter('right')}
                onMouseLeave={onMouseLeave('right')}
                top={startY + 1}
                bottom={endY - 1}
                left={byteOffsetToHexViewLine(endX) + 2}
                width={byteOffsetToHexViewLine(15) - byteOffsetToHexViewLine(endX)}
                color={props.color}></HighlightSegment>);

            // left segment
            segments.push(<HighlightSegment
                key="left"
                style={{
                    borderBottom: 'none',
                    borderRight: 'none',
                    borderLeft: 'none'
                }}
                onMouseEnter={onMouseEnter('left')}
                onMouseLeave={onMouseLeave('left')}
                top={startY + 1}
                bottom={endY - 1}
                left={byteOffsetToHexViewLine(0)}
                width={byteOffsetToHexViewLine(startX)}
                color={props.color}></HighlightSegment>);
        } else { // needs vertical fill
            // center segment
            segments.push(<HighlightSegment
                key="center"
                style={{
                    border: 'none'
                }}
                onMouseEnter={onMouseEnter('center')}
                onMouseLeave={onMouseLeave('center')}
                top={startY + 1}
                bottom={endY - 1}
                left={byteOffsetToHexViewLine(0)}
                width={byteOffsetToHexViewLine(15) + 2}
                color={props.color}></HighlightSegment>);

            // right segment
            segments.push(<HighlightSegment
                key="right"
                style={{
                    borderTop: 'none',
                    borderLeft: 'none',
                    borderRight: 'none',
                    background: 'none'
                }}
                onMouseEnter={onMouseEnter('right')}
                onMouseLeave={onMouseLeave('right')}
                top={startY + 1}
                bottom={endY - 1}
                left={byteOffsetToHexViewLine(endX) + 2}
                width={byteOffsetToHexViewLine(15) - byteOffsetToHexViewLine(endX)}
                color={props.color}></HighlightSegment>);

            // left segment
            segments.push(<HighlightSegment
                key="left"
                style={{
                    borderBottom: 'none',
                    borderRight: 'none',
                    borderLeft: 'none',
                    background: 'none'
                }}
                onMouseEnter={onMouseEnter('left')}
                onMouseLeave={onMouseLeave('left')}
                top={startY + 1}
                bottom={endY - 1}
                left={byteOffsetToHexViewLine(0)}
                width={byteOffsetToHexViewLine(startX)}
                color={props.color}></HighlightSegment>);
        }
    
        
        
        // Last line
        segments.push(<HighlightSegment
            key="last"
            style={{
                borderTop: 'none',
                borderLeft: 'none'
            }}
            onMouseEnter={onMouseEnter('bottom')}
            onMouseLeave={onMouseLeave('bottom')}
            top={endY}
            bottom={endY}
            left={byteOffsetToHexViewLine(0)}
            width={byteOffsetToHexViewLine(endX) + 2}
            color={props.color}></HighlightSegment>);
    }
    

    return <div className={hover !== 'none' || props.isActive ? 'hover' : ''}>
        {segments}
        {/* <HighlightSegment
                top={startY}
                bottom={startY}
                left={byteOffsetToHexViewLine(startX)}
                width={byteOffsetToHexViewLine(15 - startX + 1) - 1}
                color={props.color}>
        </HighlightSegment>
        <HighlightSegment
                top={endY}
                bottom={endY}
                left={byteOffsetToHexViewLine(0)}
                width={byteOffsetToHexViewLine(endX + 1) - 1}
                color={props.color}>
        </HighlightSegment> */}
    </div>;
}

/**
 * Converts a byte offset to a position on the hexview line (in characters)
 */
function byteOffsetToHexViewLine(offset: number) {
    return offset * 3 + Math.floor(offset / 4) + Math.floor(offset / 8);
}


export function HexViewHighlights(props: { selection: { start: number; end: number; isActive: boolean;}}) {

    return <div style={{
        position: 'relative'
    }} >
        <Highlight color="255, 176, 0" start={100} end={143}></Highlight>
        <Highlight color="255, 0, 0" start={props.selection.start} end={props.selection.end} isActive={props.selection.isActive}></Highlight>
    </div>
}