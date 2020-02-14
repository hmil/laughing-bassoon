import { GrammarInstruction } from 'parser/domain/Grammar';
import { Scope } from './Scope';

export class ScopeTree {

    private mapping: Map<GrammarInstruction, Scope> = new Map();

    public getScopeForNode(node: GrammarInstruction): Scope {
        const scope = this.mapping.get(node);
        if (scope == null) {
            throw new Error(`Element has no scope!`);
        }
        return scope;
    }

    public createScope(parent: Scope | null, name?: string): Scope {
        return new Scope(parent, name);
    }

    public attachScope(node: GrammarInstruction, scope: Scope): void {
        if (this.mapping.has(node)) {
            throw new Error('Node is already attached to a scope!');
        }
        this.mapping.set(node, scope);
    }
}
