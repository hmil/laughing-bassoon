import { AbtRoot } from 'abt/Abt';
import { Grammar, GrammarTree } from 'ui/domain/grammar/Grammar';
import { FileStructure, FileStructureNode } from 'ui/domain/structure/Structure';
import { TreeViewState } from 'ui/widgets/tree-view/TreeViewState';

export interface AppState {
    fileData: Uint8Array | null;
    activeChunks: number[];
    abt: AbtRoot | null;
    hoveredNodes: number[];
    grammar: Grammar | null;
    availableCodecs: string[];
    structure: FileStructure | null;

    grammarTree: TreeViewState<GrammarTree>;
    structureTree: TreeViewState<FileStructureNode>;
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
    structure: null,
    grammarTree: TreeViewState.createEmpty(),
    structureTree: TreeViewState.createEmpty()
};
