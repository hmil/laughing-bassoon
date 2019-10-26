
/**
 * Binary offset with bit-precision.
 */
export class Offset {
    constructor(
            public readonly offset: number,
            public readonly bitOffset: number) {
    }

    add(offset: Offset): Offset {
        const newBitOffset = this.bitOffset + offset.bitOffset;
        return new Offset((this.offset + offset.offset) + ~~(newBitOffset / 8), newBitOffset % 8);
    }

    compareTo(offset: Offset): number {
        return this.offset < offset.offset ? -1 : this.offset > offset.offset ? 1 :
                this.bitOffset < offset.bitOffset ? -1 : this.bitOffset > offset.bitOffset ? 1 : 0;
    }

    toString(): string {
        return `0x${this.offset.toString(16)}${this.bitOffset !== 0 ? `(${this.bitOffset})` : ''}`;
    }
}
