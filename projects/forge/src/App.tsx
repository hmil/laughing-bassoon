import * as React from 'react';
import { HexView, CHUNK_SIZE, Chunk } from '@fileforge/hexview';
import { Toolbar } from './ui/Toolbar';
import { SemanticViewer } from './ui/SemanticViewer';

interface AppState {
    fileData: Uint8Array | null;
    activeChunks: number[]
}

export class App extends React.Component<{}, AppState> {

    state: AppState = {
        fileData: null,
        activeChunks: [0, 1, 2]
    };

    componentWillMount() {
        // Load some file
        var xhr = new XMLHttpRequest();
        xhr.open('get', 'assets/webpack-logo.png', true);
        xhr.responseType = 'arraybuffer'
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    this.setState({ fileData: new Uint8Array(xhr.response as ArrayBuffer) });
                }
            }
        }
        xhr.send();
    }

    render() {
        return (
            <div style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'stretch',
                backgroundColor: '#121212',
                color: '#ccc'
            }}>
                <Toolbar />
                    <div style={{
                        display: 'flex',
                        flexDirection: 'row',
                        flexGrow: 1,
                        height: '300px'
                    }}>
                        <SemanticViewer></SemanticViewer>
                        <HexView chunks={this.computeChunks()} onRequestChunks={activeChunks => this.setState({ activeChunks })} />
                    </div>
            </div>
        )
    }

    private computeChunks(): Chunk[] {
        const fileData = this.state.fileData;
        if (fileData == null) {
            return [];
        }
        return this.state.activeChunks.map<Chunk>((chunkNr) => ({
            chunkNr,
            data: fileData.slice(chunkNr * CHUNK_SIZE, (chunkNr + 1) * CHUNK_SIZE)
        }));
    }
}
