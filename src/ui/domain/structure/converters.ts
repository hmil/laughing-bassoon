import { AbtNode, AbtRoot } from 'abt/Abt';

import { FileStructure, FileStructureNode } from './Structure';
import { HighlghtColorState } from 'ui/hexview/highlight/abtToHighlights';
import { AnyElement } from 'parser/model';

export function importStructure(abt: AbtRoot, backMapping: (el: AnyElement) => number): FileStructure {
    const colorMachine = new HighlghtColorState();
    const indexById = new Map<number, FileStructureNode>();
    const children = makeChildren(abt.children, backMapping, colorMachine, [abt.id], indexById);
    const root: FileStructureNode = {
        path: [],
        children: children.children,
        childrenIndex: children.childrenIndex,
        color: '0,0,0',
        id: 0,
        end: 0,
        name: 'root',
        origin: 0,
        start: 0
    };
    indexById.set(0, root);
    return {
        root,
        indexByGrammarNode: children.byGrammarNode,
        indexById
    };
}


function makeChildren(content: AbtNode[], backMapping: (el: AnyElement) => number, colorMachine: HighlghtColorState, prefix: ReadonlyArray<number>, indexById: Map<number, FileStructureNode>):{
        children: ReadonlyArray<FileStructureNode>,
        childrenIndex: Map<number, FileStructureNode>,
        byGrammarNode: {[k: string]: FileStructureNode[] }
    } {
    let byGrammarNode: {[k: string]: FileStructureNode[]} = { };
    const childrenIndex = new Map<number, FileStructureNode>();
    const children = content ? content.map(c => {
        const mapped = importNode(c);
        indexById.set(mapped.id, mapped);
        const bucket = byGrammarNode[mapped.origin] || (byGrammarNode[mapped.origin] = []);
        bucket.push(mapped);
        childrenIndex.set(mapped.id, mapped);
        return mapped;
    }) : [];
    return { children, byGrammarNode, childrenIndex };

    function importNode(content: AbtNode): FileStructureNode {
        const children = makeChildren(content.children != null ? content.children : [], backMapping, colorMachine, [...prefix, content.id], indexById);
        byGrammarNode = mergeIndices(
            byGrammarNode,
            children.byGrammarNode
        );
        switch (content.type) {
            case 'generic':
                return {
                    id: content.id,
                    path: [...prefix, content.id],
                    color: colorMachine.nextColor(),
                    children: children.children,
                    childrenIndex: children.childrenIndex,
                    name: content.name,
                    origin: backMapping(content.origin),
                    start: content.start,
                    end: content.end
                };
            default:
                throw new Error('Not implemented');
        }
    }
}

function mergeIndices<T>(a: {[k: string]: T[]}, b: {[k: string]: T[]}) {
    const ret = { ...a };
    for (const k of Object.keys(b)) {
        const bucket = ret[k] || (ret[k] = []);
        bucket.push(...b[k]);
    }
    return ret;
}