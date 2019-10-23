import * as actions from './AppActions';
import { AbtRoot, AbtNode } from '../abt/Abt';
import { SemanticViewerState, semanticViewerDefaultState } from './SemanticViewerState';
import { SemanticViewer } from '../ui/SemanticViewer';

export interface AppState {
    fileData: Uint8Array | null;
    activeChunks: number[];
    abt: AbtRoot | null;
    hoveredNode: number | null;
    selectedNode: number | null;
    semanticViewer: SemanticViewerState;
}

export const appInitialState: AppState = {
    fileData: null,
    activeChunks: [0, 1, 2],
    hoveredNode: null,
    selectedNode: null,
    semanticViewer: semanticViewerDefaultState,
    abt: null
};


type UnionOfValues<T extends { [k: string]: any}, K extends keyof T> = K extends keyof T ? ReturnType<T[K]> : never;
export type HexViewAction = UnionOfValues<typeof actions, keyof typeof actions>


export function appReducer(state: AppState, action: HexViewAction): AppState {
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
        case 'requestChunks':
            return {
                ...state,
                activeChunks: action.data
            }
        case 'hoverHighlight':
            return {
                ...state,
                hoveredNode: action.data.id
            }
        case 'toggleSemanticNode':
            const currentNodes = state.semanticViewer.expandedNodes
            const index = currentNodes.indexOf(action.data.id);
            return {
                ...state,
                semanticViewer: {
                    ...SemanticViewer,
                    expandedNodes: (index >= 0 ? [ ...currentNodes.slice(0, index), ...currentNodes.slice(index + 1)]: [ ...state.semanticViewer.expandedNodes, action.data.id ])
                }
            }
            case 'selectNode':
                // TODO: If node is not visible in tree, then expand tree to reveal node
                if (state.abt != null && action.data.id != null) {
                    console.log(dumbFindNode(state.abt, action.data.id));
                }
                return {
                    ...state,
                    selectedNode: action.data.id
                };
        }
}

function dumbFindNode(tree: AbtRoot, id: number) {
    if (tree.id == id) {
        return tree;
    }
    function rec(node: AbtNode): AbtNode | null {
        if (node.id === id) {
            return node;
        }
        return (node.children || []).map(n => rec(n)).find(n => n != null) || null;
    }
    return (tree.children).map(n => rec(n)).find(n => n != null) || null;
}
