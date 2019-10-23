import * as React from 'react';
import { hexViewInitialState, HexViewAction } from './HexViewState';
import { Highlight } from './highlight/Highlight';

export const HexViewContext = React.createContext({
    state: hexViewInitialState,
    highlights: [] as Highlight[],
    // tslint:disable-next-line: no-useless-cast
    getCurrentScroll: () => 0 as number,
    dispatch: (_action: HexViewAction) => {
        console.error('Hex view context is not set!');
    }
});
