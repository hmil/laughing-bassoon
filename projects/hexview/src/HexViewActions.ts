import { Highlight } from './Highlight';
import { Selection } from './Selection';


export interface BaseAction<Type extends string, DATA> {
    type: Type;
    data: DATA;
}

function makeAction<Type extends string, Data>(type: Type, data: Data): BaseAction<Type, Data> {
    return { type, data };
}

export const setSelection = (data: Selection) => makeAction('setSelection', data);
export const addHighlight = (data: Highlight) => makeAction('addHighlight', data);
export const hoverHighlight = (data: { id: number | null}) => makeAction('hoverHighlight', data);
