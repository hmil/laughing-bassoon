import { ParserDefinition, AnyElement, ContainerField, Repeat, IfField } from '../model';
import { ScopeTree, Scope } from './ScopeTree';
export { Scope, ScopeTree } from './ScopeTree';

export function createScopeTree(definition: ParserDefinition) {
    const tree = new ScopeTree();
    const rootScope = tree.createScope(null);

    definition.content.forEach(c => attachElement(rootScope, c));

    function createChildScope(parent: Scope, elem: ContainerField) {
        tree.attachScope(elem, parent);
        const scope = tree.createScope(parent, elem.ref);

        if (elem.content != null) {
            elem.content.forEach(c => attachElement(scope, c));
        }
    }

    function createLoopScope(parent: Scope, elem: Repeat) {
        tree.attachScope(elem, parent);
        const scope = tree.createScope(parent, elem.ref);

        elem.until.forEach(c => attachElement(scope, c));
        elem.do.forEach(c => attachElement(scope, c));
    }

    function createIfScope(parent: Scope, elem: IfField) {
        tree.attachScope(elem, parent);
        // const scope = tree.createScope(parent, elem.ref);

        if (elem.then) {
            elem.then.forEach(c => attachElement(parent, c));
        }
        if (elem.else) {
            elem.else.forEach(c => attachElement(parent, c));
        }
    }

    function attachElement(parent: Scope, element: AnyElement) {
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
