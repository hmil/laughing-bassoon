import * as React from 'react';

import { GrammarElement } from 'ui/domain/grammar/Grammar';
import { ContainerEditorHeader } from './editor/ContainerEditorHeader';
import { ValueEditorHeader } from './editor/ValueEditorHeader';
import { callback } from './react/hooks';
import {
    analyzeFile,
    createGrammarNode,
    deleteGrammarNode,
    hoverGrammarNode,
    selectGrammarNode,
    unhoverGrammarNode,
    updateGrammarTree,
    moveGrammarNode,
} from './state/AppActions';
import { AppContext } from './state/AppContext';
import { AppActions } from './state/AppReducer';
import { COLOR_BG_3, COLOR_BG_4 } from './styles/colors';
import { H_LINE_BOTTOM } from './styles/relief';
import { Button } from './widgets/Button';
import { TreeView } from './widgets/tree-view/TreeView';
import { TreeViewLabel } from './widgets/tree-view/TreeViewLabel';
import { TreeViewModel } from './widgets/tree-view/TreeViewState';
import { ServicesContext } from './ServicesContext';
import { UiAnalyzerService } from './services/ui-analyzer-service';

export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);
    const { analyzer } = React.useContext(ServicesContext);

    const onOver = onOverCallback(dispatch);
    const onOut = onOutCallback(dispatch);
    const onSelect = onSelectCallback(dispatch);
    const onChange = onChangeCallback(dispatch);
    const renderHeader = renderHeaderCallback(analyzer, state.availableCodecs, dispatch);

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
                    onChange={onChange}
                    renderHeader={renderHeader}
                    onOver={onOver}
                    onOut={onOut}
                    onRequestDrag={onRequestDrag}
                    onRequestDrop={onRequestDrop}
                    onDrop={(node, position, parent) => {
                        if (state.grammar != null) {
                            dispatch(moveGrammarNode({ elem: node.data, parent: parent?.data, position }));
                            dispatch(analyzeFile(analyzer));
                        }
                    }}
                    onSelect={onSelect} />
        </div>
        <div style={{
            padding: '6px 10px',
            background: `linear-gradient(0deg, ${COLOR_BG_3} 45%, ${COLOR_BG_4} 90%)`,
            boxShadow: 'rgba(255, 255, 255, 0.063) 0px 1px 1px inset',

        }}>
            {/* TODO: Add "create" button for each type of node. Do we need different types for containers and scalar values? */}
            <Button onClick={() => {
                const parent = state.grammarTree.selectedNodes.length === 0 ? undefined : state.grammar?.getElement(state.grammarTree.selectedNodes[0]);
                dispatch(createGrammarNode({ parent }));
                dispatch(analyzeFile(analyzer));
            }} value="+" tooltip="Add grammar element" />
            <Button onClick={() => {
                if (state.grammarTree.selectedNodes.length === 0) {
                    return;
                }
                const node = state.grammar?.getElement(state.grammarTree.selectedNodes[0]);
                if (node == null) {
                    return;
                }
                dispatch(deleteGrammarNode(node));
                dispatch(analyzeFile(analyzer));
            }} value="-" tooltip="Remove grammar element" style={{marginLeft: '10px' }} />
        </div>
    </div>
}

function onRequestDrag(node: TreeViewModel<GrammarElement>) {
    return node.data.type !== 'trailer';
}

function onRequestDrop(model: TreeViewModel<GrammarElement>) {
    return model.data.type !== 'trailer';
}

const onChangeCallback = callback((dispatch: React.Dispatch<AppActions>) => (t) => dispatch(updateGrammarTree(t)))
const onOverCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarElement>) => dispatch(hoverGrammarNode(node.data)));
const onOutCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarElement>) => dispatch(unhoverGrammarNode(node.data)));
const onSelectCallback = callback((dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarElement>) => dispatch(selectGrammarNode(node.data)));

// TODO: Create an adapter for each node type to render the title and the editor for that node type.
const renderHeaderCallback = callback((analyzer: UiAnalyzerService, availableCodecs: string[], dispatch: React.Dispatch<AppActions>) => (node: TreeViewModel<GrammarElement>) => {
    switch (node.data.type) {
        case 'value':
            return <ValueEditorHeader value={node.data} availableCodecs={availableCodecs} dispatch={dispatch} />;
        case 'container':
            return <ContainerEditorHeader value={node.data} dispatch={dispatch} />;
        case 'trailer':
            return <div style={{
                paddingTop: '6px'
            }}><Button onClick={() => {
                const parent = node.data.parent;
                dispatch(createGrammarNode({ parent }));
                dispatch(analyzeFile(analyzer));
            }} value={'+'} size={'sm'}/></div>
        default:
            return <TreeViewLabel>{node.data.ref != null ? node.data.ref : `<${node.data.type}>`}</TreeViewLabel>;
    }
});
