import * as React from 'react';
import { hexViewInitialState, HexViewAction } from './HexViewState';
import { FileStructureNode } from 'ui/domain/structure/Structure';
import { TreeViewState } from 'ui/widgets/tree-view/TreeViewState';

export const HexViewContext = React.createContext({
    state: hexViewInitialState,
    abt: TreeViewState.createEmpty<FileStructureNode>(),
    // tslint:disable-next-line: no-useless-cast
    getCurrentScroll: () => 0 as number,
    dispatch: (_action: HexViewAction) => {
        console.error('Hex view context is not set!');
    }
});
