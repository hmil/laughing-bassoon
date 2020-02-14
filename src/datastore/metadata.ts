import { EntityType, ConstructorType } from './types';

const DATASTORE_KEY = Symbol('DATASTORE_KEY');

export interface EntityMetadata {
    props: Array<PropertyMetadata>
}

interface BasePropertyMetadata<Type extends string> {
    type: Type;
    key: PropertyKey;
}
interface ToManyPropertyMetadata<T extends EntityType> extends BasePropertyMetadata<'toMany'> {
    fk: [ ConstructorType<T>, keyof T ];
}

export type PropertyMetadata = BasePropertyMetadata<'scalar'> | BasePropertyMetadata<'toOne'> | ToManyPropertyMetadata<any>;

export interface WithMetadata {
    [DATASTORE_KEY]: EntityMetadata;
}

export function hasMetadata(t: unknown): t is WithMetadata {
    return (typeof t === 'object' && t != null || typeof t === 'function') && t.hasOwnProperty(DATASTORE_KEY);
}

export function getEntityMetadata(ent: unknown): EntityMetadata | undefined {
    if (hasMetadata(ent)) {
        return ent[DATASTORE_KEY];
    }
    return undefined;
}

export function getOrCreateEntityMetadata(ent: unknown): EntityMetadata {
    if (!hasMetadata(ent)) {
        createMetadata(ent);
    }
    return (ent as WithMetadata)[DATASTORE_KEY];
}

export function createMetadata(ent: unknown): void {
    (ent as WithMetadata)[DATASTORE_KEY] = {
        props: []
    };
}