import { ScopeTree, Scope } from './ScopeTree';
import { ParserGrammar, GrammarInstruction, IfGrammarInstruction, RepeatGrammarInstruction, ContainerGrammarInstruction } from 'parser/domain/Grammar';
export { Scope, ScopeTree } from './ScopeTree';

export function createScopeTree(definition: ParserGrammar) {
    const tree = new ScopeTree();
    const rootScope = tree.createScope(null);

    definition.root.forEach(c => attachElement(rootScope, c));

    function createChildScope(parent: Scope, elem: ContainerGrammarInstruction) {
        tree.attachScope(elem, parent);
        const scope = tree.createScope(parent, elem.ref);

        if (elem.content != null) {
            elem.content.forEach(c => attachElement(scope, c));
        }
    }

    function createLoopScope(parent: Scope, elem: RepeatGrammarInstruction) {
        tree.attachScope(elem, parent);
        const scope = tree.createScope(parent, elem.ref);

        elem.until.forEach(c => attachElement(scope, c));
        elem.do.forEach(c => attachElement(scope, c));
    }

    function createIfScope(parent: Scope, elem: IfGrammarInstruction) {
        tree.attachScope(elem, parent);
        // const scope = tree.createScope(parent, elem.ref);

        if (elem.then) {
            elem.then.forEach(c => attachElement(parent, c));
        }
    }

    function attachElement(parent: Scope, element: GrammarInstruction) {
        switch (element.type) {
            case 'container':
                return createChildScope(parent, element);
            case 'repeat':
                return createLoopScope(parent, element);
            case 'if':
                return createIfScope(parent, element);
            default:
                tree.attachScope(element, parent);
        }
    }

    return tree;
}
