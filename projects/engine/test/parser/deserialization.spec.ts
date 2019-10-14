import { pipe } from 'fp-ts/lib/pipeable';
import { Parser } from '../../src/parser/model';
import { fold } from 'fp-ts/lib/Either';
import { reporter } from 'io-ts-reporters';
import { typedExpect } from '../test-utils';

declare function require(path: string): { [k: string]: unknown };

describe('deserialization', () => {
    it('deserializes basic fields', () => {
        const rawJSON = require('../fixtures/simple-fields.json');
        const result = Parser.decode(rawJSON);
        pipe(
            result,
            fold(
                _ => { throw new Error(reporter(result).join('\n')); },
                a => typedExpect(a).toEqual({
                    type: "fileforge/simple-fields",
                    endian: "little",
                    wordlength: 32,
                    comments: "Simple fields",
                    content: [{
                        type: "const",
                        name: "Identification",
                        size: 16,
                        ref: "ID",
                        value: [
                            35615
                        ]
                    }, {
                        type: "fixed",
                        name: "compression method",
                        ref: "CM",
                        size: 8
                    }]
                }))
        );
    });
    it('deserializes nested fields', () => {
        const rawJSON = require('../fixtures/simple-fields-nested.json');
        const result = Parser.decode(rawJSON);
        pipe(
            result,
            fold(
                _ => { throw new Error(reporter(result).join('\n')); },
                a => typedExpect(a).toEqual({
                    type: "fileforge/simple-fields-nested",
                    endian: "little",
                    wordlength: 32,
                    comments: "Simple fields (nested)",
                    content: [{
                        type: "const",
                        name: "Identification",
                        size: 16,
                        ref: "ID",
                        value: [
                            35615
                        ],
                        content: [
                            {
                                type: "fixed",
                                name: "compression method",
                                ref: "CM",
                                size: 8
                            }
                        ]
                    }]
                }))
        );
    });
});
