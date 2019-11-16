import * as React from 'react';
import { FileStructure } from 'ui/domain/structure/Structure';

import { Chunk } from './Chunk';
import { CHUNK_SIZE } from './Config';
import { HexViewContext } from './Context';
import { HexChunk } from './HexChunk';
import { hexViewInitialState, hexViewReducer } from './HexViewState';

interface HexViewProps {
    chunks: Chunk[];
    onRequestChunks: (chunks: number[]) => void;
    style?: React.CSSProperties;
    abt: FileStructure | null;
    selectedNodes: string[];
    hoveredNodes: string[];
    // Total number of chunks
    nChunks: number;
}

const SCROLL_OFFSET = 1920; // TODO compute at runtime

export function HexView(props: HexViewProps) {

    const screenRef = React.useRef<HTMLDivElement>(null);

    const [state, dispatch] = React.useReducer(hexViewReducer, hexViewInitialState);

    function onScroll() {
        const screen = screenRef.current;
        if (screen != null) {
            const firstChunk = Math.max(0, Math.floor((screen.scrollTop - 2000) / SCROLL_OFFSET));
            props.onRequestChunks(new Array(4).fill(0).map((_, i) => firstChunk + i));
        }
    }

    function renderChunk(chunk: Chunk) {
        const offset = chunk.chunkNr * CHUNK_SIZE;
        return <HexChunk key={chunk.chunkNr} offset={offset} data={chunk.data} />;
    }

    const ctx = React.useMemo(() => {
        return {abt: props.abt, state, dispatch, getCurrentScroll, hoveredNodes: props.hoveredNodes, selectedNodes: props.selectedNodes};

        function getCurrentScroll() {
            return screenRef.current ? screenRef.current.scrollTop : 0;
        }
    }, [props.abt, state, dispatch, screenRef.current, props.hoveredNodes, props.selectedNodes]);

    const totalHeight = props.nChunks * SCROLL_OFFSET;

    const elevatorTop = props.chunks.length > 0 ? props.chunks[0].chunkNr * SCROLL_OFFSET : 0;

    return (
        <HexViewContext.Provider value={ctx}>
            <div    style={{
                        ...props.style,
                        overflowY: 'auto',
                        height: '100%',
                        width: '100%',
                        fontSize: '13px',
                        lineHeight: '15px'
                    }}
                    ref={screenRef}
                    onScroll={onScroll}>
                <div    style={{
                            fontFamily: 'monospace',
                            height: `${totalHeight}px`,
                            position: 'relative'
                        }}
                        className="hexView">
                    <div style={{
                        position: 'absolute',
                        padding: '0.5em 1ch',
                        width: '100%',
                        top: `${elevatorTop}px`
                    }}>
                        { props.chunks.map(renderChunk) }
                    </div>
                </div>
            </div>
        </HexViewContext.Provider>
    );
}

