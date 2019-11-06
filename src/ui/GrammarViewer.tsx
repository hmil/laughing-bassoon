import * as React from 'react';

import { Parser } from 'parser/Parser';

import { AnyElement, ContainerField, ParserDefinition } from '../parser/model';
import { uniqId } from '../parser/uid';
import { hoverAbtNode, loadGrammar, loadParseTree, selectNode } from '../state/AppActions';
import { AppContext } from '../state/AppContext';
import { dumbFindNodes, findNodesByOrigin, AppActions, GrammarUiStateTree } from '../state/AppState';
import { FixedFieldEditorHeader } from './editor/FixedFieldEditorHeader';
import { RenderNodeProps, TreeView, TreeViewAdapter } from './widgets/TreeView';
import { TextInput } from './widgets/TextInput';
import { useMemo, callback } from './react/hooks';
import { AbtRoot } from 'abt/Abt';

const idMap = new WeakMap<AnyElement | ParserDefinition, string>();

function makeSyntheticRoot(nodes: AnyElement[]): ContainerField {
    return {
        content: nodes,
        name: 'root',
        type: 'container'
    };
}

export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    // const hoveredNodes = (() => {
    //     if (state.abt == null) {
    //         return [];
    //     }
    //     const nodes = dumbFindNodes(state.abt, state.hoveredNodes);
        
    //     return nodes.map(n => identifyNode(n.origin));
    // })();

    const selectedNodes = useMemo(computeSelectedNodes, [state.abt, state.selectedNodes]);

    const onHover = onOverCallback(state.abt, dispatch);
    const onOut = onOutCallback(dispatch);
    const onSelect = onSelectCallback(state.abt, dispatch);
    const onChange = onChangeCallback(state.grammar, dispatch, state.fileData);

    if (state.grammar != null && state.grammarUiState != null) {
        const adapter = makeAdapter(makeSyntheticRoot(state.grammar.content), state.grammarUiState);
    
        return <TreeView
                    identify={identifyNode}
                    renderHeader={renderHeader}
                    renderBody={renderEditor}
                    selectedNodes={selectedNodes}
                    onOver={onHover}
                    onOut={onOut}
                    onSelect={onSelect}
                    setChild={setNodeChild}
                    onChange={onChange}
                    adapter={adapter}
            ></TreeView>
    } else {
        return <div>No data</div>;
    }

}

const onOverCallback = callback((abt: AbtRoot | null, dispatch: React.Dispatch<AppActions>) => 
    (node: AnyElement) => {
        const id = identifyNode(node);
        if (abt == null) {
            return;
        }

        const nodes = findNodesByOrigin(abt, id, identifyNode);
        dispatch(hoverAbtNode({ids: nodes.map(n => n.id)}));
    }
);

const onOutCallback = callback((dispatch: React.Dispatch<AppActions>) => () => dispatch(hoverAbtNode({ids: []})));

const onSelectCallback = callback((abt: AbtRoot | null, dispatch: React.Dispatch<AppActions>) => 
    (node: AnyElement) => {
        const id = identifyNode(node);
        if (abt == null) {
            return;
        }

        const nodes = findNodesByOrigin(abt, id, identifyNode);
        if (nodes.length > 0) {
            dispatch(selectNode({ids: nodes.map(n => n.id)}));
        }
    }
);

const onChangeCallback = callback((grammar: ParserDefinition | null, dispatch: React.Dispatch<AppActions>, fileData: Uint8Array | null) =>
    (syntheticRoot: AnyElement) => {
        if (grammar == null) {
            throw new Error('Grammar was null for some reason');
        }
        if (!('content' in syntheticRoot) || syntheticRoot.content == null) {
            throw new Error('no content in root');
        }
        console.log('changed');
        const newGrammar = {
            ...grammar,
            content: syntheticRoot.content
        };
        dispatch(loadGrammar(newGrammar));
        if (fileData != null) {
            const parser = new Parser(newGrammar, fileData);
            const tree = parser.parse();
            dispatch(loadParseTree(tree));
        }
    }
);

function computeSelectedNodes(abt: AbtRoot | null, selectedNodes: number[]) {
    return () => {
        if (abt == null) {
            return [];
        }
        const nodes = dumbFindNodes(abt, selectedNodes);

        return nodes.map(n => identifyNode(n.origin));
    };
}

