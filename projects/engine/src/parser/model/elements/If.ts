import * as t from 'io-ts';
import { allElements } from '.';
import { ElementArray } from '../core/ElementArray';

interface Then {
    then?: ElementArray;
}
const Then: t.Type<Then> = t.partial({
    then: ElementArray
});
interface Else {
    else?: ElementArray;
}
const Else: t.Type<Else> = t.partial({
    else: ElementArray
});

export const If = t.intersection([
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
        If: If;
    }
}
export type If = t.TypeOf<typeof If>;
allElements.push(If);
