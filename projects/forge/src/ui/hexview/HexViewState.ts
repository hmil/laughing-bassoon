import * as actions from './HexViewActions';
import { makeSelection } from './Selection';

export const hexViewInitialState = {
    selection: makeSelection(),
};
export type HexViewState = Readonly<typeof hexViewInitialState>;

type UnionOfValues<T extends { [k: string]: any}, K extends keyof T> = K extends keyof T ? ReturnType<T[K]> : never;
export type HexViewAction = UnionOfValues<typeof actions, keyof typeof actions>


export function hexViewReducer(state: HexViewState, action: HexViewAction): HexViewState {
    switch (action.type) {
        case 'setSelection':
            return {
                ...state,
                selection: action.data
            };
        case 'addHighlight':
            return state;
    }
}
