import { ParserDefinition, ContainerField, FixedField, IfField, Repeat } from './model';
import { AbtRoot, AbtNode } from '../abt/Abt';
import { AnyElement } from './model/AnyElement';
import { Offset } from './Offset';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { Expression } from './Expression';
import { CodecLibrary } from './codec/CodecLibrary';
import { createCodecLibrary } from './codec';

enum Endian { Little, Big };

const uniqId = (() => {
    let counter = 0;
    return () => counter++;
})();


interface ParsingHead {
    endian: Endian;
    wordlength: number;
    offset: Offset;
    limit: Offset | null;
    elements: AnyElement[];
    output: AbtNode[];
    finalize?: (head: ParsingHead) => void;
    error?: (head: ParsingHead) => void;
}

export class Parser {

    private openList: ParsingHead[] = [];
    private closedList: Map<string, Array<(variable: number | null) => void>> = new Map();
    private variables: Map<string, number> = new Map();

    private readonly codecLibrary: CodecLibrary;

    constructor(
            private readonly definition: ParserDefinition,
            private readonly data: Uint8Array
    ) {
        this.codecLibrary = createCodecLibrary(definition.codecs);
    }

    private processFixed(elem: FixedField, head: ParsingHead): void {
        if ('bitSize' in elem) { // TODO: handle bit size
            throw new Error('Bit sizing not yet supported');
        }
        // if (elem.constraints != null) {
        //     head.error && head.error(head);
        //     return;
        // }
        this.resolveExpression(elem.size, size => {
            let name = elem.name;
            if (size == null) {
                head.output.push({
                    type: 'generic',
                    id: uniqId(),
                    start: head.offset.offset,
                    end: head.offset.offset,
                    name: name + ` [ERROR: failed to resolve ${elem.size}]`
                });
                return;
            }

            const nextOffset = head.offset.add(new Offset(size, 0));
            const codec = this.codecLibrary.resolve(elem.value);

            pipe(
                codec!.decode(this.data.slice(head.offset.offset, nextOffset.offset)),
                fold(
                    err => {
                        name += ` [${err}]`;
                        if (head.error) {
                            head.error(head);
                        }
                    },
                    value => {
                        if (elem.ref != null) {
                            name += ` (${elem.ref})`;
                            this.provideVariable(elem.ref, value as number);
                        }
                        name += ` = ${value}`;
                    }
                )
            );

            const children: AbtNode[] = [];
            head.output.push({
                type: 'generic',
                id: uniqId(),
                start: head.offset.offset,
                end: nextOffset.offset,
                name: name,
                children
            });
            this.addParsingHead({
                ...head,
                offset: nextOffset,
                elements: head.elements.slice(1)
            });

            if (elem.content != null) {
                this.addParsingHead({
                    ...head,
                    output: children,
                    finalize: undefined,
                    limit: nextOffset,
                    elements: elem.content
                })
            }
        });
    }

    private processContainer(elem: ContainerField, head: ParsingHead): void {
        const children: AbtNode[] = [];
        const parent: AbtNode = {
            type: 'generic',
            id: uniqId(),
            start: head.offset.offset,
            end: head.offset.offset,
            name: elem.name,
            children: children
        };
        head.output.push(parent);
        const endVariable = `system.container@${parent.id}.end`;

        if (elem.size) {
            this.resolveExpression(elem.size, size => {
                if (size == null) {
                    parent.name += ' [Error could not determine container size]';
                    return;
                }

                parent.end = head.offset.add(new Offset(size, 0)).offset;
                this.addParsingHead({
                    ...head,
                    elements: head.elements.slice(1),
                    offset: new Offset(parent.end, 0)
                });
            });
        } else {
            this.requestVariable(endVariable, end => {
                if (end == null) {
                    parent.name += ' [Error could not determine container end]';
                    return;
                }
                parent.end = end;
                this.addParsingHead({
                    ...head,
                    elements: head.elements.slice(1),
                    offset: new Offset(end, 0)
                });
            });
        }

        const finalizeChildren = (childHead: ParsingHead) => {
            this.provideVariable(endVariable, childHead.offset.offset);
        }
        this.addParsingHead({
            offset: head.offset,
            endian: head.endian,
            wordlength: head.wordlength,
            limit: null,
            output: children,
            elements: elem.content || [],
            finalize: finalizeChildren,
            error: head.error
        });
    }

