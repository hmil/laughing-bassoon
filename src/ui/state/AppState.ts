import { AbtRoot, AbtNode } from 'abt/Abt';
import { ParserDefinition, AnyElement } from 'parser/model';
import { Grammar } from 'ui/domain/grammar/Grammar';
import { FileStructure } from 'ui/domain/structure/Structure';

export interface AppState {
    fileData: Uint8Array | null;
    activeChunks: number[];
    abt: AbtRoot | null;
    hoveredNodes: number[];
    grammar: Grammar | null;
    // Path of the selected grammar tree node
    selectedGrammarNode: ReadonlyArray<number> | null;
    hoveredGrammarNode: ReadonlyArray<number> | null;
    selectedStructureNode: ReadonlyArray<number> | null;
    hoveredStructureNode: ReadonlyArray<number> | null;
    availableCodecs: string[];
    structure: FileStructure | null;
}

export interface AbtUiStateTree {
    nodeId: number;
    hovered: boolean;
    children: AbtUiStateTree[];
}

export const appInitialState: AppState = {
    fileData: null,
    activeChunks: [0, 1, 2],
    hoveredNodes: [],
    grammar: null,
    abt: null,
    availableCodecs: [],
    selectedGrammarNode: null,
    selectedStructureNode: null,
    hoveredGrammarNode: null,
    hoveredStructureNode: null,
    structure: null
};


// function getNodeChildren(node: AnyElement): AnyElement[] {
//     // TODO: Switch case
//     if ('content' in node) {
//         return node.content != null ? node.content : [];
//     }

//     switch (node.type) {
//         case 'repeat':
//             return [...node.do];
//     }

//     return [];
// }

// function makeSyntheticRoot(nodes: AnyElement[]): ContainerField {
//     return {
//         content: nodes,
//         name: 'root',
//         type: 'container'
//     };
// }

// function makeGrammarUiTree(abt: AbtRoot | null, grammar: ParserDefinition, hoveredNodes: number[]): GrammarUiStateTree {

//     const allSelected = abt != null ? dumbFindNodes(abt, hoveredNodes).map(n => n.origin) : [];

//     function rec(node: AnyElement): GrammarUiStateTree {
//         return {
//             node,
//             hovered: allSelected.indexOf(node) >= 0,
//             children: getNodeChildren(node).map((c => rec(c)))
//         };
//     }

//     return {
//         hovered: false,
//         node: makeSyntheticRoot(grammar.content),
//         children: grammar.content.map(c => rec(c))
//     }
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