import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';
import { BaseField } from './BaseField';

// TODO: Fixed and const should really be merged into the same thing
// const is just a fixed whose value is a one-way constant expression
export const FixedField = t.intersection([
    t.type({
        type: t.literal('fixed'),
        name: t.string
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
