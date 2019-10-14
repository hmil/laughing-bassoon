import * as t from 'io-ts';
import { AnyElement } from '../AnyElement';
import { AnyElementType } from '../elements';


export type ElementArray = AnyElementType[];
export const ElementArray: t.Type<ElementArray> = t.recursion('ElementArray', () => 
    t.array(AnyElement)
);
