import * as actions from './AppActions';
import { AppState } from './AppState';

type UnionOfValues<T extends { [k: string]: any}, K extends keyof T> = K extends keyof T ? ReturnType<T[K]> : never;
export type AppActions = UnionOfValues<typeof actions, keyof typeof actions>;

export function appReducer(state: AppState, action: AppActions): AppState {
    // I can't get TypeScript to understand that the union on the left hand side has a type-safe 1:1 mapping with the rhs
    return (actions[action.type].reduce as any)(state, action.data as any);
}
