import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';

export const ConstField = t.intersection([
    t.type({
        type: t.literal('const'),
        name: t.string,
        size: t.number, // TODO: allow references
        value: t.array(t.number),
    }),
    t.partial({
        ref: t.string,
    }),
    Container
]);

declare module "." {
    interface AllElements {
        ConstField: ConstField;
    }
}
export type ConstField = t.TypeOf<typeof ConstField>;
allElements.push(ConstField);
