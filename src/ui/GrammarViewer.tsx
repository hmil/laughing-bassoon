import { Parser } from 'parser/Parser';
import * as React from 'react';

import { AnyElement, ContainerField } from '../parser/model';
import { uniqId } from '../parser/uid';
import { hoverHighlight, loadGrammar, loadParseTree, selectNode } from '../state/AppActions';
import { AppContext } from '../state/AppContext';
import { dumbFindNodes, findNodesByOrigin } from '../state/AppState';
import { FixedFieldEditorHeader } from './editor/FixedFieldEditorHeader';
import { RenderNodeProps, TreeView } from './widgets/TreeView';

const idMap = new WeakMap<AnyElement, string>();

function makeSyntheticRoot(nodes: AnyElement[]): ContainerField {
    return {
        content: nodes,
        name: 'root',
        type: 'container'
    };
}

export function GrammarViewer() {

    const { state, dispatch } = React.useContext(AppContext);

    const hoveredNodes = (() => {
        if (state.abt == null) {
            return [];
        }
        const nodes = dumbFindNodes(state.abt, state.hoveredNodes);
        
        return nodes.map(n => identifyNode(n.origin));
    })();

    const selectedNodes = (() => {
        if (state.abt == null) {
            return [];
        }
        const nodes = dumbFindNodes(state.abt, state.selectedNodes);

        return nodes.map(n => identifyNode(n.origin));
    })();

    function onHover(node: AnyElement) {
        const id = identifyNode(node);
        if (state.abt == null) {
            return;
        }

        const nodes = findNodesByOrigin(state.abt, id, identifyNode);
        dispatch(hoverHighlight({ids: nodes.map(n => n.id)}));
    }

    function onSelect(node: AnyElement) {
        const id = identifyNode(node);
        if (state.abt == null) {
            return;
        }

        const nodes = findNodesByOrigin(state.abt, id, identifyNode);
        if (nodes.length > 0) {
            dispatch(selectNode({ids: nodes.map(n => n.id)}));
        }
    }

    function onChange(syntheticRoot: AnyElement) {
        if (state.grammar == null) {
            throw new Error('Grammar was null for some reason');
        }
        if (!('content' in syntheticRoot) || syntheticRoot.content == null) {
            throw new Error('no content in root');
        }
        console.log('changed');
        const newGrammar = {
            ...state.grammar,
            content: syntheticRoot.content
        };
        dispatch(loadGrammar(newGrammar));
        if (state.fileData != null) {
            const parser = new Parser(newGrammar, state.fileData);
            const tree = parser.parse();
            dispatch(loadParseTree(tree));
        }
    }

    return state.grammar != null 
        ? <TreeView<AnyElement>
                root={makeSyntheticRoot(state.grammar.content)}
                identify={identifyNode}
                renderHeader={renderHeader}
                renderBody={renderEditor}
                hoveredNodes={hoveredNodes}
                selectedNodes={selectedNodes}
                onHover={onHover}
                onSelect={onSelect}
                getChildren={getNodeChildren}
                setChild={setNodeChild}
                onChange={onChange}
        ></TreeView>
        : <div>No data</div>;

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
                        <TreeView
                            root={makeSyntheticRoot(node.until)}
                            identify={identifyNode}
                            renderHeader={renderHeader}
                            renderBody={renderEditor}
                            getChildren={getNodeChildren}
                            setChild={setNodeChild}></TreeView>
                    </div>
                </div>;
            case 'if':
                return <div style={{
                    padding: "0 10px"
                }}>
                    <div>if <input value={node.cond} readOnly/></div>
                    { node.then != null ? <div>
                        then:
                        <div style={{
                                border: "1px #1a1a1a solid",
                                minHeight: "100px",
                                padding: "3px"
                        }}>
                            <TreeView
                                root={makeSyntheticRoot(node.then)}
                                identify={identifyNode}
                                renderHeader={renderHeader}
                                renderBody={renderEditor}
                                hoveredNodes={hoveredNodes}
                                selectedNodes={selectedNodes}
                                onHover={onHover}
                                onSelect={onSelect}
                                getChildren={getNodeChildren}
                                setChild={setNodeChild}></TreeView>
                        </div>
                    </div> : undefined }
                    { node.else != null ? <div>
                        else:
                        <div style={{
                                border: "1px #1a1a1a solid",
                                minHeight: "100px",
                                padding: "3px"
                        }}>
                            <TreeView
                                root={makeSyntheticRoot(node.else)}
                                identify={identifyNode}
                                renderHeader={renderHeader}
                                renderBody={renderEditor}
                                hoveredNodes={hoveredNodes}
                                selectedNodes={selectedNodes}
                                onHover={onHover}
                                onSelect={onSelect}
                                getChildren={getNodeChildren}
                                setChild={setNodeChild}></TreeView>
                        </div>
                    </div> : undefined }
                </div>;
        }
        return undefined;
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

function identifyNode(node: AnyElement) {
    let id = idMap.get(node);
    if (id == null) {
        id = `${uniqId()}`
        idMap.set(node, id);
    }
    return `${id}`;
}