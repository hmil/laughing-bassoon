import { Grammar, GrammarTree, updateGrammarNode, getGrammarNode } from 'ui/domain/grammar/Grammar';
import { AppState } from './AppState';
import { FileStructure, FileStructureNode, updateStructureNode, getStructureNode } from 'ui/domain/structure/Structure';

export interface BaseAction<Type extends string, DATA> {
    type: Type;
    data: DATA;
}

function oldMakeAction<Type extends string, Data>(type: Type, data: Data): BaseAction<Type, Data> {
    return { type, data };
}

export const loadFile = (data: Uint8Array) => oldMakeAction('loadFile', data);
export const loadGrammar = (data: Grammar) => oldMakeAction('loadGrammar', data);
export const requestChunks = (data: number[]) => oldMakeAction('requestChunks', data);
export const setAvailableCodecs = (data: string[]) => oldMakeAction('setAvailableCodecs', data);

interface ActionFactory<Type extends string, S, D> {
    (d: D): BaseAction<Type, D>;
    reduce(s: S, a: D): S;
}

function action<T extends string, S, D>(type: T, factory: (s: S, data: D) => S): ActionFactory<T, S, D> {
    const f: ActionFactory<T, S, D> = data => ({ data, type });
    f.reduce = factory;
    return f;
}

export const loadStructure = action('loadStructure', (state: AppState, structure: FileStructure | null) => ({ ...state, structure }));

export const hoverStructureNode = action('hoverStructureNode', (state: AppState, node: FileStructureNode | null) => {
    if (state.structure == null || (node != null && state.hoveredStructureNode == node.path)) {
        return state;
    }
    let structure = state.structure;
    if (node != null) {
        structure = updateStructureNode(structure, node.path, { ...node, isHovered: true });
    }
    if (state.hoveredStructureNode != null) {
        const node = getStructureNode(structure, state.hoveredStructureNode);
        structure = updateStructureNode(structure, state.hoveredStructureNode, { ...node, isHovered: false });
    }
    return {
        ...state,
        hoveredStructureNode: node != null ? node.path : null,
        structure
    };
});

export const selectStructureNode = action('selectStructureNode', (state: AppState, node: FileStructureNode) => {
    if (state.structure == null || state.selectedStructureNode === node.path) {
        return state;
    }
    let structure = state.structure;
    structure = updateStructureNode(structure, node.path, { ...node, isSelected: true });
    if (state.selectedStructureNode != null) {
        const node = getStructureNode(structure, state.selectedStructureNode);
        structure = updateStructureNode(structure, state.selectedStructureNode, { ...node, isSelected: false });
    }
    return {
        ...state,
        selectedStructureNode: node.path,
        structure
    };
});

export const hoverGrammarNode = action('hoverGrammarNode', (state: AppState, node: GrammarTree | null) => {
    if (state.grammar == null) {
        return state;
    }
    let grammar = state.grammar;
    if (node != null) {
        grammar = updateGrammarNode(grammar, node.path, { ...node, isHovered: true });
    }
    if (state.hoveredGrammarNode != null) {
        const node = getGrammarNode(grammar, state.hoveredGrammarNode);
        grammar = updateGrammarNode(grammar, state.hoveredGrammarNode, { ...node, isHovered: false });
    }
    return {
        ...state,
        hoveredGrammarNode: node != null ? node.path : null,
        grammar
    };
});

export const selectGrammarNode = action('selectGrammarNode', (state: AppState, node: GrammarTree) => {
    if (state.grammar == null || state.selectedGrammarNode === node.path) {
        return state;
    }
    let grammar = state.grammar;
    grammar = updateGrammarNode(grammar, node.path, { ...node, isSelected: true });
    if (state.selectedGrammarNode != null) {
        const node = getGrammarNode(grammar, state.selectedGrammarNode);
        grammar = updateGrammarNode(grammar, state.selectedGrammarNode, { ...node, isSelected: false });
    }
    return {
        ...state,
        selectedGrammarNode: node.path,
        grammar
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
