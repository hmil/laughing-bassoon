import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';


const Flag = t.intersection([
    t.type({
        target: t.string, // TODO: allow refs
    }),
    t.partial({
        ref: t.string,
        description: t.string
    })
])

export const Flags = t.intersection([
    t.type({
        type: t.literal('flags'),
        values: t.array(Flag),
    }),
    t.partial({
        ref: t.string,
    }),
    Container
]);

declare module "." {
    interface AllElements {
        'flags': Flags;
    }
}
export type Flags = t.TypeOf<typeof Flags>;
allElements.push(Flags);
