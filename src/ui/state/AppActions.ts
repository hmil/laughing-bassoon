import { Parser } from 'parser/Parser';
import { importStructure } from 'ui/domain/structure/converters';
import { FileStructure, FileStructureNode } from 'ui/domain/structure/Structure';
import { TreeViewNode, TreeViewState } from 'ui/widgets/tree-view/TreeViewState';

import { AppState } from './AppState';
import { Grammar, GrammarElement } from 'ui/domain/grammar/Grammar';
import { arrayInsert } from 'std/readonly-arrays';

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
    if (state.structure != null) {
        const structureNodes = state.structure.indexByGrammarNode[node.id];
        if (structureNodes != null) {
            state = {...state, structureTree: state.structureTree.unselectAll().selectNodes(structureNodes.map(node => `${node.id}`))};
        }
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
    const grammar = state.grammar.update(node.id, node);
    return {
        ...state,
        grammar: grammar,
        grammarTree: grammar.asTreeViewState(state.grammarTree)
    };
});

export const createGrammarNode = action('createGrammarNode', (state: AppState, {parent, defaultProps, position}: 
        {parent: GrammarElement, defaultProps?: GrammarElement, position?: number}) => {
    if (state.grammar == null) {
        return state;
    }
    let grammar = state.grammar;
    const newElement = grammar.createElement('value');
    if (defaultProps != null) {
        grammar = grammar.update(newElement.id, Object.assign({}, defaultProps, { id: newElement.id }));
        const p2 = grammar.getElement(parent.id);
        if (p2 != null) {
            parent = p2;
        }
    }

    // TODO: Something fishy going on here. Probably because of GC system in grammar data structure
    grammar = grammar.update(parent.id, {...parent, children: arrayInsert(parent.children, position ?? (parent.children.length - 1), newElement.id)});
    let grammarTree = grammar.asTreeViewState(state.grammarTree).unselectAll().selectNode(newElement.id);

    const parentChain: GrammarElement[] = [];
    let current: GrammarElement | undefined = parent;
    while (current) {
        parentChain.push(current);
        current = grammar.getParent(current);
    }
    for (let i = parentChain.length - 1 ; i >= 0 ; i--) {
        const current = parentChain[i];
        const currentNode = grammarTree.getNode(current.id);
        if (grammarTree.isCollapsed(current.id) && currentNode != null) {
            grammarTree = grammarTree.toggleNode(currentNode);
        }
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
    const parent = state.grammar.getParent(node);
    const grammar = state.grammar.removeElement(node.id);
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

export const analyzeFile = action('analyzeFile', (state: AppState, _: undefined) => {
    if (state.grammar == null || state.fileData == null) {
        return state;
    }
    const parser = new Parser(state.grammar.asParserDefinition, state.fileData);
    const tree = parser.parse();
    state = loadStructure.reduce(state, importStructure(tree, state.grammar.parserBackMapping));
    state = setAvailableCodecs.reduce(state, parser.codecLibrary.getAllCodecNames());
    return state;
});
