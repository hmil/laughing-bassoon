import * as React from 'react';
import { HexView, Chunk, CHUNK_SIZE } from './ui/hexview';
import { Toolbar } from './ui/Toolbar';
import { SemanticViewer } from './ui/SemanticViewer';
import { AppContext } from './state/AppContext';
import { appInitialState, appReducer } from './state/AppState';
import { loadFile, requestChunks, loadParseTree, loadGrammar, hoverHighlight } from './state/AppActions';
import { loadSchema } from './library/loader';
import { ParserDefinition } from './parser/model';
import { Parser2 } from './parser/Parser2';
import { Dock } from './ui/layout/Dock';
import { GrammarViewer } from './ui/GrammarViewer';


export function App() {

    const [ state, dispatch ] = React.useReducer(appReducer, appInitialState);

    React.useEffect(() => {
        let data: Uint8Array | null = null;
        let schema: ParserDefinition | null = null;

        // Load some file
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'assets/archive.tar', true);
        xhr.responseType = 'arraybuffer'
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    data = new Uint8Array(xhr.response);
                    dispatch(loadFile(data));
                    parseFile();
                }
            }
        }
        xhr.send();

        // Load a parser
        loadSchema('assets/tar.yml')
            .then(s => {
                schema = s;
                dispatch(loadGrammar(s));
                parseFile();
            })
            .catch(e => console.error(e));

        function parseFile() {
            if (data == null || schema == null) {
                return;
            }
            const parser = new Parser2(schema, data);
            const tree = parser.parse();
            dispatch(loadParseTree(tree));
        }
    },
    // This tells react to run the effect only once:
    []);

    return (
        <AppContext.Provider value={{ state, dispatch }}>
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                backgroundColor: '#121212',
                color: '#ccc',
                fontFamily: 'sans-serif',
                justifyContent: 'space-between'
            }}>
                <Toolbar />
                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexGrow: 1,
                    height: '300px',
                    backgroundColor: '#1d1d1d',
                }}>
                    <Dock side="left">
                        <SemanticViewer></SemanticViewer>
                    </Dock>
                    <div style={{
                        flexGrow: 1,
                        flexShrink: 1,
                        width: '100px',
                        overflow: 'hidden'
                    }}>
                        { state.abt != null
                            ? <HexView nChunks={state.fileData != null ? state.fileData.length / CHUNK_SIZE : 0} chunks={computeChunks()} abt={state.abt} onRequestChunks={activeChunks => dispatch(requestChunks(activeChunks))} />
                            : 'loading...'
                        }
                    </div>
                    <Dock side="right">
                        <GrammarViewer></GrammarViewer>
                    </Dock>
                </div>
            </div>
        </AppContext.Provider>
    );

    function computeChunks(): Chunk[] {
        const fileData = state.fileData;
        if (fileData == null) {
            return [];
        }
        return state.activeChunks.map<Chunk>((chunkNr) => ({
            chunkNr,
            data: fileData.slice(chunkNr * CHUNK_SIZE, (chunkNr + 1) * CHUNK_SIZE)
        }));
    }
}