import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';

export const ContainerField = t.intersection([
    t.type({
        type: t.literal('container'),
    }),
    t.partial({
        ref: t.string,
        size: t.union([t.number, t.string])
    }),
    Container
]);

declare module "." {
    interface AllElements {
        'container': ContainerField;
    }
}
export type ContainerField = t.TypeOf<typeof ContainerField>;
allElements.push(ContainerField);
