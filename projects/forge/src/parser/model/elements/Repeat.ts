import * as t from 'io-ts';
import { allElements } from '.';
import { ElementArray } from '../core/ElementArray';

export interface Do {
    do: ElementArray;
}
const Do: t.Type<Do> = t.type({
    do: ElementArray
});
export interface Until {
    until: ElementArray;
}
const Until: t.Type<Until> = t.type({
    until: ElementArray
});

export const Repeat = t.intersection([
    t.type({
        type: t.literal('repeat'),
    }),
    Until,
    Do
]);

declare module "." {
    interface AllElements {
        Repeat: Repeat;
    }
}
export type Repeat = t.TypeOf<typeof Repeat>;
allElements.push(Repeat);
