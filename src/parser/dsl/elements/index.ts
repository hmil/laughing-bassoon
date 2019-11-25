/*
 * We let elements register themselves to the index rather than listing them here.
 * This prevents a circular dependency between the elements and the element index.
 */

export interface AllElements { }
type UnionOfValues<T extends { [k: string]: any}, K extends keyof T> = K extends keyof T ? T[K] : never;
export type AnyElementType = UnionOfValues<AllElements, keyof AllElements>;
export const allElements: any = [];
