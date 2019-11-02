import * as React from 'react';
import { appInitialState, HexViewAction } from './AppState';

export const AppContext = React.createContext({
    state: appInitialState,
    dispatch: (_action: HexViewAction) => {
        console.error('Hex view context is not set!');
    }
});
