import { AbtRoot } from '../abt/Abt';
import { ParserDefinition } from '../parser/model';

export interface BaseAction<Type extends string, DATA> {
    type: Type;
    data: DATA;
}

function makeAction<Type extends string, Data>(type: Type, data: Data): BaseAction<Type, Data> {
    return { type, data };
}

export const loadFile = (data: Uint8Array) => makeAction('loadFile', data);
export const loadParseTree = (data: AbtRoot) => makeAction('loadTree', data);
export const loadGrammar = (data: ParserDefinition) => makeAction('loadGrammar', data);
export const requestChunks = (data: number[]) => makeAction('requestChunks', data);
export const hoverHighlight = (data: { id: number | null}) => makeAction('hoverHighlight', data);
export const toggleSemanticNode = (data: { id: number }) => makeAction('toggleSemanticNode', data);
export const selectNode = (data: { id: number | null}) => makeAction('selectNode', data);
