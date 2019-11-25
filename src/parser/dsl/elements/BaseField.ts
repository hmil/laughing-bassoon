import * as t from 'io-ts';
import { AnyConstraint } from '../constraints';

export const BaseField = t.partial({
    codec: t.string,
    constraints: t.array(AnyConstraint)
});
