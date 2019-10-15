import * as React from 'react';
import { hexViewInitialState, HexViewAction } from './HexViewState';

export const HexViewContext = React.createContext({
    state: hexViewInitialState,
    dispatch: (_action: HexViewAction) => {
        console.error('Hex view context is not set!');
    }
});
