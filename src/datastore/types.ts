export type PrimaryKey = string;

export interface EntityType {
    id: PrimaryKey;
}

export type ConstructorType<T extends EntityType> = {
    new (...args: any): T;
};

export type InstanceOf<T> = T extends ConstructorType<infer Prot> ? Prot : Object;

export type ArgumentsOf<T> = {
    [K in keyof T]: T[K];
}


export interface Store<T> {
    create<U extends T & EntityType>(ent: ConstructorType<U>, args: ArgumentsOf<U>): U;
    save(ent: T): Store<T>;
    select<U extends T & EntityType>(t: ConstructorType<U>): QuerySelector<U>;
    get<U extends T>(id: string): U | undefined;
    delete(id: string): Store<T>;
}

export interface QuerySelector<T extends EntityType> {
    all(): ReadonlyArray<T>;
    where(selector: (ent: T) => boolean): QuerySelector<T>;
}
