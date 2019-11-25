import { AnalyzerService } from 'services/analyzer-service';
import { AppActions } from 'ui/state/AppReducer';
import { AppState } from 'ui/state/AppState';
import { loadResult } from 'ui/state/AppActions';
import { importStructure } from 'ui/domain/structure/converters';

export class UiAnalyzerService {

    constructor(
            private readonly analyzerService: AnalyzerService,
            private readonly dispatch: React.Dispatch<AppActions>) {}

    public async analyzeFile(state: AppState): Promise<void> {
        if (state.fileData != null && state.grammar != null) {
            const result = await this.analyzerService.analyzeFile(state.fileData, state.grammar.asParserGrammar);
            const tree = importStructure(result.tree);
            this.dispatch(loadResult({
                codecs: result.codecs,
                tree: tree
            }));
        }
    }
}