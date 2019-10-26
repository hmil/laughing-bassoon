import * as t from 'io-ts';

import { ElementArray } from './core/ElementArray';
import { CodecModel } from './core/CodecModel';

const Endianness = t.union([
    t.literal('little'),
    t.literal('big')
]);
export type Endianness = t.TypeOf<typeof Endianness>;

export const ParserDefinition = t.intersection([
    t.type({
        type: t.string,
        endian: Endianness,
        wordlength: t.number,
        content: ElementArray
    }),
    t.partial({
        comments: t.string,
        codecs: t.array(t.intersection([
            CodecModel,
            t.type({
                name: t.string
            })
        ]))
    })
]);
export type ParserDefinition = t.TypeOf<typeof ParserDefinition>;

export function createParser(
    type: string,
    endian: Endianness = 'little',
    wordlength: number = 32
): ParserDefinition {
    return {
        type, endian, wordlength, content: []
    };
}
