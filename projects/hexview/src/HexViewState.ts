import { Highlight } from './Highlight';
import * as actions from './HexViewActions';
import { makeSelection } from './Selection';

export const hexViewInitialState = {
    selection: makeSelection(),
    highlights: [{
        color: '255, 176, 0',
        end: 120,
        start: 86
    }, {
        color: '110, 255, 0',
        end: 91,
        start: 86
    }, {
        color: '0, 255, 220',
        end: 175,
        start: 154
    }, {
        color: '204, 0, 255',
        end: 2153,
        start: 2122
    }] as Highlight[],
    hoveredHighlight: null as number | null
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
        case 'hoverHighlight':
            return {
                ...state,
                hoveredHighlight: action.data.id
            };
    }
}
