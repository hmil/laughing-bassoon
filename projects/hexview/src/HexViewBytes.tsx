import * as React from 'react';
import { HexViewHighlights, HighlightAdapter } from './HexViewHighlights';
import { useState } from 'react';
import { HexViewContext } from './Context';
import { setSelection } from './HexViewActions';

const lineHeight = 15;
const charWidth = 7.94; // TODO: compute at runtime

function formatBytesLine(line: Uint8Array) {
    let acc = '';
    for (let i = 0 ; i < line.length ; i++) {
        if (line[i] < 0x10) {
            acc += '0';
        }
        acc += line[i].toString(16) + ' ';
        if (i + 1 == 16) break;
        if ((i + 1) % 4 == 0) {
            acc += ' ';
        }
        if ((i + 1) % 8 == 0) {
            acc += ' ';
        }
    }
    return acc;
}

export interface HexViewBytesProps {
    data: Uint8Array;
    offset: number;
}

const highlightAdapter: HighlightAdapter = {
    mapByteToCharOffset: (offset: number) => offset * 3 + Math.floor(offset / 4) + Math.floor(offset / 8),
    byteSize: 2
}

export function HexViewBytes(props: HexViewBytesProps) {
    const numberOfLines = Math.ceil(props.data.length / 16);

    const [isDragging, setIsDragging] = useState(false);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const {state, dispatch, getCurrentScroll} = React.useContext(HexViewContext);

    function startSelection(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (evt.button !== 0) return;
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop + getCurrentScroll()) + props.offset;
        console.log(offset);
        dispatch(setSelection({
            anchor: offset,
            drag: offset
        }));
        setIsDragging(true);
    }

    function moveSelection(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        if (!isDragging) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop + getCurrentScroll()) + props.offset;

        dispatch(setSelection({
            anchor: state.selection.anchor,
            drag: offset
        }));
    }

    function stopSelection() {
        setIsDragging(false);
    }


    return (
        <div    className="hexData"
                style={{
                    padding: '0 1ch',
                    whiteSpace: 'pre'
                }}>
            <div    ref={containerRef}
                    onMouseDown={startSelection}
                    onMouseMove={moveSelection}
                    onMouseUp={stopSelection}>
                <HexViewHighlights
                    offset={props.offset}
                    selection={{
                        isActive: isDragging,
                        start: Math.min(state.selection.anchor, state.selection.drag), 
                        end: Math.max(state.selection.anchor, state.selection.drag)
                    }}
                    adapter={highlightAdapter}
                    ></HexViewHighlights>
                {new Array(numberOfLines).fill(0)
                    .map((_, i) => formatBytesLine(props.data.slice(i * 16, (i + 1) * 16 )))
                    .join('\n')
                }
            </div>
        </div>
    );
}

function mapCoordinatesToOffset(x: number, y: number) {
    const line = Math.floor(y / lineHeight); 
    const char = Math.floor(x / charWidth);

    const lineOffset = Math.floor(Math.floor(char - (char > 12 ? 1 : 0) - (char > 25 ? 1 : 0) - (char > 39 ? 1 : 0)) / 3);

    return line * 16 + Math.max(0, Math.min(lineOffset, 15));
}
