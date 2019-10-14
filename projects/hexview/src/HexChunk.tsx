import * as React from 'react';
import { HexViewOffsets } from './HexViewOffsets';
import { HexViewBytes } from './HexViewBytes';
import { HexViewAscii } from './HexViewAscii';

interface HexChunkProps {
    offset: number;
    data: Uint8Array;
}

export function HexChunk(props: HexChunkProps) {
    return (
        <div style={{
            display: 'flex',
        }}>
            <HexViewOffsets from={props.offset} length={props.data.length} />
            <HexViewBytes data={props.data} />
            <HexViewAscii data={props.data} />
        </div>
    );
}
