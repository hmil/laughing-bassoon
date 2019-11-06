import * as React from 'react';
import { HexChunk } from './HexChunk';
import { Chunk } from './Chunk';
import { hexViewReducer, hexViewInitialState } from './HexViewState';
import { HexViewContext } from './Context';
import { CHUNK_SIZE } from './Config';
import { AbtUITree } from 'ui/services/UIPresentationService';


interface HexViewProps {
    chunks: Chunk[];
    onRequestChunks: (chunks: number[]) => void;
    style?: React.CSSProperties;
    abt: AbtUITree;
    // Total number of chunks
    nChunks: number;
}

const FETCH_THRESHOLD = 500;

const SCROLL_OFFSET = 1920; // TODO compute at runtime

export function HexView(props: HexViewProps) {

    let debounceRequests: number | null;

    let dom = {
        screen: React.useRef<HTMLDivElement>(null),
        paper: React.useRef<HTMLDivElement>(null),
    };

    const [firstChunk, setFirstChunk] = React.useState(0);
    const [scrollPosition, setScrollPosition] = React.useState(0);
    const [state, dispatch] = React.useReducer(hexViewReducer, hexViewInitialState);

    React.useEffect(() => {
        if (props.chunks.length < 1) {
            return;
        }
        const nextFirstChunk = props.chunks[0].chunkNr;
        if (firstChunk != nextFirstChunk) {
            if (dom.screen.current != null && scrollPosition === dom.screen.current.scrollTop) {
                // Some browsers update the scroll automatically to accomodate infinite scroll experiences (Chrome)
                // Some don't and we have to manually update (Firefox)
                const offset = nextFirstChunk - firstChunk;
                dom.screen.current.scrollTo(dom.screen.current.scrollWidth, scrollPosition - offset * SCROLL_OFFSET);
            }
            setFirstChunk(nextFirstChunk);
        }
    });

    function onScroll() {
        const screen = dom.screen.current;
        const paper = dom.paper.current;
        if (screen != null && paper != null) {
            // Whenever we get "too close" to an edge, request a different set of data.
            if (paper.clientHeight - screen.scrollTop - screen.clientHeight < FETCH_THRESHOLD && firstChunk + props.chunks.length < props.nChunks) {
                if (debounceRequests != null) {
                    cancelAnimationFrame(debounceRequests);
                }
                debounceRequests = requestAnimationFrame(() => {
                    debounceRequests = null;
                    const newChunkSet = props.chunks.map(c => c.chunkNr)
                            .concat(props.chunks[props.chunks.length - 1].chunkNr + 1)
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
                            .concat(props.chunks.map(c => c.chunkNr))
                            .slice(0, props.chunks.length);
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

    const ctx = React.useMemo(() => {
        return {abt: props.abt, state, dispatch, getCurrentScroll};

        function getCurrentScroll() {
            return dom.screen.current ? dom.screen.current.scrollTop : 0;
        }
    }, [props.abt, state, dispatch, dom.screen.current]);

    return (
        <HexViewContext.Provider value={ctx}>
            <div
                style={{
                // The purpose of this div is to hide the native scroll bar
                overflow: 'hidden',
                cursor: 'default',
                height: '100%'
            }}>
                <div    style={{
                            ...props.style,
                            overflowY: 'auto',
                            height: '100%',
                            width: '100%',
                            boxSizing: 'content-box',
                            paddingRight: '20px',
                            fontSize: '13px',
                            lineHeight: '15px'
                        }}
                        ref={dom.screen}
                        onScroll={onScroll}>
                    <div    style={{
                                fontFamily: 'monospace',
                                padding: '0.5em 1ch'
                            }}
                            className="hexView"
                            ref={dom.paper}>
                        { props.chunks.map(renderChunk) }
                    </div>
                </div>
            </div>
        </HexViewContext.Provider>
    );
}

