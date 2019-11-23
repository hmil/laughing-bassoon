

export function arrayInsert<T>(input: ReadonlyArray<T>, index: number, elem: T): T[] {
    return [...input.slice(0, index), elem, ...input.slice(index)];
}

export function arrayRemove<T>(input: ReadonlyArray<T>, index: number): T[] {
    return [...input.slice(0, index), ...input.slice(index + 1)];
}

export function arrayReplace<T>(input: ReadonlyArray<T>, index: number, replacement: T): T[] {
    return [...input.slice(0, index), replacement, ...input.slice(index + 1)];
}