import { getOrCreateEntityMetadata, getEntityMetadata, PropertyMetadata } from './metadata';
import { ConstructorType, EntityType } from './types';

export type PropertyArgs = (ToManyPropertyArgs<any> | ToOnePropertyArgs | {}) & { optional?: boolean };

interface ToOnePropertyArgs {
    toOne: true;
}

interface ToManyPropertyArgs<T extends EntityType> {
    toMany: true;
    fk: [ConstructorType<T>, keyof T]
}


type ValidateProperty<Model, Key extends keyof Model, Config> = Config extends { toOne: true }?
        undefined extends Model[Key] ? Model : "'toOne' Relationships must be optional"
    : Model;

export function Property<Config extends PropertyArgs>(config?: Config) {
    return function<T, K extends keyof T>(model: ValidateProperty<T, K, Config>, key: K, _pos?: number): void {
        const metadata = getOrCreateEntityMetadata((model as any).constructor);
        metadata.props.push(getPorpertyMetadataForConfig(key, config));
    }
}

function getPorpertyMetadataForConfig(key: PropertyKey, config: PropertyArgs | undefined): PropertyMetadata {
    if (config == null) {
        return { key, type: 'scalar' };
    }
    if ('toOne' in config) {
        return { key, type: 'toOne' };
    }
    if ('toMany' in config) {
        return {
            key,
            type: 'toMany',
            fk: config.fk
        };
    }

    return { key, type: 'scalar' };
}

interface ModelInstance { id: string };
type ValidateEntity<Model> = Model extends { new (): ModelInstance } ? Model : 'Error: Entity class must not be abstract, cannot take constructor arguments and must have an id attribute of type string';

export function Entity() {
    return function<T extends Function>(model: ValidateEntity<T>): void {
        const metadata = getOrCreateEntityMetadata(model);
        let parent = Object.getPrototypeOf(model);
        while (parent != null) {
            const parentMeta = getEntityMetadata(parent);
            if (parentMeta != null) {
                for (const key of parentMeta.props) {
                    if (metadata.props.indexOf(key) < 0) {
                        metadata.props.push(key);
                    }
                }
            }
            parent = Object.getPrototypeOf(parent);
        }
    }
}
