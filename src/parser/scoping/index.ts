import { ParserDefinition, AnyElement, ContainerField, Repeat } from '../model';
import { ScopeTree, Scope } from './ScopeTree';
export { Scope, ScopeTree } from './ScopeTree';

export function createScopeTree(definition: ParserDefinition) {
    const tree = new ScopeTree();
    const rootScope = tree.createScope(null);

    definition.content.forEach(c => attachElement(rootScope, c));

    function createChildScope(parent: Scope, elem: ContainerField) {
        const scope = tree.createScope(parent, elem.ref);
        tree.attachScope(elem, scope);

        if (elem.content != null) {
            elem.content.forEach(c => attachElement(scope, c));
        }
    }

    function createLoopScope(parent: Scope, elem: Repeat) {
        const scope = tree.createScope(parent, elem.ref);
        tree.attachScope(elem, scope);

        elem.until.forEach(c => attachElement(scope, c));
        elem.do.forEach(c => attachElement(scope, c));
    }

    function attachElement(parent: Scope, element: AnyElement) {
        switch (element.type) {
            case 'container':
                return createChildScope(parent, element);
            case 'repeat':
                return createLoopScope(parent, element);
            default:
                tree.attachScope(element, parent);
        }
    }

    return tree;
}
