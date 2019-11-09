import { derivedState } from "ui/react/state";
import { AbtNode, AbtRoot } from "abt/Abt";
import { HighlghtColorState } from "ui/hexview/highlight/abtToHighlights";

type StructureUIProps = {
    abt: AbtRoot | null;
    hoveredNodes: number[];
    selectedNodes: number[];
}

export const structureUIState = derivedState((
        { abt, hoveredNodes, selectedNodes }: StructureUIProps,
        prev?: StructureUIProps | null,
        last?: StructureUIStateTree | null) => {

    if (abt == null) {
        return null;
    }
    if (prev == null || last == null || prev.abt !== abt) {
        return buildStructureUIState(abt, hoveredNodes, selectedNodes);
    }

    return updateStructureUIState(last, hoveredNodes, selectedNodes);
});

export interface StructureUIStateTree {
    readonly node: AbtNode;
    readonly hovered: boolean;
    readonly selected: boolean;
    readonly color: string;
    readonly children: StructureUIStateTree[];
}

function renderChildren(children: AbtNode[], hoveredNodes: number[], selectedNodes: number[], colorMachine: HighlghtColorState): StructureUIStateTree[] {
    return children.map(c => ({
        node: c,
        color: colorMachine.nextColor(),
        hovered: hoveredNodes.indexOf(c.id) >= 0,
        selected: selectedNodes.indexOf(c.id) >= 0,
        children: c.children ? renderChildren(c.children, hoveredNodes, selectedNodes, colorMachine) : []
    }))
}

function buildStructureUIState(abt: AbtRoot, hoveredNodes: number[], selectedNodes: number[]): StructureUIStateTree {
    const colorMachine = new HighlghtColorState();
    return {
        node: abt,
        color: colorMachine.nextColor(),
        hovered: hoveredNodes.indexOf(abt.id) >= 0,
        selected: selectedNodes.indexOf(abt.id) >= 0,
        children: renderChildren(abt.children, hoveredNodes, selectedNodes, colorMachine)
    };
}

function updateStructureUIState(tree: StructureUIStateTree, hoveredNodes: number[], selectedNodes: number[]): StructureUIStateTree {
    function rec(node: StructureUIStateTree): StructureUIStateTree {

        const isHovered = hoveredNodes.indexOf(node.node.id) >= 0;
        const isSelected = selectedNodes.indexOf(node.node.id) >= 0;

        // Base case of recursion
        if (node.children.length === 0) {
            if (isHovered !== node.hovered || isSelected !== node.selected) {
                return {
                    ...node,
                    hovered: isHovered,
                    selected: isSelected
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
                hovered: isHovered,
                selected: isSelected
            };
        } else if (isHovered !== node.hovered || isSelected !== node.selected) {
            return {
                ...node,
                hovered: isHovered,
                selected: isSelected
            };
        } else {
            return node;
        }
    }

    return rec(tree);
}
