import { ParserDefinition, ConstField, ContainerField, FixedField, IfField } from './model';
import { AbtRoot, AbtNode } from '../abt/Abt';
import { AnyElement } from './model/AnyElement';
import { Decoder } from './Decoder';
import { Offset } from './Offset';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { Codec } from './model/core/Codec';

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
}

export class Parser2 {

    private readonly decoder = new Decoder();

    private openList: ParsingHead[] = [];
    private closedList: Map<string, Array<(variable: number | null) => void>> = new Map();
    private variables: Map<string, number> = new Map();
    private codecs: Map<string, Codec> = new Map();

    constructor(
            private readonly definition: ParserDefinition,
            private readonly data: Uint8Array
    ) {

    }

    private processConst(elem: ConstField, head: ParsingHead): ParsingHead[] {
        head.output.push({
            type: 'generic',
            id: uniqId(),
            start: head.offset.offset,
            end: head.offset.add(0, elem.size).offset,
            name: elem.name
        });
        return [{
            ...head,
            offset: head.offset.add(0, elem.size),
            elements: head.elements.slice(1)
        }];
    }

    private processFixed(elem: FixedField, head: ParsingHead): ParsingHead[] {
        if ('bitSize' in elem) { // TODO: handle bit size
            throw new Error('Bit sizing not yet supported');
        }
        this.resolveExpression(elem.size, size => {
            let name = elem.name;
            if (size == null) {
                head.output.push({
                    type: 'generic',
                    id: uniqId(),
                    start: head.offset.offset,
                    end: head.offset.offset,
                    name: name + ` [ERROR: undefined variable ${elem.size}]`
                });
                return;
            }

            const nextOffset = head.offset.add(size, 0);

            const codec = this.findCodec(elem.value);

            pipe(
                this.decoder.decode(this.data.slice(head.offset.offset, nextOffset.offset), codec),
                fold(
                    err => { name += ` [${err}]` },
                    value => {
                        if (elem.ref != null) {
                            name += ` (${elem.ref})`;
                            this.provideVariable(elem.ref, value);
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
            this.openList.push({
                ...head,
                offset: nextOffset,
                elements: head.elements.slice(1)
            });

            if (elem.content != null) {
                this.openList.push({
                    ...head,
                    output: children,
                    finalize: undefined,
                    limit: nextOffset,
                    elements: elem.content
                })
            }
        });
        return [];
    }

    private processContainer(elem: ContainerField, head: ParsingHead): ParsingHead[] {
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

                parent.end = head.offset.add(size).offset;
                this.openList.push({
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
                this.openList.push({
                    ...head,
                    elements: head.elements.slice(1),
                    offset: new Offset(end, 0)
                });
            });
        }

        const finalizeChildren = (childHead: ParsingHead) => {
            this.provideVariable(endVariable, childHead.offset.offset);
        }
        return [{
            offset: head.offset,
            endian: head.endian,
            wordlength: head.wordlength,
            limit: null,
            output: children,
            elements: elem.content || [],
            finalize: finalizeChildren
        }];

    }

    private processIf(elem: IfField, head: ParsingHead): ParsingHead[] {
        return [{
            ...head,
            elements: [
                ...(elem.then || []),
                ...head.elements.slice(1),
            ]
        }];
    }

    private processElem(elem: AnyElement, head: ParsingHead): ParsingHead[] {
        switch (elem.type) {
            case 'const':
                return this.processConst(elem, head);
            case 'fixed':
                return this.processFixed(elem, head);
            case 'container':
                return this.processContainer(elem, head);
            case 'if':
                return this.processIf(elem, head);
            default:
                return [{
                    ...head,
                    elements: head.elements.slice(1)
                }];
        }
    }

    private processHead(head: ParsingHead): void {
        if (head.elements.length === 0) {
            if (head.finalize) {
                head.finalize(head);
            }
            return;
        }
        const elem = head.elements[0];
        const newHeads = this.processElem(elem, head);
        this.openList = this.openList.concat(newHeads);
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
            this.requestVariable(v, cb);
        }
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
        if (this.variables.has(variableName)) {
            throw new Error(`Redefinition of variable ${variableName}`);
        }
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

        this.openList.push({
            endian: this.convertEndian(this.definition.endian),
            wordlength: this.definition.wordlength,
            offset: new Offset(0, 0),
            limit: new Offset(this.data.length, 0),
            elements: this.definition.content,
            output: root.children
        });

        this.loadCodecs();

        this._parse();

        return root;
    }

    private findCodec(key: string | Codec | undefined): Codec | undefined {
        if (key === undefined) {
            return undefined;
        }
        if (typeof key === 'string') {
            return this.codecs.get(key);
        }
        return key;
    }

    private loadCodecs() {
        if (this.definition.codecs != null) {
            this.definition.codecs.forEach(c => {
                this.codecs.set(c.name, c);
            });
        }
    }

    private convertEndian(endianStr: 'little' | 'big') {
        return endianStr === 'little' ? Endian.Little : Endian.Big;
    }
}