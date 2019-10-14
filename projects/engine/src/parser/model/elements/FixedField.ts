import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';

// TODO: Fixed and const should really be merged into the same thing
// const is just a fixed whose value is a one-way constant expression
export const FixedField = t.intersection([
    t.type({
        type: t.literal('fixed'),
        name: t.string,
        size: t.number, // TODO: allow references
    }),
    t.partial({
        ref: t.string,
    }),
    Container
]);

declare module "." {
    interface AllElements {
        FixedField: FixedField;
    }
}
export type FixedField = t.TypeOf<typeof FixedField>;
allElements.push(FixedField);
