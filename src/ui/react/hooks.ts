import * as React from 'react';

export function useCallback<Params extends any[], Retn extends (...args: any[]) => any>(factory: (...args: Params) => Retn, args: Params): Retn {
    return React.useCallback(factory(...args), args);
}

export function useMemo<Params extends any[], Retn extends any>(factory: (...args: Params) => () => Retn, args: Params): Retn {
    return React.useMemo(factory(...args), args);
}

export function callback<Params extends any[], Retn extends (...args: any[]) => any>(factory: (...args: Params) => Retn) {
    return (...args: Params) => React.useCallback(factory(...args), args);
}

export function memo<Params extends any[], Retn extends any>(factory: (...args: Params) => Retn) {
    return (...args: Params): Retn => React.useMemo(() => factory(...args), args);
}
