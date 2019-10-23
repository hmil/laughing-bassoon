
export interface Verifier<T> {
    toEqual(actual: T): void;
}

/**
 * This utility lets us check not only that a value matches a reference at runtime, but also
 * that it has the expected type.
 */
export function typedExpect<T>(expected: T): Verifier<T> {
    return expect(expected);
}
