import * as t from 'io-ts';
import { ElementArray } from './ElementArray';
import { AnyElementType } from '../elements';


export interface Container {
    content?: AnyElementType[];
}
export const Container: t.Type<Container> = t.partial({
    content: ElementArray
});
