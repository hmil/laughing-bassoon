import { AbtNode, AbtRoot } from 'abt/Abt';

import { FileStructure, FileStructureNode } from './Structure';
import { HighlghtColorState } from 'ui/hexview/highlight/abtToHighlights';

export function importStructure(abt: AbtRoot): FileStructure {
    const colorMachine = new HighlghtColorState();
    const children = makeChildren(abt.children, colorMachine, [abt.id]);
    const root: FileStructureNode = {
        path: [],
        children: children.children,
        childrenIndex: children.childrenIndex,
        color: '0,0,0',
        id: 0,
        end: 0,
        isHovered: false,
        isSelected: false,
        name: 'root',
        origin: 0,
        start: 0
    };
    return {
        root,
        indexByGrammarNode: children.byGrammarNode
    };
}


function makeChildren(content: AbtNode[], colorMachine: HighlghtColorState, prefix: ReadonlyArray<number>):{
        children: ReadonlyArray<FileStructureNode>,
        childrenIndex: Map<number, FileStructureNode>,
        byGrammarNode: {[k: number]: FileStructureNode }
    } {
    let byGrammarNode: {[k: number]: FileStructureNode} = { };
    const childrenIndex = new Map<number, FileStructureNode>();
    const children = content ? content.map(c => {
        const mapped = importGrammarNode(c)
        byGrammarNode[mapped.origin] = mapped;
        childrenIndex.set(mapped.id, mapped);
        return mapped;
    }) : [];
    return { children, byGrammarNode, childrenIndex };

    function importGrammarNode(content: AbtNode): FileStructureNode {
        const children = makeChildren(content.children != null ? content.children : [], colorMachine, [...prefix, content.id]);
        byGrammarNode = {
            ...byGrammarNode,
            ...children.byGrammarNode
        };
        switch (content.type) {
            case 'generic':
                return {
                    id: content.id,
                    path: [...prefix, content.id],
                    color: colorMachine.nextColor(),
                    children: children.children,
                    childrenIndex: children.childrenIndex,
                    isHovered: false,
                    isSelected: false,
                    name: content.name,
                    origin: 1, // TODO: lookup node to find actual origin,
                    start: content.start,
                    end: content.end
                };
            default:
                throw new Error('Not implemented');
        }
    }
}
