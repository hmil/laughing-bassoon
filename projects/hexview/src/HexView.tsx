import * as React from 'react';
import { HexChunk } from './HexChunk';
import { Chunk, compareChunks } from './Chunk';

export const CHUNK_SIZE = 2048;

interface HexViewProps {
    chunks: Chunk[];
    onRequestChunks: (chunks: number[]) => void;
    style?: React.CSSProperties; 
}

const FETCH_THRESHOLD = 500;

const SCROLL_OFFSET = 1920; // TODO compute at runtime

export function HexView(props: HexViewProps) {

    const sortedChunks = props.chunks.slice().sort(compareChunks);

    let debounceRequests: number | null;

    let dom = {
        screen: null as HTMLDivElement | null,
        paper: null as HTMLDivElement | null,
    };

    const [firstChunk, setFirstChunk] = React.useState(0);
    const [scrollPosition, setScrollPosition] = React.useState(0);

    React.useEffect(() => {
        if (sortedChunks.length < 1) {
            return;
        }
        const nextFirstChunk = sortedChunks[0].chunkNr;
        if (firstChunk != nextFirstChunk) {
            if (dom.screen != null && scrollPosition === dom.screen.scrollTop) {
                // Some browsers update the scroll automatically to accomodate infinite scroll experiences (Chrome)
                // Some don't and we have to manually update (Firefox)
                const offset = nextFirstChunk - firstChunk;
                dom.screen.scrollTo(dom.screen.scrollWidth, scrollPosition - offset * SCROLL_OFFSET);
            }
            setFirstChunk(nextFirstChunk);
        }
    })

    function onScroll() {
        const screen = dom.screen;
        const paper = dom.paper;
        if (screen != null && paper != null) {
            // Whenever we get "too close" to an edge, request a different set of data.
            if (paper.clientHeight - screen.scrollTop - screen.clientHeight < FETCH_THRESHOLD) {
                if (debounceRequests != null) {
                    cancelAnimationFrame(debounceRequests);
                }
                debounceRequests = requestAnimationFrame(() => {
                    debounceRequests = null;
                    const newChunkSet = sortedChunks.map(c => c.chunkNr)
                            .concat(sortedChunks[sortedChunks.length - 1].chunkNr + 1)
                            .slice(1);
                    setScrollPosition(screen.scrollTop);
                    props.onRequestChunks(newChunkSet);
                });
            } else if (screen.scrollTop < FETCH_THRESHOLD && firstChunk > 0) {
                if (debounceRequests != null) {
                    cancelAnimationFrame(debounceRequests);
                }
                debounceRequests = requestAnimationFrame(() => {
                    debounceRequests = null;
                    const newChunkSet = [firstChunk - 1]
                            .concat(sortedChunks.map(c => c.chunkNr))
                            .slice(0, sortedChunks.length);
                    setScrollPosition(screen.scrollTop);
                    props.onRequestChunks(newChunkSet);
                });
            }
        }
    }

    function renderChunk(chunk: Chunk) {
        const offset = chunk.chunkNr * CHUNK_SIZE;
        return <HexChunk key={chunk.chunkNr} offset={offset} data={chunk.data} />;
    }

    return (
        <div    style={{
            // The purpose of this div is to hide the native scroll bar
            overflow: 'hidden',
        }}>
            <div    style={{
                        ...props.style,
                        overflowY: 'auto',
                        height: '100%',
                        width: '100%',
                        boxSizing: 'content-box',
                        paddingRight: '20px',
                        backgroundColor: '#181818',
                        fontSize: '13px',
                        lineHeight: '15px'
                    }}
                    ref={el => dom.screen = el}
                    onScroll={onScroll}>
                <div    style={{
                            fontFamily: 'monospace',
                            padding: '0.5em 1ch'
                        }}
                        className="hexView"
                        ref={el => dom.paper = el}>
                    { sortedChunks.sort(compareChunks).map(renderChunk) }
                </div>
            </div>
        </div>
    );
}