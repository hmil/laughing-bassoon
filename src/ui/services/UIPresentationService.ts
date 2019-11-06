import * as React from 'react';
import { AppActions, AppState } from 'state/AppState';
import { AbtNode, AbtRoot } from 'abt/Abt';
import { AnyElement } from 'parser/model';
import { selectNode, hoverAbtNode, setAbtUITree } from 'state/AppActions';
import { memo } from 'ui/react/hooks';
import { HighlghtColorState } from 'ui/hexview/highlight/abtToHighlights';


/**
 * Marshalls the app state to map it to the UI structure.
 */
export interface UIPresentationService {
    selectAbtNode(node: AbtNode): void;
    selectGrammarNode(node: AnyElement): void;
    hoverNodes(nodes: number[]): void;

    /** A tree that maps to the grammar 1:1 and contains selection and hover state */
    useGrammarTree(): GrammarUITree | null;
}

/**
 * Manages hover and selection state
 */
export class UIPresentationServiceImpl implements UIPresentationService {

    constructor(
            private readonly dispatch: React.Dispatch<AppActions>,
            private readonly state: React.MutableRefObject<AppState>) {
    }

    selectAbtNode(node: AbtNode): void {
        this.dispatch(selectNode({ ids: [node.id] }));
    }

    selectGrammarNode(_node: AnyElement): void {
        throw new Error("Method not implemented.");
    }

    hoverNodes(ids: number[]) {
        const state = this.state.current;
        const tree = state.abtUiState;
        if (tree != null) {
            this.dispatch(setAbtUITree(updateHoverTree(tree, state.hoveredNodes, ids)));
            this.dispatch(hoverAbtNode({ids}));
        }
    }

    useGrammarTree(): GrammarUITree | null {
        return null;
    }

    static buildAbtUiTree(abt: AbtRoot, state: AppState): AbtUITree {
        const colorMachine = new HighlghtColorState();
        return {
            node: abt,
            color: colorMachine.newColor(),
            hovered: state.hoveredNodes.indexOf(abt.id) >= 0,
            children: renderChildren(abt.children, state.hoveredNodes, colorMachine)
        };
    }
}

function renderChildren(children: AbtNode[], hoveredNodes: number[], colorMachine: HighlghtColorState): AbtUITree[] {
    return children.map(c => ({
        node: c,
        color: colorMachine.newColor(),
        hovered: hoveredNodes.indexOf(c.id) >= 0,
        children: c.children ? renderChildren(c.children, hoveredNodes, colorMachine) : []
    }))
}

function updateHoverTree(tree: AbtUITree, prevHovered: number[], newHovered: number[]): AbtUITree {
    // Remove duplicates
    const union = newHovered.concat(prevHovered);

    function rec(node: AbtUITree): AbtUITree {

        const isHovered = newHovered.indexOf(node.node.id) >= 0 ? true : false;
        // Base case of recursion
        if (node.children.length === 0) {
            if (union.indexOf(node.node.id) >= 0) {
                return {
                    node: node.node,
                    color: node.color,
                    hovered: isHovered,
                    children: node.children
                };
            } else {
                return node;
            }
        }

        const children = node.children.reduce((prev, curr, i) => {
            const trsf = rec(curr);
            if (trsf !== curr) {
                // Child has changed
                return [...prev.slice(0, i), trsf, ...prev.slice(i + 1)];
            } else {
                return prev;
            }
        }, node.children);

        if (children !== node.children) {
            // children have changed
            return {
                ...node,
                children,
                hovered: isHovered
            };
        } else if (isHovered != node.hovered) {
            return {
                ...node,
                hovered: isHovered
            };
        } else {
            return node;
        }
    }

    return rec(tree);
}

export interface AbtUITree {
    readonly node: AbtNode;
    readonly hovered: boolean;
    readonly color: string;
    readonly children: AbtUITree[];
}

export interface GrammarUITree {
    readonly node: AnyElement;
}

export const UIPresentationServiceInjector = React.createContext({} as UIPresentationService);

export const useUIPresentationService = memo((dispatch: React.Dispatch<AppActions>, stateRef: React.MutableRefObject<AppState>) =>
        () => new UIPresentationServiceImpl(dispatch, stateRef));
