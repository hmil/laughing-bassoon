import * as actions from './AppActions';
import { AbtRoot, AbtNode } from '../abt/Abt';
import { ParserDefinition, AnyElement, ContainerField } from '../parser/model';
import { AbtUITree, UIPresentationServiceImpl } from 'ui/services/UIPresentationService';

export interface AppState {
    fileData: Uint8Array | null;
    activeChunks: number[];
    abt: AbtRoot | null;
    /**
     * Shadow tree for the abt containing UI-specific state (hover, selection)
     */
    abtUiState: AbtUITree | null;
    hoveredNodes: number[];
    selectedNodes: number[];
    grammar: ParserDefinition | null;
    grammarUiState: GrammarUiStateTree | null;
    availableCodecs: string[];
}

export interface AbtUiStateTree {
    nodeId: number;
    hovered: boolean;
    children: AbtUiStateTree[];
}

export interface GrammarUiStateTree {
    node: AnyElement;
    hovered: boolean;
    children: GrammarUiStateTree[]
}

export const appInitialState: AppState = {
    fileData: null,
    activeChunks: [0, 1, 2],
    hoveredNodes: [],
    selectedNodes: [],
    grammar: null,
    grammarUiState: null,
    abt: null,
    abtUiState: null,
    availableCodecs: []
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
        case 'loadTree': {
            const ret = {
                ...state,
                abt: action.data,
                abtUiState: UIPresentationServiceImpl.buildAbtUiTree(action.data, state),
            };
            if (state.grammar != null) {
                ret.grammarUiState = makeGrammarUiTree(state.abt, state.grammar, state.hoveredNodes)
            }
            return ret;
        }
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
        case 'hoverAbtNode':
            return {
                ...state,
                hoveredNodes: action.data.ids,
            };
        case 'setAbtUITree':
            return {
                ...state,
                abtUiState: action.data
            };
        case 'hoverGrammarNode':
            return state;
        case 'selectNode':
            return {
                ...state,
                selectedNodes: action.data.ids
            };
        case 'replaceNode':
            return {
                ...state
            };
        case 'setAvailableCodecs':
            return {
                ...state,
                availableCodecs: action.data
            };
    }
}

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

function makeSyntheticRoot(nodes: AnyElement[]): ContainerField {
    return {
        content: nodes,
        name: 'root',
        type: 'container'
    };
}

function makeGrammarUiTree(abt: AbtRoot | null, grammar: ParserDefinition, hoveredNodes: number[]): GrammarUiStateTree {

    const allSelected = abt != null ? dumbFindNodes(abt, hoveredNodes).map(n => n.origin) : [];

    function rec(node: AnyElement): GrammarUiStateTree {
        return {
            node,
            hovered: allSelected.indexOf(node) >= 0,
            children: getNodeChildren(node).map((c => rec(c)))
        };
    }

    return {
        hovered: false,
        node: makeSyntheticRoot(grammar.content),
        children: grammar.content.map(c => rec(c))
    }
}

// function makeHoverTree(abt: AbtRoot | AbtNode, hoveredNodes: number[]): AbtUiStateTree {
//     return {
//         hovered: hoveredNodes.indexOf(abt.id) >= 0,
//         nodeId: abt.id,
//         children: abt.children ? abt.children.map(c => makeHoverTree(c, hoveredNodes)) : []
//     };
// }

// function updateHoverTree(tree: AbtUiStateTree, prevHovered: number[], newHovered: number[]) {
//     // Remove duplicates
//     const union = newHovered.concat(prevHovered);

//     function rec(node: AbtUiStateTree): AbtUiStateTree {
//         // Base case of recursion
//         if (node.children.length === 0) {
//             if (union.indexOf(node.nodeId) >= 0) {
//                 return {
//                     nodeId: node.nodeId,
//                     hovered: newHovered.indexOf(node.nodeId) >= 0 ? true : false,
//                     children: node.children
//                 };
//             } else {
//                 return node;
//             }
//         }

//         const children = node.children.reduce((prev, curr, i) => {
//             const trsf = rec(curr);
//             if (trsf !== curr) {
//                 // Child has changed
//                 return [...prev.slice(0, i), trsf, ...prev.slice(i + 1)];
//             } else {
//                 return prev;
//             }
//         }, node.children);

//         if (children !== node.children) {
//             // children have changed
//             return {
//                 ...node,
//                 children
//             };
//         } else {
//             return node;
//         }
//     }

//     return rec(tree);
// }

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

export function findNodesByOrigin(tree: AbtRoot, origin: string, id: (elem: AnyElement | ParserDefinition) => string): AbtNode[] {
    function rec(node: AbtNode): AbtNode[] {
        const acc: AbtNode[] = [];
        if (id(node.origin) === origin) {
            acc.push(node);
        }
        return [...acc, ...(node.children || []).map(n => rec(n)).reduce((a, b) => [...a, ...b], [])];
    }
    return tree.children.map(n => rec(n)).reduce((a, b) => [...a, ...b], []);
}