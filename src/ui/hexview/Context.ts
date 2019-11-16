import * as React from 'react';
import { hexViewInitialState, HexViewAction } from './HexViewState';
import { FileStructure } from 'ui/domain/structure/Structure';

export const HexViewContext = React.createContext({
    state: hexViewInitialState,
    hoveredNodes: [] as string[],
    selectedNodes: [] as string[],
    abt: null as FileStructure | null,
    // tslint:disable-next-line: no-useless-cast
    getCurrentScroll: () => 0 as number,
    dispatch: (_action: HexViewAction) => {
        console.error('Hex view context is not set!');
    }
});
