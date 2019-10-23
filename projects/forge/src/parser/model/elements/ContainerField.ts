import * as t from 'io-ts';
import { Container } from '../core/Container';
import { allElements } from '.';

export const ContainerField = t.intersection([
    t.type({
        type: t.literal('container'),
        name: t.string
    }),
    t.partial({
        ref: t.string,
    }),
    Container
]);

declare module "." {
    interface AllElements {
        ContainerField: ContainerField;
    }
}
export type ContainerField = t.TypeOf<typeof ContainerField>;
allElements.push(ContainerField);
