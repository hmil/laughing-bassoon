import * as t from 'io-ts';

import { Container } from './core/Container';

const Endianness = t.union([
    t.literal('little'),
    t.literal('big')
]);
export type Endianness = t.TypeOf<typeof Endianness>;

export const Parser = t.intersection([
    t.type({
        type: t.string,
        endian: Endianness,
        wordlength: t.number,
    }),
    t.partial({
        comments: t.string,
    }),
    Container
]);
export type Parser = t.TypeOf<typeof Parser>;

export function createParser(
    type: string,
    endian: Endianness = 'little',
    wordlength: number = 32
): Parser {
    return {
        type, endian, wordlength
    };
}
