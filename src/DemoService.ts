import { Parser } from 'parser/Parser';
import { loadFile, loadParseTree } from 'state/AppActions';
import { AppActions, AppState } from 'state/AppState';


export function loadDemo(dispatch: React.Dispatch<AppActions>, state: AppState) {
    let data: Uint8Array | null = null;

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

    function parseFile() {
        if (data == null || state.grammar == null) {
            return;
        }
        const parser = new Parser(state.grammar, data);
        const tree = parser.parse();
        dispatch(loadParseTree(tree));
    }
}