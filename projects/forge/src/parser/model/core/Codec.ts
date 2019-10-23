import * as t from 'io-ts';

export const Codec = t.type({
    type: t.string,
    decode: t.string,
    encode: t.string,
});
export type Codec = t.TypeOf<typeof Codec>;
