import * as React from 'react';
import { HexViewHighlights } from './HexViewHighlights';
import { useState } from 'react';

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

export function HexViewBytes(props: { data: Uint8Array }) {
    const numberOfLines = Math.ceil(props.data.length / 16);

    const [selection, setSelection] = useState({ anchor: 0, drag: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = React.createRef<HTMLDivElement>();

    function startSelection(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop);
        setSelection({
            anchor: offset,
            drag: offset
        });
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
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop);

        setSelection({
            anchor: selection.anchor,
            drag: offset
        });
    }

    function stopSelection() {
        setIsDragging(false);
    }


    return (
        <div    className="hexData"
                ref={containerRef}
                onMouseDown={startSelection}
                onMouseMove={moveSelection}
                onMouseUp={stopSelection}
                style={{
                    padding: '0 1ch',
                    whiteSpace: 'pre'
                }}>
        <HexViewHighlights selection={{
            isActive: isDragging, 
            start: Math.min(selection.anchor, selection.drag), 
            end: Math.max(selection.anchor, selection.drag)}}></HexViewHighlights>
        {new Array(numberOfLines).fill(0)
            .map((_, i) => formatBytesLine(props.data.slice(i * 16, (i + 1) * 16 )))
            .join('\n')
        }
        </div>
    );
}

function mapCoordinatesToOffset(x: number, y: number) {
    const line = Math.floor(y / lineHeight); 
    const char = Math.floor(x / charWidth);

    const lineOffset = Math.floor(Math.floor(char - (char > 12 ? 1 : 0) - (char > 25 ? 1 : 0) - (char > 39 ? 1 : 0)) / 3);

    return line * 16 + lineOffset;
}
