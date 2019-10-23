
/**
 * Binary offset with bit-precision.
 */
export class Offset {
    constructor(
            public readonly offset: number,
            public readonly bitOffset: number) {
    }

    add(offset: number, bitOffset: number = 0): Offset {
        const newBitOffset = this.bitOffset + bitOffset;
        return new Offset((this.offset + offset) + ~~(newBitOffset / 8), newBitOffset % 8);
    }
}
