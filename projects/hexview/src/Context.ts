import * as React from 'react';
import { hexViewInitialState, HexViewAction } from './HexViewState';

export const HexViewContext = React.createContext({
    state: hexViewInitialState,
    // tslint:disable-next-line: no-useless-cast
    getCurrentScroll: () => 0 as number,
    dispatch: (_action: HexViewAction) => {
        console.error('Hex view context is not set!');
    }
});
