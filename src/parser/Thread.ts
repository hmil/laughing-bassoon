import { Offset } from './Offset';
import { GrammarInstruction } from './domain/Grammar';
import { AbtNode } from './domain/Abt';


export class ParserThread {

    private static tcounter = 0;

    private programCounter: number = 0;
    private isComplete: boolean = false;
    private errors: string[] = [];
    private isCancelled: boolean = false;

    private errorListeners: Array<(err: string) => void> = [];
    private finalizedListeners: Array<(err?: string[]) => void> = [];

    public readonly id: number = ParserThread.tcounter ++;

    constructor(
            public readonly context: string,
            private _offset: Offset,
            private _limit: Offset,
            public readonly instructions: ReadonlyArray<GrammarInstruction>,
            public readonly produce: (node: AbtNode) => void) {
        this.log(`Spawn`);
    }

    public get offset() { return this._offset }
    public get limit() { return this._limit }

    fork(nextContext: string | null, instructions: ReadonlyArray<GrammarInstruction>, produce?: (node: AbtNode) => void): ParserThread {
        return new ParserThread(
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

    step(): GrammarInstruction | undefined {
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

    log(_msg: string) {
        // console.log(`[${this.id}] ${msg}`);
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
