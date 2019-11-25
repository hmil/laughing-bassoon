import { loadSchema } from 'library/loader';
import * as React from 'react';
import { loadFile, loadGrammar, requestChunks, analyzeFile } from 'ui/state/AppActions';
import { AppContext } from 'ui/state/AppContext';
import { appReducer, AppActions } from 'ui/state/AppReducer';
import { appInitialState } from 'ui/state/AppState';

import { GrammarViewer } from 'ui/GrammarViewer';
import { Chunk, CHUNK_SIZE, compareChunks, HexView } from 'ui/hexview';
import { StructureViewer } from 'ui/StructureViewer';
import { COLOR_TEXT_MAIN } from 'ui/styles/colors';
import { Toolbar } from 'ui/Toolbar';
import { Dock } from 'ui/widgets/Dock';
import { Grammar } from 'ui/domain/grammar/Grammar';
// App.js
import Worker from 'modules/analyzer.worker';
import { AnalyzerService } from 'services/analyzer-service';
import { ServicesContext } from 'ui/ServicesContext';
import { memo } from 'ui/react/hooks';
import { UiAnalyzerService } from 'ui/services/ui-analyzer-service';
import { If } from 'ui/react/tsx-helpers';
import { ParserGrammar } from 'parser/domain/Grammar';

const analyzerDriver = new AnalyzerService(new Worker());

export function App() {

    const [ state, dispatch ] = React.useReducer(appReducer, appInitialState);
    const stateRef = React.useRef(state);
    stateRef.current = state;

    const analyzer = getAnalyzerService(analyzerDriver, dispatch);

    React.useEffect(() => {
        let data: Uint8Array | null = null;
        let schema: ParserGrammar | null = null;

        const fileName = 'assets/archive2.tar';

        // Load some file
        var xhr = new XMLHttpRequest();
        xhr.open('get', fileName, true);
        xhr.responseType = 'arraybuffer'
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    data = new Uint8Array(xhr.response);
                    dispatch(loadFile({fileData: data, fileName: fileName}));
                    return parseFile();
                }
            }
        }
        xhr.send();

        // Load a parser
        loadSchema('assets/tar.yml')
            .then(s => {
                schema = s;
                dispatch(loadGrammar(Grammar.importFromParser(s)));
                return parseFile();
            })
            .catch(e => console.error(e));

        async function parseFile() {
            if (data == null || schema == null) {
                return;
            }
            dispatch(analyzeFile(analyzer));
        }
    },
    // This tells react to run the effect only once:
    []);

    const chunks = React.useMemo(() => {
        const fileData = state.fileData;
        if (fileData == null) {
            return [];
        }
        return state.activeChunks.map<Chunk>((chunkNr) => ({
            chunkNr,
            data: fileData.slice(chunkNr * CHUNK_SIZE, (chunkNr + 1) * CHUNK_SIZE)
        })).sort(compareChunks);
    }, [state.activeChunks, state.fileData]);

    const onRequestChunks = React.useCallback(activeChunks => dispatch(requestChunks(activeChunks)), [dispatch]);

    return (
        <ServicesContext.Provider value={appServices(analyzer)}>
            <AppContext.Provider value={{ state, dispatch }}>
                <div style={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'stretch',
                    backgroundColor: '#121212',
                    color: COLOR_TEXT_MAIN,
                    fontFamily: 'sans-serif',
                    justifyContent: 'space-between'
                }}>
                    <Toolbar title={`${state.fileName} — FileForge`}/>
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexGrow: 1,
                        height: '300px',
                        backgroundColor: '#1d1d1d',
                    }}>
                        <Dock side="left" title="Structure">
                            <StructureViewer></StructureViewer>
                        </Dock>
                        <div style={{
                            flexGrow: 1,
                            flexShrink: 1,
                            width: '100px',
                            overflow: 'hidden'
                        }}>
                            <If cond={state.isAnalysisInProgress}>
                                <div style={{
                                    backgroundColor: 'red',
                                    height: '2px',
                                    marginBottom: '-2px'
                                }}></div>
                            </If>
                            <HexView 
                                nChunks={state.fileData != null ? state.fileData.length / CHUNK_SIZE : 0}
                                chunks={chunks}
                                abt={state.structure}
                                hoveredNodes={state.structureTree.hoveredNodes}
                                selectedNodes={state.structureTree.selectedNodes}
                                onRequestChunks={onRequestChunks} />
                        </div>
                        <Dock side="right" title="Grammar">
                            <GrammarViewer></GrammarViewer>
                        </Dock>
                    </div>
                </div>
            </AppContext.Provider>
        </ServicesContext.Provider>
    );
}

const appServices = memo((analyzer: UiAnalyzerService) => ({
    analyzer
}));

const getAnalyzerService = memo((analyzer: AnalyzerService, dispatch: React.Dispatch<AppActions>) =>
        new UiAnalyzerService(analyzer, dispatch))