import { uniqId } from "./uid";
import { Offset } from "./Offset";
import { Expression } from './Expression';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { createScopeTree, Scope } from './scoping';
import { ScopeTree } from './scoping/ScopeTree';
import { AbtRoot, AbtNode } from './domain/Abt';
import { ParserGrammar, GrammarInstruction, IfGrammarInstruction, RepeatGrammarInstruction, ContainerGrammarInstruction, FixedGrammarInstruction } from './domain/Grammar';
import { ParserThread } from './Thread'; 
import { CodecLibrary } from './codec/CodecLibrary';
import { createCodecLibrary } from './codec';


export class Parser {

    public readonly codecLibrary: CodecLibrary;
    private readonly scopeTree: ScopeTree;
    private openList: ParserThread[] = [];
    private closedList: Set<(variable: number | null) => void> = new Set();

    constructor(
            private readonly grammar: ParserGrammar,
            private readonly data: Uint8Array) {
        this.codecLibrary = createCodecLibrary(grammar.codecs);
        this.scopeTree = createScopeTree(grammar);
    }

    private resume(thread: ParserThread): void {
        thread.log(`Resume`);
        this.openList.push(thread);
    }

    private processFixed(elem: FixedGrammarInstruction, thread: ParserThread): void {
        if ('bitSize' in elem) { // TODO: handle bit size
            throw new Error('Bit sizing not yet supported');
        }

        let name = elem.ref || '<field>';

        this.resolveExpression(thread.context, this.scopeTree.getScopeForNode(elem), elem.size.value, size => {
            if (size == null) {
                thread.addError('Cannot resolve size');
                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: thread.offset.offset,
                    name: '[ERR] cannot resolve size',
                    origin: elem.id
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
            const codec = this.codecLibrary.resolve(elem.codec);

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
                origin: elem.id
            });
    
            thread.moveBy(new Offset(size, 0));
            this.resume(thread);
        });
    }

    private processContainer(elem: ContainerGrammarInstruction, thread: ParserThread): void {
        thread.log(`Container: ${elem.ref}`);

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
            this.resolveExpression(thread.context, scope, elem.size.value, size => {
                if (size == null) {
                    thread.addError('cannot resolve size');
                    thread.produce({
                        type: 'generic',
                        id: uniqId(),
                        start: thread.offset.offset,
                        end: thread.offset.offset,
                        name: '[ERR] cannot resolve size',
                        children,
                        origin: elem.id
                    });
                    return;
                }

                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: thread.offset.offset + size,
                    name: elem.ref || '<container>',
                    children,
                    origin: elem.id
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
                        origin: elem.id
                    });
                    return;
                }

                thread.produce({
                    type: 'generic',
                    id: uniqId(),
                    start: thread.offset.offset,
                    end: end,
                    name: elem.ref || '<container>',
                    children,
                    origin: elem.id
                });

                thread.moveTo(new Offset(end, 0));
                this.resume(thread);
            });
        }
    }

    private processRepeat(elem: RepeatGrammarInstruction, thread: ParserThread): void {
        thread.log(`Repeat`);
        // This must be unique for each iteration, but ideally it should be sequential
        const iterationCounter = uniqId();
        const testThread = thread.fork('test', elem.until, () => {});
        const loopThread = thread.fork(`${iterationCounter}`, elem.do);

        let aborted = false;
        loopThread.onFinalized(() => {
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

    private processIf(elem: IfGrammarInstruction, thread: ParserThread): void {
        const scope = this.scopeTree.getScopeForNode(elem);
        this.resolveExpression(thread.context, scope, elem.condition, result => {
            if (result) {
                if (elem.then) {
                    const thenThread = thread.fork(null, elem.then);
                    thenThread.onFinalized(() => {
                        thread.moveTo(thenThread.offset);
                        this.resume(thread);
                    });
                    this.resume(thenThread);
                } else {
                    this.resume(thread);
                }
            } else {
                this.resume(thread);
            }
        });
    }

    private processNode(elem: GrammarInstruction, head: ParserThread): void {
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
                throw new Error(`unknown elem type: ${elem.type}`);
        }
    }

    private step(thread: ParserThread): void {
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
            id: uniqId(),
            start: 0,
            end: this.data.length,
            children: [ ]
        };

        const thread = new ParserThread(
            'root',
            new Offset(0, 0),
            new Offset(this.data.length, 0),
            this.grammar.root,
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
