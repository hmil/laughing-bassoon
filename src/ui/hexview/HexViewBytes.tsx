import * as React from 'react';
import { HexViewHighlights, HighlightAdapter } from './highlight/HexViewHighlights';
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

export const HexViewBytes = React.memo(function HexViewBytes(props: HexViewBytesProps) {

    const [localState, setLocalState] = useState({isDragging: false, dragStart: 0 });
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
        // dispatch(setSelection({
        //     anchor: offset,
        //     drag: offset
        // }));
        setLocalState({
            isDragging: true,
            dragStart: offset
        });
    }

    function moveSelection(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        if (!localState.isDragging) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop + getCurrentScroll()) + props.offset;

        dispatch(setSelection({
            anchor: localState.dragStart,
            drag: offset
        }));
    }

    function stopSelection() {
        setLocalState({
            isDragging: false,
            dragStart: 0
        });
    }

    const selection = React.useMemo(() => {
        return {
            isActive: localState.isDragging,
            start: Math.min(state.selection.anchor, state.selection.drag), 
            end: Math.max(state.selection.anchor, state.selection.drag) + 1
        };
    }, [localState.isDragging, state.selection]);

    const textContent = React.useMemo(() => {
            const numberOfLines = Math.ceil(props.data.length / 16);
            return new Array(numberOfLines).fill(0)
                .map((_, i) => formatBytesLine(props.data.slice(i * 16, (i + 1) * 16 )))
                .join('\n')
        }, [props.data]);

    return (
        <div    className="hexData"
                style={{
                    padding: '0 1ch',
                    whiteSpace: 'pre'
                }}>
            <div    ref={containerRef}
                    style={{
                        position: 'relative'
                    }}
                    onMouseDown={startSelection}
                    onMouseMove={moveSelection}
                    onMouseUp={stopSelection}>
                <HexViewHighlights
                    offset={props.offset}
                    selection={selection}
                    adapter={highlightAdapter}
                    ></HexViewHighlights>
                <div style={{
                    position: 'relative',
                    pointerEvents: 'none'
                }}>{
                    textContent
                }</div>
            </div>
        </div>
    );
});

function mapCoordinatesToOffset(x: number, y: number) {
    const line = Math.floor(y / lineHeight); 
    const char = Math.floor(x / charWidth);

    const lineOffset = Math.floor(Math.floor(char - (char > 12 ? 1 : 0) - (char > 25 ? 1 : 0) - (char > 39 ? 1 : 0)) / 3);

    return line * 16 + Math.max(0, Math.min(lineOffset, 15));
}
