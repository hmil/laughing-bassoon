import { getEntityMetadata } from './metadata';
import { EntityType, ConstructorType, PrimaryKey, ArgumentsOf, InstanceOf, Store, QuerySelector } from './types';
import { QuerySelectorImpl } from './QuerySelector';

const STORE_KEY = Symbol('STORE_KEY');

type Flatten<T extends any[]> = {
    rec: ((...args: T) => void) extends ((head: infer Head, ...tail: infer Tail) => void) ?
        Head | Flatten<Tail> : never;
    end: never
}[
    ((...args: T) => void) extends ((head: unknown, ...tail: any[]) => void) ? 'end' : 'rec'
];



interface StorageUnit<T extends EntityType> {
    type: ConstructorType<T>;
    props: object;
}


export function createStore<T extends Array<ConstructorType<EntityType>>>(..._entities: T): Store<InstanceOf<Flatten<T>>> {
    const buckets: Map<PrimaryKey, StorageUnit<EntityType>> = new Map();
    return new StoreImpl<any>(buckets);
}


class StoreImpl<T extends EntityType> implements Store<T> {

    constructor(private readonly buckets: Map<PrimaryKey, StorageUnit<T>> = new Map()) {
    }

    create<U extends T>(type: ConstructorType<U>, args: ArgumentsOf<U>): U {
        const inst = this.instantiate(type);
        inst.id = args.id; // First assign the id, otherwise fk registering might fail
        for (const k of Object.keys(args)) {
            (inst as any)[k] = (args as any)[k];
        }
        return inst;
    }

    save(ent: T): Store<T> {
        const store = ((ent as any)[STORE_KEY].operations as Array<(store: StoreImpl<any>) => StoreImpl<any>>).reduce<StoreImpl<any>>((acc, op) => op(acc), this);
        const newBucket = new Map(store.buckets);
        newBucket.set(ent.id, {
            type: ent.constructor as any,
            props: this.serialize(ent)
        });
        return new StoreImpl(newBucket);
    }
    
    get<U extends T>(id: string): U | undefined {
        const ent = this.buckets.get(id) as StorageUnit<U> | undefined;
        if (ent == null) {
            return ent;
        }
        return this.deserialize(ent.type, ent.props);
    }
    
    delete(id: string): Store<T> {
        const newBucket = new Map(this.buckets);
        newBucket.delete(id);
        // TODO: Update foreign keys (or maybe handle at read time?)
        return new StoreImpl(newBucket);
    }

    select<U extends T>(type: ConstructorType<U>): QuerySelector<U> {
        const acc: U[] = [];
        for (const [ , value] of this.buckets.entries()) {
            if (value.type.prototype instanceof type) {
                acc.push(this.deserialize(value.type as ConstructorType<U>, value.props));
            }
        }
        return new QuerySelectorImpl(acc);
    }

    private serialize(ent: EntityType): object {
        const metadata = getEntityMetadata(ent.constructor);
        if (metadata == null) {
            throw new Error('Cannot serialize without metadata');
        }

        const result: any = {};
        for (const prop of metadata.props) {
            const key = prop.key;
            switch (prop.type) {
                case 'scalar':
                    result[key] = ent[key as keyof typeof ent];
                    break;
                case 'toOne':
                    result[key] = (ent as any)[STORE_KEY].fks[key];
                    result[`__STORE_ORDER_${String(key)}`] = (ent as any)[STORE_KEY].fks_order[key];
                    break;
            }
        }
        return result;
    }

    private deserialize<U extends T>(ctr: ConstructorType<U>, data: any): U {
        const inst = this.instantiate(ctr);

        const metadata = getEntityMetadata(ctr);
        if (metadata == null) {
            throw new Error('Cannot deserialize without metadata');
        }

        inst.id = data.id; // First assign the id, otherwise fk registering might fail
        for (const k of Object.keys(data)) {
            if (k.startsWith('__STORE_ORDER_')) {
                (inst as any)[STORE_KEY].fks_order[k.replace('__STORE_ORDER_', '')] = data[k];
            } else {
                (inst as any)[k] = data[k];
            }
        }

        return inst;
    }

    private instantiate<U extends T>(ctr: ConstructorType<U>): U {
        // Create a record and instrument it properly
        const inst = new ctr();
        (inst as any)[STORE_KEY] = {
            store: this,
            fks: {},
            fks_order: {},
            operations: []
        };
        const metadata = getEntityMetadata(ctr);
        if (metadata == null) {
            throw new Error('Cannot deserialize without metadata');
        }

        for (const prop of metadata.props) {
            const key = prop.key;
            switch (prop.type) {
                case 'toOne':
                    Object.defineProperty(inst, key, this.toOneRelation(key));
                    break;
                case 'toMany':
                    Object.defineProperty(inst, key, this.toManyRelation(prop.fk));
                    break;
            }
        }

        return inst;
    }

    private toOneRelation(key: PropertyKey): PropertyDescriptor {
        let _cache: object | undefined = undefined;
        return {
            configurable: false,
            enumerable: true,
            get() {
                if (_cache == null) {
                    _cache = (this as any)[STORE_KEY].store.get((this as any)[STORE_KEY].fks[key]);
                }
                return _cache;
            },
            set(value: T | string | undefined) {
                if (typeof value === 'string') {
                    (this as any)[STORE_KEY].fks[key] = value;
                    _cache = undefined;
                } else if (value != null) {
                    (this as any)[STORE_KEY].operations.push((store: Store<T>) => store.save(value));
                    (this as any)[STORE_KEY].fks[key] = (value as any).id;
                } else {
                    (this as any)[STORE_KEY].fks[key] = undefined;
                }
            }
        };
    }

    private toManyRelation([type, fk]: [ConstructorType<any>, PropertyKey]): PropertyDescriptor {
        let _cache: T[] | undefined;
        return {
            configurable: false,
            enumerable: true,
            get(this: EntityType) {
                if (_cache == null) {
                    const results: T[] = (this as any)[STORE_KEY].store.select(type).where((ent: any) => ent[STORE_KEY].fks[fk] === this.id).all();
                    _cache = results.sort((a, b) => (a as any)[STORE_KEY].fks_order[fk] - (b as any)[STORE_KEY].fks_order[fk]);
                }
                return _cache;
            },
            set(this: EntityType, value: Array<T>) {
                _cache = value.map((v, i) => {
                    (v as any)[fk] = this.id;
                    (v as any)[STORE_KEY].fks_order[fk] = i;
                    (this as any)[STORE_KEY].operations.push((store: Store<T>) => store.save(v));
                    return v;
                });
            }
        };
    }
}
