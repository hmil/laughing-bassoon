import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';
import { AnyConstraint } from '../constraints';

export const ContainerField = t.intersection([
    t.type({
        type: t.literal('container'),
    }),
    t.partial({
        ref: t.string,
        codec: t.string,
        constraints: t.array(AnyConstraint)
    }),
    Container,
    t.union([
        t.partial({
            size: t.union([t.number, t.string])
        }),
        t.partial({
            bitSize: t.union([t.number, t.string])
        })
    ])
]);

declare module "." {
    interface AllElements {
        'container': ContainerField;
    }
}
export type ContainerField = t.TypeOf<typeof ContainerField>;
allElements.push(ContainerField);
