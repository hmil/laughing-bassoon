import * as t from 'io-ts';
import { allElements, AnyElementType } from './elements';

export const AnyElement: t.Type<AnyElementType> = t.recursion('AnyElement', () => 
    t.union(allElements)
);




