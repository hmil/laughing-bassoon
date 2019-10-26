import { AnyElement, Container } from './model';

export class AbstractDefinition {

    private readonly children: ReadonlyArray<AbstractDefinition>;

    constructor(public readonly model: AnyElement,
                private readonly parent?: AbstractDefinition) {

        const children: AbstractDefinition[] = [];
        if ('content' in model && model.content !== undefined) {
            model.content.forEach(child => children.push(new AbstractDefinition(child, this)));
        }
        this.children = children;
    }

    public clone(): AbstractDefinition {
        return new AbstractDefinition(this.model, this.parent);
    }
}