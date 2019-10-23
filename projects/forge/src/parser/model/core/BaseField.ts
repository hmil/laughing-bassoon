import * as t from 'io-ts';
import { Codec } from './Codec';

export const BaseField = t.partial({
    value: t.union([
        t.string,
        Codec
    ])
});
