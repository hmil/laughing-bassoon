import * as React from 'react';
import { appInitialState } from './AppState';
import { AppActions } from './AppReducer';

export const AppContext = React.createContext({
    state: appInitialState,
    dispatch: (_action: AppActions) => {
        console.error('Hex view context is not set!');
    }
});
