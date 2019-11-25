import { IsNull } from './IsNull';
import * as t from 'io-ts';

export const AnyConstraint = IsNull;
export type AnyConstraint = t.TypeOf<typeof AnyConstraint>;
