import * as actions from './AppActions';
import { AbtRoot, AbtNode } from '../abt/Abt';
import { SemanticViewerState, semanticViewerDefaultState } from './SemanticViewerState';
import { SemanticViewer } from '../ui/SemanticViewer';
import { ParserDefinition, AnyElement } from '../parser/model';

export interface AppState {
    fileData: Uint8Array | null;
    activeChunks: number[];
    abt: AbtRoot | null;
    hoveredNodes: number[];
    selectedNodes: number[];
    semanticViewer: SemanticViewerState;
    grammar: ParserDefinition | null;
}

export const appInitialState: AppState = {
    fileData: null,
    activeChunks: [0, 1, 2],
    hoveredNodes: [],
    selectedNodes: [],
    semanticViewer: semanticViewerDefaultState,
    grammar: null,
    abt: null
};


type UnionOfValues<T extends { [k: string]: any}, K extends keyof T> = K extends keyof T ? ReturnType<T[K]> : never;
export type AppActions = UnionOfValues<typeof actions, keyof typeof actions>


export function appReducer(state: AppState, action: AppActions): AppState {
    switch (action.type) {
        case 'loadFile':
            return {
                ...state,
                fileData: action.data
            };
        case 'loadTree':
            return {
                ...state,
                abt: action.data
            };
        case 'loadGrammar':
            return {
                ...state,
                grammar: action.data
            };
        case 'requestChunks':
            return {
                ...state,
                activeChunks: action.data
            }
        case 'hoverHighlight':
            return {
                ...state,
                hoveredNodes: action.data.ids
            }
        case 'toggleSemanticNode':
            const currentNodes = state.semanticViewer.hiddenNodes
            const index = currentNodes.indexOf(action.data.id);
            return {
                ...state,
                semanticViewer: {
                    ...SemanticViewer,
                    hiddenNodes: (index >= 0 ? [ ...currentNodes.slice(0, index), ...currentNodes.slice(index + 1)]: [ ...state.semanticViewer.hiddenNodes, action.data.id ])
                }
            }
        case 'selectNode':
            return {
                ...state,
                selectedNodes: action.data.ids
            };
        case 'replaceNode':
            return {
                ...state
            };
    }
}

export function dumbFindNodes(tree: AbtRoot, ids: number[]): AbtNode[] {
    function rec(node: AbtNode): AbtNode[] {
        const acc: AbtNode[] = [];
        if (ids.indexOf(node.id) >= 0) {
            acc.push(node);
        }
        return [...acc, ...(node.children || []).map(n => rec(n)).reduce((a, b) => [...a, ...b], [])];
    }
    return tree.children.map(n => rec(n)).reduce((a, b) => [...a, ...b], []);
}

export function findNodesByOrigin(tree: AbtRoot, origin: string, id: (elem: AnyElement) => string): AbtNode[] {
    function rec(node: AbtNode): AbtNode[] {
        const acc: AbtNode[] = [];
        if (id(node.origin) === origin) {
            acc.push(node);
        }
        return [...acc, ...(node.children || []).map(n => rec(n)).reduce((a, b) => [...a, ...b], [])];
    }
    return tree.children.map(n => rec(n)).reduce((a, b) => [...a, ...b], []);
}