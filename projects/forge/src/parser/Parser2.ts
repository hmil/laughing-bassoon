import { ParserDefinition, ContainerField, FixedField, IfField, Repeat } from './model';
import { AnyElement } from "./model/AnyElement";
import { AbtRoot, AbtNode } from '../abt/Abt';
import { uniqId } from "./uid";
import { Offset } from "./Offset";
import { createCodecLibrary } from './codec';
import { CodecLibrary } from './codec/CodecLibrary';
import { Expression } from './Expression';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { AbstractDefinition } from './AbstractDefinition';

/// SCOPING WIP NOTES
//
// AnyElement doesn't have a `parent` property which is needed for scope resolution
// Browsing the children of AnyElement for scoping requires knowledge of that element's structure (ie. what are the children, does it create a new scope? can I traverse?)
// Need to augment the incoming tree with a scope tree in a pre-processing step.
// Either use type magic to augment the type directly...
// ...or use a mapping from Element to scope local to the parser.
// Second solution is less black magic and probably better.
// 


class Thread {

    private static tcounter = 0;

    private programCounter: number = 0;
    private isComplete: boolean = false;
    private errors: string[] = [];
    private isCancelled: boolean = false;

    private errorListeners: Array<(err: string) => void> = [];
    private finalizedListeners: Array<(err?: string[]) => void> = [];

    public readonly id: number = Thread.tcounter ++;

    constructor(
            private _offset: Offset,
            private _limit: Offset,
            public readonly instructions: AbstractDefinition[],
            public readonly definition: AbstractDefinition,
            public readonly produce: (node: AbtNode) => void) {
        this.log(`Spawn`);
    }

    public get offset() { return this._offset }
    public get limit() { return this._limit }

    fork(instructions: AbstractDefinition[], definition: AbstractDefinition, produce?: (node: AbtNode) => void): Thread {
        return new Thread(
            this._offset,
            this._limit,
            instructions,
            definition,
            produce ? produce : this.produce
        );
    }

    abort(): void {
        this.assertNotComplete();
        this.finalize();
        this.isCancelled = true;
    }

    step(): AbstractDefinition | undefined {
        if (this.isCancelled) {
            return undefined;
        }
        this.assertNotComplete();
        if (this.programCounter >= this.instructions.length) {
            this.finalize();
            return undefined;
        }
        if (this.limit.compareTo(this.offset) <= 0) {
            this.addError('EOF reached');
            this.finalize();
            return undefined;
        }
        const elem = this.instructions[this.programCounter];
        this.programCounter++;
        return elem;
    }

    stepBack(): void {
        this.assertNotComplete();
        if (this.programCounter < 1) {
            throw new Error(`Attempted to rewind a thread beyond its origin`);
        }
        this.programCounter--;
    }

    moveTo(offset: Offset) {
        this._offset = offset;
    }

    moveBy(offset: Offset) {
        this._offset = this._offset.add(offset)
    }

    onFinalized(listener: (err?: string[]) => void): void {
        this.finalizedListeners.push(listener);
    }

    onError(listener: (err: string) => void): void {
        this.errorListeners.push(listener);
    }

    log(msg: string) {
        console.log(`[${this.id}] ${msg}`);
    }

    private notifyError(err: string) {
        this.errorListeners.forEach(l => l(err));
    }

    private notifyFinalized() {
        const err = this.errors.length > 0 ? this.errors : undefined;
        this.finalizedListeners.forEach(l => l(err));
    }

    public addError(err: string) {
        // TODO: Make `abort` work recursively instead of this.
        if (this.isComplete) {
            return;
        }
        this.errors.push(err);
        this.notifyError(err);
    }

    private finalize() {
        this.isComplete = true;
        this.notifyFinalized();
    }

    private assertNotComplete() {
        if (this.isComplete) {
            throw new Error(`Attempting to run a complete thread (${this.id})`);
        }
    }
}

export class Parser2 {

    private readonly codecLibrary: CodecLibrary;
    private openList: Thread[] = [];