function renderEditor({node}: RenderNodeProps<AnyElement>) {
    switch (node.type) {
        case 'repeat':
            return <div style={{
                padding: "0 10px"
            }}>
                repeat until:
                <div style={{
                        border: "1px #1a1a1a solid",
                        minHeight: "100px",
                        padding: "3px"
                }}>
                    {/* <TreeView
                        root={makeSyntheticRoot(node.until)}
                        identify={identifyNode}
                        renderHeader={renderHeader}
                        renderBody={renderEditor}
                        getChildren={getNodeChildren}
                        setChild={setNodeChild}></TreeView> */}
                </div>
            </div>;
        case 'if':
            return <div style={{
                padding: "0 10px"
            }}>
                <div>if <TextInput value={node.cond}/></div>
                { node.then != null ? <div>
                    then:
                    <div style={{
                            border: "1px #1a1a1a solid",
                            minHeight: "100px",
                            padding: "3px"
                    }}>
                        {/* <TreeView
                            root={makeSyntheticRoot(node.then)}
                            identify={identifyNode}
                            renderHeader={renderHeader}
                            renderBody={renderEditor}
                            hoveredNodes={hoveredNodes}
                            selectedNodes={selectedNodes}
                            onOver={onHover}
                            onSelect={onSelect}
                            getChildren={getNodeChildren}
                            setChild={setNodeChild}></TreeView> */}
                    </div>
                </div> : undefined }
                { node.else != null ? <div>
                    else:
                    <div style={{
                            border: "1px #1a1a1a solid",
                            minHeight: "100px",
                            padding: "3px"
                    }}>
                        {/* <TreeView
                            root={makeSyntheticRoot(node.else)}
                            identify={identifyNode}
                            renderHeader={renderHeader}
                            renderBody={renderEditor}
                            hoveredNodes={hoveredNodes}
                            selectedNodes={selectedNodes}
                            onOver={onHover}
                            onSelect={onSelect}
                            getChildren={getNodeChildren}
                            setChild={setNodeChild}></TreeView> */}
                    </div>
                </div> : undefined }
            </div>;
    }
    return undefined;
}

function makeAdapter(node: AnyElement, tree: GrammarUiStateTree): TreeViewAdapter<AnyElement> {
    return {
        getChildren() {
            return useMemo(makeAdapterChildren, [node, tree]);
        },
        isHovered: false, // TODO: Performant hover feature
        node
    };
}

function makeAdapterChildren(node: AnyElement, tree: GrammarUiStateTree) {
    return () => {
        const children = getNodeChildren(node);
        const hoverChildren = tree.children;
        if (hoverChildren.length !== children.length) {
            throw new Error('length dont match');
        }
        return children.map((n, i) => makeAdapter(n, hoverChildren[i]));
    }
}

// TODO: Externalize renderer definition. Should not have element-specific switch-cases in here.


function getNodeChildren(node: AnyElement): AnyElement[] {
    // TODO: Switch case
    if ('content' in node) {
        return node.content != null ? node.content : [];
    }

    switch (node.type) {
        case 'repeat':
            return [...node.do];
    }

    return [];
}

function setNodeChild(parent: AnyElement, child: AnyElement, i: number): AnyElement {
    if ('content' in parent) {
        if (parent.content == null || parent.content.length <= i) {
            console.error('Cannot delete child in empty array');
            return parent;
        }
        return {
            ...parent,
            content: [ ...parent.content.slice(0, i), child, ...parent.content.slice(i + 1)]
        };
    }

    switch (parent.type) {
        case 'repeat':
            return {
                ...parent,
                do: [ ...parent.do.slice(0, i), child, ...parent.do.slice(i + 1)]
            };
    }

    return parent;
}


// TODO: Create an adapter for each node type to render the title and the editor for that node type.
function renderHeader({node, onChange}: RenderNodeProps<AnyElement>) {
    switch (node.type) {
        case 'fixed':
            return <FixedFieldEditorHeader value={node} onChange={onChange}></FixedFieldEditorHeader>
        default:
            return 'name' in node ? node.name : `<${node.type}>`;
    }
}

function identifyNode(node: AnyElement | ParserDefinition) {
    let id = idMap.get(node);
    if (id == null) {
        id = `${uniqId()}`
        idMap.set(node, id);
    }
    return `${id}`;
}