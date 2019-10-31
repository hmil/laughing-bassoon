import { AnyElement } from '../model';

export type VariableListener = (variable: number) => void;

// TODO: move to own file
export class Scope {

    private children: Map<string, Scope> = new Map();
    private variables: Map<string, number> = new Map();
    private listeners: Map<string, VariableListener[]> = new Map();

    constructor(private readonly parent: Scope | null, private readonly name?: string) {
        if (parent) {
            parent.addChild(this);
        }
    }

    private addChild(child: Scope) {
        if (child.name != null) {
            this.children.set(child.name, child);
        }
    }

    provideVariable(context: string, varName: string, value: number): void {
        if (varName.indexOf('/') >= 0) {
            throw new Error(`References can't reference a remote variable`);
        }
        const variableName = this.contextify(context, varName);
        if (this.variables.has(variableName)) {
            throw new Error(`Variable ${variableName} was already provided`);
        }
        this.variables.set(variableName, value);
        const listeners = this.listeners.get(variableName);
        if (listeners != null) {
            listeners.forEach(l => l(value));
        }
    }

    resolveVariable(context: string, path: string, cb: VariableListener): void {
        this._resolveVariable(context, path.split('/'), cb);
    }

    private _resolveVariable(context: string, path: string[], cb: VariableListener): void {
        if (path.length === 1) {
            const varName = this.contextify(context, path[0]);
            const value = this.variables.get(varName);
            if (value == null) {
                const listeners = this.listeners.get(varName) || [];
                listeners.push(cb);
                this.listeners.set(varName, listeners);
            } else {
                cb(value);
            }
        } else {
            const segment = path[0];
            const nextNode = this.children.get(segment);
            if (nextNode == null) {
                throw new Error('Cannot resolve path');
            }
            nextNode._resolveVariable(context, path.slice(1), cb);
        }
    }

    private contextify(context: string, variable: string): string {
        return `${context}.${variable}`;
    }
}

export class ScopeTree {

    private mapping: Map<AnyElement, Scope> = new Map();

    public getScopeForNode(node: AnyElement): Scope {
        const scope = this.mapping.get(node);
        if (scope == null) {
            throw new Error(`Element has no scope!`);
        }
        return scope;
    }

    public createScope(parent: Scope | null, name?: string): Scope {
        return new Scope(parent, name);
    }

    public attachScope(node: AnyElement, scope: Scope): void {
        if (this.mapping.has(node)) {
            throw new Error('Node is already attached to a scope!');
        }
        this.mapping.set(node, scope);
    }
}
