import * as t from 'io-ts';

export const IsNull = t.type({
    type: t.literal('isNull')
});
export type IsNull = t.TypeOf<typeof IsNull>;
