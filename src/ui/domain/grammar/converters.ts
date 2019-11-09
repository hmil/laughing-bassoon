import { ParserDefinition, AnyElement } from 'parser/model';
import { Grammar, GrammarTree, Size } from './Grammar';
import { uniqId } from 'parser/uid';

export function importGrammar(grammar: ParserDefinition): Grammar {
    const id = uniqId();
    const path = [id];
    const mapChild = importGrammarNode(path);
    const root: GrammarTree = {
        id: id,
        path: path,
        type: 'container',
        isHovered: false,
        isSelected: false,
        size: undefined,
        ref: undefined,
        ...makeChildren(grammar.content, mapChild)
    };
    return {
        codecs: grammar.codecs != null ? grammar.codecs : [],
        mimeType: grammar.type,
        definition: root
    };
}

function importGrammarNode(prefix: ReadonlyArray<number>) {
    return (content: AnyElement): GrammarTree => {
        const id = uniqId();
        const path = [...prefix, id];
        const mapChild = importGrammarNode(path);
        switch (content.type) {
            case 'container':
                return {
                    type: 'container',
                    id: id,
                    path: path,
                    isHovered: false,
                    isSelected: false,
                    ref: content.ref,
                    size: content.size == null ? undefined : importSize(content),
                    ...makeChildren(content.content, mapChild)
                };
            case 'fixed':
                return {
                    type: 'value',
                    id: id,
                    path: path,
                    codec: content.codec,
                    isHovered: false,
                    isSelected: false,
                    ref: content.ref,
                    constraints: content.constraints,
                    size: importSize(content),
                    ...makeChildren(content.content, mapChild)
                };
            case 'if': {
                return {
                    type: 'if',
                    id: id,
                    path: path,
                    condition: content.cond,
                    isHovered: false,
                    isSelected: false,
                    ref: content.ref,
                    ...makeChildren(content.then, mapChild)
                };
            }
            case 'repeat': {
                return {
                    type: 'repeat',
                    id: id,
                    path: path,
                    until: content.until.map(mapChild),
                    isHovered: false,
                    isSelected: false,
                    ref: content.ref,
                    ...makeChildren(content.do, mapChild)
                };
            }
            case 'flags':
                throw new Error('Not implemented');
        }
    };
}

function makeChildren(content: AnyElement[] | undefined, mapChild: (elem: AnyElement) => GrammarTree): { children: GrammarTree[], childrenIndex: Map<number, GrammarTree> } {
    const childrenIndex = new Map<number, GrammarTree>();
    const children = content ? content.map(c => {
        const mapped = mapChild(c)
        childrenIndex.set(mapped.id, mapped);
        return mapped;
    }) : [];
    return { children, childrenIndex };
}

export function exportGrammar(grammar: Grammar): ParserDefinition {
    return {
        codecs: grammar.codecs.length > 0 ? grammar.codecs : [],
        type: grammar.mimeType,
        endian: 'little',
        wordlength: 32,
        content: grammar.definition.children.map(exportGrammarNode)
    };
}

function exportGrammarNode(node: GrammarTree): AnyElement {
    switch (node.type) {
        case 'container':
            return {
                type: 'container',
                content: node.children.length > 0 ? node.children.map(exportGrammarNode) : [],
                name: node.ref || '<container>',
                ref: node.ref,
                size: node.size == null ? undefined : node.size.value
            };
        case 'value':
            return {
                type: 'fixed',
                codec: node.codec,
                name: node.ref || '<fixed>',
                constraints: node.constraints,
                ...exportSize(node.size)
            };
        case 'if':
            return {
                type: 'if',
                cond: node.condition,
                then: node.children.map(exportGrammarNode),
                ref: node.ref
            };
        case 'repeat':
            return {
                type: 'repeat',
                until: node.until.map(exportGrammarNode),
                do: node.children.map(exportGrammarNode),
                ref: node.ref
            };
    }
}


// Converter utilities

function importSize({ size, bitSize }: { size?: string | number, bitSize?: string | number }): Size {
    if (size != null) {
        return {
            value: `${size}`,
            unit: 'byte'
        }
    } else if (bitSize != null) {
        return {
            value: `${bitSize}`,
            unit: 'bit'
        }
    }
    throw new Error('Invalid size cannot be imported.');
}

function exportSize(size: Size): { size: string | number} | { bitSize: string | number } {
    return size.unit === 'byte' ? { size: size.value } : { bitSize: size.value };
}