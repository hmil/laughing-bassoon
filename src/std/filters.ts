export function removeNulls<T>(t: T | null | undefined): t is T {
    return t != null;
}

