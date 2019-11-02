import * as t from 'io-ts';
import { allElements } from '.';
import { ElementArray } from '../core/ElementArray';

export interface Then {
    then?: ElementArray;
}
const Then: t.Type<Then> = t.partial({
    then: ElementArray
});
export interface Else {
    else?: ElementArray;
}
const Else: t.Type<Else> = t.partial({
    else: ElementArray
});

export const IfField = t.intersection([
    t.type({
        type: t.literal('if'),
        cond: t.string,
    }),
    t.partial({
        ref: t.string
    }),
    Then,
    Else
]);

declare module "." {
    interface AllElements {
        IfField: IfField;
    }
}
export type IfField = t.TypeOf<typeof IfField>;
allElements.push(IfField);
