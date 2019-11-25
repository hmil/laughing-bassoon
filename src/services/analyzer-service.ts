import { uniqId } from 'parser/uid';
import { ParserGrammar } from 'parser/domain/Grammar';
import { AbtRoot } from 'parser/domain/Abt';

interface ParsingResult {
    tree: AbtRoot;
    codecs: string[];
}

export class AnalyzerService {

    private pendingTransactions: Map<number, (result: ParsingResult) => void> = new Map();

    constructor(private readonly worker: Worker) {
        worker.onmessage = (event) => {
            switch (event.data.type) {
                case 'result':
                    const transactionId = event.data.payload.transactionId;
                    const transaction = this.pendingTransactions.get(transactionId);
                    if (transaction == null) {
                        throw new Error(`No transaction found with id ${transactionId}`)
                    }
                    this.pendingTransactions.delete(transactionId);
                    transaction(event.data.payload.result);
                    break;
                default:
                    console.error(`Unknown event ${event.type}`);
            }
        };
    }

    public analyzeFile(data: Uint8Array, definition: ParserGrammar): Promise<ParsingResult> {
        // TODO: Type-safeify this link
        const transactionId = uniqId();
        this.worker.postMessage({
            type: 'parse',
            payload: {
                transactionId, data, definition
            }
        });

        return new Promise(resolve => this.pendingTransactions.set(transactionId, resolve));
    }
}