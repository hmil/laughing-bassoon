import * as t from 'io-ts';
import { CodecModel } from '../core/CodecModel';
import { AnyConstraint } from '../constraints';

export const BaseField = t.partial({
    value: t.union([
        t.string,
        CodecModel
    ]),
    constraints: t.array(AnyConstraint)
});
