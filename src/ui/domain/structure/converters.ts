import { AbtNode, AbtRoot } from 'abt/Abt';

import { FileStructure, FileStructureNode } from './Structure';
import { AnyElement } from 'parser/model';

class ColorPalette {

    private colors = [
        '0, 113, 176',
        '7, 80, 203',
        '153, 0, 190',
        '182, 0, 144',
        '177, 9, 79',
        '156, 61, 0',
        '125, 84, 0',
        '75, 101, 0',
        '0, 113, 0',
        '0, 121, 65',
    ];

    private id = 0;

    public nextColor(): string {
        return this.colors[this.id = (this.id + 1) % this.colors.length];
    }
}

export function importStructure(abt: AbtRoot, backMapping: (el: AnyElement) => string): FileStructure {
    const colorMachine = new ColorPalette();
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
        origin: 'null',
        start: 0
    };
    indexById.set(0, root);
    return {
        root,
        indexByGrammarNode: children.byGrammarNode,
        indexById
    };
}


function makeChildren(content: AbtNode[], backMapping: (el: AnyElement) => string, colorMachine: ColorPalette, prefix: ReadonlyArray<number>, indexById: Map<number, FileStructureNode>):{
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