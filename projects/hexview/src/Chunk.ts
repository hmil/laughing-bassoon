
export interface Chunk {
    data: Uint8Array;
    chunkNr: number;
}

export function compareChunks(a: Chunk, b: Chunk) {
    return a.chunkNr - b.chunkNr;
}