    constructor(
            private readonly definition: ParserDefinition,
            private readonly data: Uint8Array) {
        this.codecLibrary = createCodecLibrary(definition.codecs);
    }

    private resume(thread: Thread): void {
        thread.log(`Resume`);
        this.openList.push(thread);
    }

    private processFixed(elem: FixedField, def: AbstractDefinition, thread: Thread): void {
        thread.log(`Fixed: ${elem.name}`);
        if ('bitSize' in elem) { // TODO: handle bit size
            throw new Error('Bit sizing not yet supported');
        }

        let name = elem.name;

        this.resolveExpression(thread.scope, elem.size, size => {
            if (size == null) {
                thread.addError('Cannot resolve size');
                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: thread.offset.offset,
                    name: '[ERR] cannot resolve size'
                });
                return;
            }

            if (elem.constraints != null) {
                // TODO: implement actual constraints
                const slice = this.data.slice(thread.offset.offset, thread.offset.offset + size);
                for (let i = 0 ; i < slice.length ; i++) {
                    if (slice[i] !== 0) {
                        thread.addError(`Constraint failed: byte 0x${(thread.offset.offset + i).toString(16)} is not null.`);
                        name += ` [Error: constraint]`;
                        break;
                    }
                }
            }

            const nextOffset = thread.offset.add(new Offset(size, 0));
            const codec = this.codecLibrary.resolve(elem.value);

            pipe(
                codec.decode(this.data.slice(thread.offset.offset, nextOffset.offset)),
                fold(
                    err => {
                        name += ` [${err}]`;
                        thread.addError(err);
                    },
                    value => {
                        if (elem.ref != null) {
                            name += ` (${elem.ref})`;
                            if (typeof value === 'number') {
                                this.provideVariable(thread.scope, elem.ref, value);
                            }
                        }
                        name += ` = ${value}`;
                    }
                )
            );
    
            thread.produce({
                type: 'generic',
                id: uniqId(),
                start: thread.offset.offset,
                end: thread.offset.offset + size,
                name: name
            });
    
            thread.moveBy(new Offset(size, 0));
            this.resume(thread);
        });
    }

    private processContainer(elem: ContainerField, def: AbstractDefinition, thread: Thread): void {
        thread.log(`Container: ${elem.name}`);

        const id = uniqId();
        const endVariable = `system.container@${id}.end`;
        const children: AbtNode[] = [];

        if (elem.content != null) {
            const childThread = thread.fork(
                    elem.content,
                    def,
                    node => children.push(node));
            childThread.onError(err => thread.addError(err));
            childThread.onFinalized(() => {
                this.provideVariable(thread.scope, endVariable, childThread.offset.offset);
            });
            this.resume(childThread);
        } else {
            this.provideVariable(thread.scope, endVariable, 0);
        }

        if (elem.size != null) {
            this.resolveExpression(thread.scope, elem.size, size => {
                if (size == null) {
                    thread.addError('cannot resolve size');
                    thread.produce({
                        type: 'generic',
                        id: uniqId(),
                        start: thread.offset.offset,
                        end: thread.offset.offset,
                        name: '[ERR] cannot resolve size',
                        children
                    });
                    return;
                }

                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: thread.offset.offset + size,
                    name: elem.name,
                    children
                });

                thread.moveBy(new Offset(size, 0));
                this.resume(thread);
            });
        } else {
            this.requestVariable(thread.scope, endVariable, end => {
                if (end == null) {
                    thread.addError('cannot resolve size');
                    thread.produce({
                        type: 'generic',
                        id: uniqId(),
                        start: thread.offset.offset,
                        end: thread.offset.offset,
                        name: '[ERR] cannot resolve size',
                        children
                    });
                    return;
                }

                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: end,
                    name: elem.name,
                    children
                });

                thread.moveTo(new Offset(end, 0));
                this.resume(thread);
            });
        }
    }

    private processRepeat(elem: Repeat, thread: Thread): void {
        thread.log(`Repeat`);
        const testThread = thread.fork(elem.until, thread.definition.clone(), () => {});
        const loopThread = thread.fork(elem.do, thread.definition);

        let aborted = false;
        loopThread.onFinalized(() => {
            thread.log(`Loop: ${loopThread.offset}`);
            thread.stepBack();
            thread.moveTo(loopThread.offset);
            this.resume(thread);
        });
        testThread.onError(() => {
            if (aborted) {
                throw new Error('This should not happen');
            }
            aborted = true;
            thread.log('Do');
            testThread.abort();
            this.resume(loopThread);
        });
        testThread.onFinalized((err) => {
            if (err == null) {
                this.resume(thread);
            }
        });
        this.resume(testThread);
    }

    private processNode(elem: AbstractDefinition<AnyElement>, head: Thread): void {
        switch (elem.model.type) {
            case 'fixed':
                return this.processFixed(elem.model, elem, head);
            case 'container':
                return this.processContainer(elem.model, head);
            // case 'if':
            //     return this.processIf(elem, head);
            case 'repeat':
                return this.processRepeat(elem.model, head);
            default:
                this.resume(head);
        }
    }

    private step(thread: Thread): void {
        const instr = thread.step();
        if (instr != null) {
            this.processNode(instr, thread);
        }
    }

    private _parse(): void {
        while (this.openList.length > 0) {
            const next = this.openList.splice(0, 1)[0];
            this.step(next);
        }
        this.finalize();
    }

    private finalize() {
        for (let value of this.closedList.values()) {
            value.forEach(v => v(null));
        }
    }

    public parse(): AbtRoot {
        const root: AbtRoot = {
            type: 'root',
            start: 0,
            end: this.data.length,
            id: uniqId(),
            children: [ ]
        };

        const rootContainer: ContainerField = {
            type: 'container',
            name: 'root',
            content: this.definition.content,
            size: this.data.length
        };

        const thread = new Thread(
            new Offset(0, 0),
            new Offset(this.data.length, 0),
            new AbstractDefinition(rootContainer),
            node => root.children.push(node)
        );
        thread.onError(err => console.error(err));
        thread.onFinalized(() => console.log('done'));

        this.resume(thread);

        this._parse();

        return root;
    }




    // Variable mgt. TODO: move to some other class
    private closedList: Map<string, Array<(variable: number | null) => void>> = new Map();
    private variables: Map<string, number> = new Map();

    private resolveExpression(scope: Scope, v: string | number, cb: (variable: number | null) => void): void {
        if (typeof v === 'number') {
            cb(v);
        } else {
            const expression = new Expression(v);
            this.requestVariables(scope, expression.variables, vars => {
                if (vars == null) {
                    cb(null);
                } else {
                    cb(expression.compute(vars));
                }
            });
        }
    }

    private requestVariables(scope: Scope, variables: string[], cb: (vars: Map<string, number> | null) => void): void {

        const resolved = new Map<string, number>();
        const rec = () => {
            if (variables.length === 0) {
                cb(resolved);
                return;
            }
            const current = variables.splice(0, 1)[0];
            this.requestVariable(scope, current, v => {
                if (v == null) {
                    cb(null);
                } else {
                    resolved.set(current, v);
                    rec();
                }
            });
        }

        rec();
    }

    private requestVariable(scope: Scope, variableName: string, cb: (variable: number | null) => void): void {
        // TODO: actually resolve variable
        const resolvedVariable = `${scope.prefix}.${variableName}`;
        const value = this.variables.get(resolvedVariable);
        if (value) {
            cb(value);
        } else {
            const list = this.closedList.get(resolvedVariable) || [];
            list.push(cb);
            this.closedList.set(resolvedVariable, list);
        }
    }

    private provideVariable(scope: Scope, variableName: string, value: number): void {
        // if (this.variables.has(variableName)) {
        //     throw new Error(`Redefinition of variable ${variableName}`);
        // }
        const fqName = `${scope.prefix}.${variableName}`;
        this.variables.set(fqName, value);
        const list = this.closedList.get(fqName) || [];
        this.closedList.delete(fqName);
        list.forEach(l => l(value));
    }
}
