import * as React from 'react';

import { TreeView } from './widgets/tree-view/TreeView';
import { AppContext } from './state/AppContext';
import { updateGrammarTree, hoverGrammarNode, unhoverGrammarNode, selectGrammarNode } from './state/AppActions';
import { callback } from './react/hooks';
import { AppActions } from './state/AppReducer';
import { TreeViewModel } from './widgets/tree-view/TreeViewState';
import { GrammarTree } from './domain/grammar/Grammar';
import { ValueEditorHeader } from './editor/ValueEditorHeader';
import { ContainerEditorHeader } from './editor/ContainerEditorHeader';
import { TreeViewLabel } from './widgets/tree-view/TreeViewLabel';
import { H_LINE_BOTTOM } from './styles/relief';
import { Button } from './widgets/Button';
import { COLOR_BG_3, COLOR_BG_4 } from './styles/colors';

export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    const onOver = onOverCallback(dispatch);
    const onOut = onOutCallback(dispatch);
    const onSelect = onSelectCallback(dispatch);
    const renderHeader = renderHeaderCallback(state.availableCodecs, dispatch);
    
    return <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
    }}>
        <div style={{
            flexGrow: 1,
            height: '100px',
            ...H_LINE_BOTTOM
        }}>
            <TreeView 
                    state={state.grammarTree} 
                    onChange={(t) => dispatch(updateGrammarTree(t))}
                    renderHeader={renderHeader}
                    onOver={onOver}
                    onOut={onOut}
                    onSelect={onSelect} />
        </div>
        <div style={{
            padding: '6px 10px',
            background: `linear-gradient(0deg, ${COLOR_BG_3} 45%, ${COLOR_BG_4} 90%)`,
            boxShadow: 'rgba(255, 255, 255, 0.063) 0px 1px 1px inset',

        }}>
            <Button onClick={() => {}} value="+" tooltip="Add grammar element" />
            <Button onClick={() => {}} value="-" tooltip="Remove grammar element" style={{marginLeft: '10px' }} />
        </div>
    </div>
}

const onOverCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => dispatch(hoverGrammarNode(node.data)));
const onOutCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => dispatch(unhoverGrammarNode(node.data)));
const onSelectCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => dispatch(selectGrammarNode(node.data)));

// TODO: Create an adapter for each node type to render the title and the editor for that node type.
const renderHeaderCallback = callback((availableCodecs: string[], dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarTree>) => {
    switch (node.data.type) {
        case 'value':
            return <ValueEditorHeader value={node.data} availableCodecs={availableCodecs} dispatch={dispatch} />;
        case 'container':
            return <ContainerEditorHeader value={node.data} dispatch={dispatch} />;
        case 'trailer':
            return <div style={{
                paddingTop: '6px'
            }}><Button onClick={() => void 0} value={'+'} size={'sm'}/></div>
        default:
            return <TreeViewLabel>{node.data.ref != null ? node.data.ref : `<${node.data.type}>`}</TreeViewLabel>;
    }
});
