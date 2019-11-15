import { Parser } from 'parser/Parser';
import { exportGrammar } from 'ui/domain/grammar/converters';
import { Grammar, GrammarTree, updateGrammarNode } from 'ui/domain/grammar/Grammar';
import { importStructure } from 'ui/domain/structure/converters';
import { FileStructure, FileStructureNode } from 'ui/domain/structure/Structure';
import { TreeViewNode, TreeViewState } from 'ui/widgets/tree-view/TreeViewState';

import { AppState } from './AppState';

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

function makeGrammarTree(grammar: Grammar): TreeViewState<GrammarTree> {

    function rec(node: GrammarTree): TreeViewNode<GrammarTree> {
        return {
            children: node.children.map(rec),
            data: node,
            id: `${node.id}`
        }
    }

    return TreeViewState.create(grammar.definition.children.map(rec));
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

export const loadFile = action('loadFile', (state: AppState, fileData: Uint8Array) => ({ ...state, fileData }));
export const requestChunks = action('requestChunks', (state: AppState, activeChunks: number[]) => ({ ...state, activeChunks }));


export const loadGrammar = action('loadGrammar', (state: AppState, data: Grammar) => (<AppState>{
    ...state,
    grammar: data,
    grammarTree: makeGrammarTree(data)
}));

export const updateGrammarTree = action('updateGrammarTree', (state: AppState, grammarTree: TreeViewState<GrammarTree>) => ({
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

export const unhoverGrammarNode = action('unhoverGrammarNode', (state: AppState, _node: GrammarTree) => {
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

export const hoverGrammarNode = action('hoverGrammarNode', (state: AppState, node: GrammarTree) => {
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
        hoveredGrammarNode: node != null ? node.path : null,
        grammarTree: state.grammarTree.unhoverAll().hoverNode(`${node.id}`)
    };
});

export const selectGrammarNode = action('selectGrammarNode', (state: AppState, node: GrammarTree) => {
    if (state.structure != null) {
        const structureNodes = state.structure.indexByGrammarNode[node.id];
        if (structureNodes != null) {
            state = {...state, structureTree: state.structureTree.unselectAll().selectNodes(structureNodes.map(node => `${node.id}`))};
        }
    }
    return {
        ...state,
        selectedGrammarNode: node.path,
        grammarTree: state.grammarTree.unselectAll().selectNode(`${node.id}`)
    };
});

export const editGrammarNode = action('editGrammarNode', (state: AppState, node: GrammarTree ) => {
    if (state.grammar == null) {
        return state;
    }
    return {
        ...state,
        grammar: updateGrammarNode(state.grammar, node.path, node)
    };
});

export const analyzeFile = action('analyzeFile', (state: AppState, _: undefined) => {
    if (state.grammar == null || state.fileData == null) {
        return state;
    }
    const { definition, backMapping } = exportGrammar(state.grammar);
    const parser = new Parser(definition, state.fileData);
    const tree = parser.parse();
    state = loadStructure.reduce(state, importStructure(tree, backMapping));
    state = setAvailableCodecs.reduce(state, parser.codecLibrary.getAllCodecNames());
    return state;
});
