import { FileStructure, FileStructureNode } from 'ui/domain/structure/Structure';
import { TreeViewNode, TreeViewState } from 'ui/widgets/tree-view/TreeViewState';

import { AppState } from './AppState';
import { Grammar, GrammarElement } from 'ui/domain/grammar/Grammar';
import { arrayInsert, arrayRemove } from 'std/readonly-arrays';
import { UiAnalyzerService } from 'ui/services/ui-analyzer-service';

export interface BaseAction<Type extends string, DATA> {
    type: Type;
    data: DATA;
}

interface ActionFactory<Type extends string, S, D> {
    (d: D): BaseAction<Type, D>;
    reduce(s: S, a: D): S;
}

function action<T extends string, S, D>(type: T, factory: (s: S, data: D) => S): ActionFactory<T, S, D> {
    const f: ActionFactory<T, S, D> = data => ({ data, type });
    f.reduce = factory;
    return f;
}

function makeStructureTree(structure: FileStructure): TreeViewState<FileStructureNode> {

    function rec(node: FileStructureNode): TreeViewNode<FileStructureNode> {
        return {
            children: node.children.map(rec),
            data: node,
            id: `${node.id}`
        }
    }

    return TreeViewState.create(structure.root.children.map(rec));
}

export const loadFile = action('loadFile', (state: AppState, {fileData, fileName}: {fileData: Uint8Array, fileName: string}) => ({ ...state, fileData, fileName }));
export const requestChunks = action('requestChunks', (state: AppState, activeChunks: number[]) => ({ ...state, activeChunks }));


export const loadGrammar = action('loadGrammar', (state: AppState, data: Grammar) => (<AppState>{
    ...state,
    grammar: data,
    grammarTree: data.asTreeViewState()
}));

export const updateGrammarTree = action('updateGrammarTree', (state: AppState, grammarTree: TreeViewState<GrammarElement>) => ({
    ...state,
    grammarTree
}));

export const updateStructureTree = action('updateStructureTree', (state: AppState, structureTree: TreeViewState<FileStructureNode>) => ({
    ...state,
    structureTree
}));

export const setAvailableCodecs = action('setAvailableCodecs', (state: AppState, availableCodecs: string[]) => ({ ...state, availableCodecs }));

export const loadStructure = action('loadStructure', (state: AppState, structure: FileStructure) => (<AppState>{
    ...state,
    structure,
    structureTree: makeStructureTree(structure),
    selectedStructureNode: null,
    hoveredStructureNode: null
}));

export const hoverStructureNode = action('hoverStructureNode', (state: AppState, node: FileStructureNode) => {
    return {
        ...state,
        grammarTree: state.grammarTree.unhoverAll().hoverNode(`${node.origin}`),
        structureTree: state.structureTree.unhoverAll().hoverNode(`${node.id}`)
    };
});

export const selectStructureNode = action('selectStructureNode', (state: AppState, node: FileStructureNode) => {
    return {
        ...state,
        structureTree: state.structureTree.unselectAll().selectNode(`${node.id}`),
        grammarTree: state.grammarTree.unselectAll().selectNode(`${node.origin}`)
    };
});

export const unhoverGrammarNode = action('unhoverGrammarNode', (state: AppState, _node: GrammarElement) => {
    return {
        ...state,
        grammarTree: state.grammarTree.unhoverAll(),
        structureTree: state.structureTree.unhoverAll()
    }
});

export const unhoverStructureNode = action('unhoverStructureNode', (state: AppState, _node: FileStructureNode) => {
    return {
        ...state,
        grammarTree: state.grammarTree.unhoverAll(),
        structureTree: state.structureTree.unhoverAll()
    }
});

export const hoverGrammarNode = action('hoverGrammarNode', (state: AppState, node: GrammarElement) => {
    if (state.grammar == null) {
        return state;
    }
    if (state.structure != null) {
        const structureNodes = state.structure.indexByGrammarNode[node.id];
        if (structureNodes != null) {
            state = {...state, structureTree: state.structureTree.unhoverAll().hoverNodes(structureNodes.map(node => `${node.id}`))};
        }
    }
    return {
        ...state,
        grammarTree: state.grammarTree.unhoverAll().hoverNode(`${node.id}`)
    };
});

export const selectGrammarNode = action('selectGrammarNode', (state: AppState, node: GrammarElement) => {
    if (node.type === 'trailer') {
        return state;
    }
    if (state.structure != null) {
        const structureNodes = state.structure.indexByGrammarNode[node.id];
        let structureTree = state.structureTree.unselectAll();
        if (structureNodes != null) {
            structureTree = structureTree.selectNodes(structureNodes.map(node => `${node.id}`));
        }
        state = {...state, structureTree };
    }
    return {
        ...state,
        grammarTree: state.grammarTree.unselectAll().selectNode(`${node.id}`)
    };
});

