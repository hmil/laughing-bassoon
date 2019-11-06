import * as React from 'react';
import { HexViewHighlights, HighlightAdapter } from './highlight/HexViewHighlights';
import { HexViewContext } from './Context';
import { setSelection } from './HexViewActions';

const lineHeight = 15;
const charWidth = 7.94; // TODO: compute at runtime

function byteToAscii(c: number) {
    if (c >= 0x20 && c < 0x7f) {
        return String.fromCharCode(c);
    } else {
        return '.';
    }
}

function formatAsciiLine(line: Uint8Array) {
    let acc = '';
    for (let i = 0 ; i < line.length ; i++) {
        acc += byteToAscii(line[i]);
    }
    return acc;
}

const highlightAdapter: HighlightAdapter = {
    mapByteToCharOffset: (offset: number) => offset,
    byteSize: 1
}

export interface HexViewAsciiProps {
    data: Uint8Array;
    offset: number;
}

export function HexViewAscii(props: HexViewAsciiProps) {
    const { state, dispatch, getCurrentScroll } = React.useContext(HexViewContext);

    const [isDragging, setIsDragging] = React.useState(false);
    const containerRef = React.createRef<HTMLDivElement>();

    const startSelection = React.useCallback((evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
        if (evt.button !== 0) return;
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop + getCurrentScroll()) + props.offset;
        dispatch(setSelection({
            anchor: offset,
            drag: offset
        }));
        setIsDragging(true);
    }, [setIsDragging, dispatch, containerRef.current, getCurrentScroll]);

    const moveSelection = React.useCallback((evt: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
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
    }, [containerRef.current, isDragging, dispatch, state.selection.anchor, getCurrentScroll]);

    const stopSelection = React.useCallback(() => {
        setIsDragging(false);
    }, [setIsDragging]);

    const textContent = React.useMemo(() => {
        const numberOfLines = Math.ceil(props.data.length / 16);
        return new Array(numberOfLines).fill(0)
            .map((_, i) => formatAsciiLine(props.data.slice(i * 16, (i + 1) * 16 )))
            .join('\n')
    }, [props.data]);

    return (
        <div    className="asciiData" 
                style={{
                    padding: '0 1ch',
                    borderLeft: '1px #eee solid',
                    whiteSpace: 'pre',
                    cursor: 'default'
                }}>
            <div    ref={containerRef}
                    style={{ position: 'relative' }}
                    onMouseDown={startSelection}
                    onMouseMove={moveSelection}
                    onMouseUp={stopSelection}>
                <HexViewHighlights 
                    offset={props.offset}
                    selection={{
                        isActive: isDragging,
                        start: Math.min(state.selection.anchor, state.selection.drag), 
                        end: Math.max(state.selection.anchor, state.selection.drag) + 1
                    }}
                    adapter={highlightAdapter}
                ></HexViewHighlights>
                <div style={{
                    position: 'relative',
                    pointerEvents: 'none'
                }}>{ textContent }</div>
            </div>
        </div>
    );
}

function mapCoordinatesToOffset(x: number, y: number) {
    const line = Math.floor(y / lineHeight); 
    const char = Math.floor(x / charWidth);

    return line * 16 + char;
}
