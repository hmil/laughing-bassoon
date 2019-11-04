import { AbtRoot } from '../abt/Abt';
import { ParserDefinition, AnyElement } from '../parser/model';

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
export const hoverHighlight = (data: { ids: number[]}) => makeAction('hoverHighlight', data);
export const toggleSemanticNode = (data: { id: number }) => makeAction('toggleSemanticNode', data);
export const selectNode = (data: { ids: number[] }) => makeAction('selectNode', data);
export const replaceGrammarNode = (data: AnyElement) => makeAction('replaceNode', data);
