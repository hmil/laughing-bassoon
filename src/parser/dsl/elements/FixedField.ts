import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';
import { BaseField } from './BaseField';

export const FixedField = t.intersection([
    t.type({
        type: t.literal('fixed'),
    }),
    t.union([
        t.type({
            size: t.union([t.number, t.string])
        }),
        t.type({
            bitSize: t.union([t.number, t.string])
        })
    ]),
    t.partial({
        ref: t.string,
    }),
    Container,
    BaseField
]);

declare module "." {
    interface AllElements {
        'fixed': FixedField;
    }
}
export type FixedField = t.TypeOf<typeof FixedField>;
allElements.push(FixedField);
