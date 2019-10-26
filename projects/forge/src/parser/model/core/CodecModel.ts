import * as t from 'io-ts';

export const CodecModel = t.type({
    type: t.string,
    decode: t.string,
    encode: t.string,
});
export type CodecModel = t.TypeOf<typeof CodecModel>;
