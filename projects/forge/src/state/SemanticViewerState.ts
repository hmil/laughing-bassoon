export interface SemanticViewerState {
    hiddenNodes: number[];
}

export const semanticViewerDefaultState: Readonly<SemanticViewerState> = {
    hiddenNodes: []
}
