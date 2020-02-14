import { createStore } from './store';
import { Property, Entity } from './dsl';

@Entity()
export class BaseGrammarElement<T extends string> {

    @Property()
    public type!: T;

    @Property()
    public id: string = '';

    @Property()
    public ref?: string | undefined;
}

export interface Size {
    readonly value: string;
    readonly unit: 'bit' | 'byte';
}

@Entity()
export class ValueGrammarElement extends BaseGrammarElement<'value'> {

    @Property()
    public codec: string | undefined;

    @Property()
    public size: Size = { value: '0', unit: 'bit'};

    @Property()
    public constraints: { type: 'isNull' }[] | undefined;

    @Property()
    public children: ReadonlyArray<ValueOrGrammarElement> = [];
}

type ValueOrGrammarElement = ValueGrammarElement;

@Entity()
class BasicEntity {

    @Property() public id!: string;

    @Property() public name: string = '';
}

@Entity()
class OtherEntity extends BasicEntity {

    @Property()
    public cost: number = 0;

    @Property({ toOne: true, optional: true })
    public parent?: OtherEntity;
}

const store = createStore(BasicEntity, OtherEntity);

const ent = store.create(OtherEntity, {
    id: '1',
    cost: 123,
    name: '123'
});
// ent.id = '1';

const child = store.create(OtherEntity, {
    id: '2',
    name: 'world',
    cost: 321,
    parent: ent
});
child.parent = ent;

const store2 = store.save(child);

let retrived = store2.get('2');
let notFound = store.get('1');

console.log(retrived);
console.log(notFound);

(window as any).store = store2;
(window as any).OtherEntity = OtherEntity;

// Problems with class/decorators:
// Inheritance is a bitch. Lots of black magic typing around prototype and constructor
// Type checking of Decorator onto member is weird
// Can't use decorator on member declared in constructor
// Deserialization plays weird with custom constructors