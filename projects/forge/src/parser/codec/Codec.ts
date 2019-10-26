import { Either } from 'fp-ts/lib/Either';

export interface Codec {
    decode(data: Uint8Array): Either<string, number | string>;
    // encode(data: unknown, length: number): Either<string, Uint8Array>;
}