    private processIf(elem: IfField, head: ParsingHead): void {
        this.addParsingHead({
            ...head,
            elements: [
                ...(elem.then || []),
                ...head.elements.slice(1),
            ]
        });
    }

    private processRepeat(elem: Repeat, head: ParsingHead): void {
        const dummyOutput: AbtNode[] = [];
        let hasError = false;

        // TODO: Isolate this head so that it doesn't pollute the context...
        this.addParsingHead({
            endian: head.endian,
            wordlength: head.wordlength,
            limit: head.limit,
            offset: head.offset,
            output: dummyOutput,
            elements: elem.until || [],
            finalize: (nextHead) => {
                if (!hasError) {
                    this.addParsingHead({
                        ...head,
                        offset: nextHead.offset,
                        elements: head.elements.slice(1)
                    });
                }
            },
            error: () => {
                if (hasError) {
                    return;
                }
                hasError = true;
                this.addParsingHead({
                    endian: head.endian,
                    wordlength: head.wordlength,
                    output: head.output,
                    limit: head.limit,
                    elements: elem.do,
                    offset: head.offset,
                    finalize: nextHead => {
                        console.error(`Next start is: ${nextHead.offset.offset}`);
                        this.addParsingHead({
                            endian: head.endian,
                            wordlength: head.wordlength,
                            output: head.output,
                            limit: head.limit,
                            finalize: undefined,
                            offset: nextHead.offset,
                            elements: [elem]
                        });
                    }
                });
            }
        });
    }

    private processElem(elem: AnyElement, head: ParsingHead): void {
        switch (elem.type) {
            case 'fixed':
                return this.processFixed(elem, head);
            case 'container':
                return this.processContainer(elem, head);
            case 'if':
                return this.processIf(elem, head);
            case 'repeat':
                return this.processRepeat(elem, head);
            default:
                this.addParsingHead({
                    ...head,
                    elements: head.elements.slice(1)
                });
        }
    }

    private addParsingHead(head: ParsingHead) {
        this.openList.push(head);
    }

    private processHead(head: ParsingHead): void {
        if (head.elements.length === 0) {
            if (head.finalize) {
                head.finalize(head);
            }
            return;
        }
        const elem = head.elements[0];
        this.processElem(elem, head);
    }

    private _parse(): void {
        while (this.openList.length > 0) {
            const next = this.openList.splice(0, 1)[0];
            this.processHead(next);
        }
        this.finalize();
    }

    private finalize() {
        for (let value of this.closedList.values()) {
            value.forEach(v => v(null));
        }
    }

    private resolveExpression(v: string | number, cb: (variable: number | null) => void): void {
        if (typeof v === 'number') {
            cb(v);
        } else {
            const expression = new Expression(v);
            this.requestVariables(expression.variables, vars => {
                if (vars == null) {
                    cb(null);
                } else {
                    cb(expression.compute(vars));
                }
            });
        }
    }

    private requestVariables(variables: string[], cb: (vars: Map<string, number> | null) => void): void {
        const rec = () => {
            if (variables.length === 0) {
                cb(this.variables);
                return;
            }
            const current = variables.splice(0, 1)[0];
            this.requestVariable(current, v => {
                if (v == null) {
                    cb(null);
                } else {
                    rec();
                }
            });
        }

        rec();
    }

    private requestVariable(variableName: string, cb: (variable: number | null) => void): void {
        const value = this.variables.get(variableName);
        if (value) {
            cb(value);
        } else {
            const list = this.closedList.get(variableName) || [];
            list.push(cb);
            this.closedList.set(variableName, list);
        }
    }

    private provideVariable(variableName: string, value: number): void {
        // if (this.variables.has(variableName)) {
        //     throw new Error(`Redefinition of variable ${variableName}`);
        // }
        this.variables.set(variableName, value);
        const list = this.closedList.get(variableName) || [];
        this.closedList.delete(variableName);
        list.forEach(l => l(value));
    }

    public parse(): AbtRoot {
        const root: AbtRoot = {
            type: 'root',
            start: 0,
            end: this.data.length,
            id: uniqId(),
            children: [ ]
        };

        this.addParsingHead({
            endian: this.convertEndian(this.definition.endian),
            wordlength: this.definition.wordlength,
            offset: new Offset(0, 0),
            limit: new Offset(this.data.length, 0),
            elements: this.definition.content,
            output: root.children
        });

        this._parse();

        return root;
    }

    private convertEndian(endianStr: 'little' | 'big') {
        return endianStr === 'little' ? Endian.Little : Endian.Big;
    }
}