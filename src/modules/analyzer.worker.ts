import { Parser } from "parser/Parser";

// Worker.ts
const ctx: Worker = self as any;

ctx.onmessage = function(event) {
    if (event.data.type === 'parse') {
        const { transactionId, data, definition } = event.data.payload;
        const parser = new Parser(definition, data);
        const tree = parser.parse();
        const codecs = parser.codecLibrary.getAllCodecNames();
        ctx.postMessage({
            type: 'result',
            payload: { 
                transactionId,
                result: {
                    tree,
                    codecs
                }
            }
        });
    }
}