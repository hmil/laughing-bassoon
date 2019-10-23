export interface SemanticViewerState {
    expandedNodes: number[];
}

export const semanticViewerDefaultState: Readonly<SemanticViewerState> = {
    expandedNodes: []
}