export const editGrammarNode = action('editGrammarNode', (state: AppState, node: GrammarElement) => {
    if (state.grammar == null) {
        return state;
    }
    const grammar = state.grammar.update(node);
    return {
        ...state,
        grammar: grammar,
        grammarTree: grammar.asTreeViewState(state.grammarTree)
    };
});

export const moveGrammarNode = action('moveGrammarNode', (state: AppState, { elem, parent, position }: { elem: GrammarElement, parent?: GrammarElement, position: number}) => {
    if (state.grammar == null) {
        return state;
    }
    let grammar = state.grammar;

    if (parent == null) {
        if (elem.parent != null) {
            const removeIdx = elem.parent.content.findIndex(p => p.id === elem.id);
            if (removeIdx < 0) {
                throw new Error('Node not found in parent');
            }
            elem.parent.content = arrayRemove(elem.parent.content, removeIdx);
            grammar = grammar.update(elem.parent);
        }
    } else {
        if (parent.id === elem.parent?.id) {
            console.log('same parent');
            const removeIdx = parent.content.findIndex(p => p.id === elem.id);
            if (removeIdx < 0) {
                throw new Error('Node not found in parent');
            }
            parent.content = arrayRemove(parent.content, removeIdx);
        }
        parent.content = arrayInsert(parent.content, position, elem);
        grammar = grammar.update(parent);
    }

    return { ...state, grammar, grammarTree: grammar.asTreeViewState(state.grammarTree) };
});

export const createGrammarNode = action('createGrammarNode', (state: AppState, {parent, position, collapsed}: 
        {parent: GrammarElement | undefined, position?: number, collapsed?: boolean}) => {
    if (state.grammar == null) {
        return state;
    }

    // Create and populate new node
    let grammar = state.grammar;
    const newElement = grammar.createElement('value');

    // Add the new node to its parent
    if (parent != null) {
        const p2 = grammar.getElement(parent.id);
        if (p2 != null) {
            parent = p2;
        }

        // TODO: This should be handled in the grammar itself
        if ('content' in parent) {
            const updatedParent = {
                ...parent, 
                content: arrayInsert(parent.content, position != null ? position : (parent.content.length - 1), newElement)
            };
            grammar = grammar.update(updatedParent);
        }
    } else {
        grammar = grammar.addRoot(newElement, position);
    }

    // Select the new node
    let grammarTree = grammar.asTreeViewState(state.grammarTree).unselectAll().selectNode(newElement.id);

    // Un-collapse all parent nodes such that the new node is visible
    const parentChain: GrammarElement[] = [];
    let current: GrammarElement | undefined = parent;
    while (current) {
        parentChain.push(current);
        current = current.parent;
    }
    for (let i = parentChain.length - 1 ; i >= 0 ; i--) {
        const current = parentChain[i];
        const currentNode = grammarTree.getNode(current.id);
        if (grammarTree.isCollapsed(current.id) && currentNode != null) {
            grammarTree = grammarTree.toggleNode(currentNode);
        }
    }

    // Set new node to collapsed if it should be collapsed
    const newNode = grammarTree.getNode(newElement.id);
    if (collapsed && newNode != null) {
        grammarTree = grammarTree.toggleNode(newNode);
    }
    return {
        ...state,
        grammar,
        grammarTree
    };
});

export const deleteGrammarNode = action('deleteGrammarNode', (state: AppState, node: GrammarElement) => {
    if (state.grammar == null) {
        return state;
    }
    const parent = node.parent;
    let grammar = state.grammar.removeElement(node.id);
    let grammarTree = grammar.asTreeViewState(state.grammarTree).unselectAll();
    if (parent != null) {
        grammarTree = grammarTree.selectNode(parent.id);
    }
    return {
        ...state,
        grammar,
        grammarTree
    };
});

export const analyzeFile = action('analyzeFile', (state: AppState, analyzer: UiAnalyzerService) => {
    analyzer.analyzeFile(state).catch(e => console.error(e));
    return {
        ...state,
        isAnalysisInProgress: true
    };
});

export const loadResult = action('loadResult', (state: AppState, result: {tree: FileStructure, codecs: string[]}) => {
    if (state.grammar == null || state.fileData == null) {
        return state;
    }
    state = loadStructure.reduce(state, result.tree);
    state = setAvailableCodecs.reduce(state, result.codecs);
    return { ...state, isAnalysisInProgress: false };
});