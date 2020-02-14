import { EntityType, QuerySelector } from "./types";



export class QuerySelectorImpl<T extends EntityType> implements QuerySelector<T> {

    constructor(private readonly entries: ReadonlyArray<T>) { }


    all(): readonly T[] {
        return this.entries;
    }

    where(selector: (el: T) => boolean): QuerySelector<T> {
        return new QuerySelectorImpl(this.entries.filter(selector));
    }
}