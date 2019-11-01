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
import { createScopeTree, Scope } from './scoping';
import { ScopeTree } from './scoping/ScopeTree';


// TODO: move to own file
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
            public readonly context: string,
            private _offset: Offset,
            private _limit: Offset,
            public readonly instructions: AnyElement[],
            public readonly produce: (node: AbtNode) => void) {
        this.log(`Spawn`);
    }

    public get offset() { return this._offset }
    public get limit() { return this._limit }

    fork(nextContext: string | null, instructions: AnyElement[], produce?: (node: AbtNode) => void): Thread {
        return new Thread(
            nextContext == null ? this.context : `${this.context}/${nextContext}`,
            this._offset,
            this._limit,
            instructions,
            produce ? produce : this.produce
        );
    }

    abort(): void {
        this.assertNotComplete();
        this.finalize();
        this.isCancelled = true;
    }

    step(): AnyElement | undefined {
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
        this.notifyError(`[${this.id}] ${err}`);
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
    private readonly scopeTree: ScopeTree;
    private openList: Thread[] = [];
    private closedList: Set<(variable: number | null) => void> = new Set();

    constructor(
            private readonly definition: ParserDefinition,
            private readonly data: Uint8Array) {
        this.codecLibrary = createCodecLibrary(definition.codecs);
        this.scopeTree = createScopeTree(definition);
    }

    private resume(thread: Thread): void {
        thread.log(`Resume`);
        this.openList.push(thread);
    }

    private processFixed(elem: FixedField, thread: Thread): void {
        thread.log(`Fixed: ${elem.name}`);
        if ('bitSize' in elem) { // TODO: handle bit size
            throw new Error('Bit sizing not yet supported');
        }

        let name = elem.name;

        this.resolveExpression(thread.context, this.scopeTree.getScopeForNode(elem), elem.size, size => {
            if (size == null) {
                thread.addError('Cannot resolve size');
                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: thread.offset.offset,
                    name: '[ERR] cannot resolve size',
                    origin: elem
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

            if (codec != null) {
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
                                if (typeof value === 'number' && !isNaN(value)) {
                                    this.provideVariable(thread.context, this.scopeTree.getScopeForNode(elem), elem.ref, value);
                                }
                            }
                            name += ` = ${value}`;
                        }
                    )
                );
            }
    
            thread.produce({
                type: 'generic',
                id: uniqId(),
                start: thread.offset.offset,
                end: thread.offset.offset + size,
                name: name,
                origin: elem
            });
    
            thread.moveBy(new Offset(size, 0));
            this.resume(thread);
        });
    }

    private processContainer(elem: ContainerField, thread: Thread): void {
        thread.log(`Container: ${elem.name}`);

        const id = uniqId();
        const endVariable = `system.container@${id}.end`;
        const children: AbtNode[] = [];
        const scope = this.scopeTree.getScopeForNode(elem);

        if (elem.content != null) {
            const childThread = thread.fork(
                    null,
                    elem.content,
                    node => children.push(node));
            childThread.onError(err => thread.addError(err));
            childThread.onFinalized(() => {
                this.provideVariable(thread.context, scope, endVariable, childThread.offset.offset);
            });
            this.resume(childThread);
        } else {
            this.provideVariable(thread.context, scope, endVariable, 0);
        }

        if (elem.size != null) {
            this.resolveExpression(thread.context, scope, elem.size, size => {
                if (size == null) {
                    thread.addError('cannot resolve size');
                    thread.produce({
                        type: 'generic',
                        id: uniqId(),
                        start: thread.offset.offset,
                        end: thread.offset.offset,
                        name: '[ERR] cannot resolve size',
                        children,
                        origin: elem
                    });
                    return;
                }

                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: thread.offset.offset + size,
                    name: elem.name,
                    children,
                    origin: elem
                });

                thread.moveBy(new Offset(size, 0));
                this.resume(thread);
            });
        } else {
            this.requestVariable(thread.context, scope, endVariable, end => {
                if (end == null) {
                    thread.addError('cannot resolve size');
                    thread.produce({
                        type: 'generic',
                        id: uniqId(),
                        start: thread.offset.offset,
                        end: thread.offset.offset,
                        name: '[ERR] cannot resolve size',
                        children,
                        origin: elem
                    });
                    return;
                }

                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: end,
                    name: elem.name,
                    children,
                    origin: elem
                });

                thread.moveTo(new Offset(end, 0));
                this.resume(thread);
            });
        }
    }

    private processRepeat(elem: Repeat, thread: Thread): void {
        thread.log(`Repeat`);
        // This must be unique for each iteration, but ideally it should be sequential
        const iterationCounter = uniqId();
        const testThread = thread.fork('test', elem.until, () => {});
        const loopThread = thread.fork(`${iterationCounter}`, elem.do);

        let aborted = false;
        loopThread.onFinalized(() => {
            thread.log(`Loop: ${loopThread.offset}`);
            thread.stepBack();
            thread.moveTo(loopThread.offset);
            this.resume(thread);
        });
        testThread.onError(err => {
            if (aborted) {
                throw new Error('This should not happen');
            }
            thread.log(`resume because ${err}`);
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

    private processNode(elem: AnyElement, head: Thread): void {
        switch (elem.type) {
            case 'fixed':
                return this.processFixed(elem, head);
            case 'container':
                return this.processContainer(elem, head);
            // case 'if':
            //     return this.processIf(elem, head);
            case 'repeat':
                return this.processRepeat(elem, head);
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
       this.closedList.forEach(v => v(null));
    }

    public parse(): AbtRoot {
        const root: AbtRoot = {
            type: 'root',
            start: 0,
            end: this.data.length,
            id: uniqId(),
            children: [ ],
            origin: this.definition
        };

        const thread = new Thread(
            'root',
            new Offset(0, 0),
            new Offset(this.data.length, 0),
            this.definition.content,
            node => root.children.push(node)
        );
        thread.onError(err => console.error(err));
        thread.onFinalized(err => console.log(`done${err ? ' with errors' : ''}`));

        this.resume(thread);

        this._parse();

        return root;
    }

    private resolveExpression(context: string, scope: Scope, v: string | number, cb: (variable: number | null) => void): void {
        if (typeof v === 'number') {
            cb(v);
        } else {
            const expression = new Expression(v);
            this.requestVariables(context, scope, expression.variables, vars => {
                if (vars == null) {
                    cb(null);
                } else {
                    cb(expression.compute(vars));
                }
            });
        }
    }

    private requestVariables(context: string, scope: Scope, variables: string[], cb: (vars: Map<string, number> | null) => void): void {
        const resolved = new Map<string, number>();
        const rec = () => {
            if (variables.length === 0) {
                cb(resolved);
                return;
            }
            const current = variables.splice(0, 1)[0];
            this.requestVariable(context, scope, current, v => {
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

    private requestVariable(context: string, scope: Scope, variableName: string, cb: (variable: number | null) => void): void {
        this.closedList.add(cb);
        scope.resolveVariable(context, variableName, value => {
            this.closedList.delete(cb);
            cb(value);
        });
    }

    private provideVariable(context: string, scope: Scope, variableName: string, value: number): void {
        scope.provideVariable(context, variableName, value);
    }
}
