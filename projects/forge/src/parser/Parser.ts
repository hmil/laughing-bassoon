import { ParserDefinition, ConstField, ContainerField, FixedField, Flags } from './model';
import { AnyElement } from './model/AnyElement';
import { AbtRoot, AbtNode } from '../abt/Abt';

const uniqId = (() => {
    let counter = 0;
    return () => counter++;
})();

enum Endian { Little, Big };

interface ParsingContext {
    endian: Endian,
    wordlength: number
}

export class Parser {

    private ctx: ParsingContext = {
        endian: Endian.Little,
        wordlength: 32
    };

    private readWord(cursor: number, data: Uint8Array, length: number): number {
        if (length > 32 || length % 8 !== 0) {
            throw new Error('length must be a multiple of 8 smaller than or equal to 32');
        }

        const nBytes = length / 8;
        let acc = 0;

        for (let i = 0 ; i < nBytes ; i++) {
            acc += data[cursor + i] << (i * 8);
        }

        return acc;
    }

    private readConst(node: ConstField, data: Uint8Array, cursor: number): { node: AbtNode, cursor: number } {
        if (node.size % 8 != 0) {
            throw new Error('Sub-byte sizes are not supported at the moment');
        }
        if (node.value.length > 1) {
            throw new Error('const is limited to a single word at the moment');
        }

        const read = this.readWord(cursor, data, node.size);
        const nextCursor = cursor + node.size / 8;
        if (read === node.value[0]) {
            return {
                node: {
                    id: uniqId(),
                    start: cursor,
                    end: nextCursor - 1,
                    name: `${node.name} : ${read}`,
                    type: 'generic'
                },
                cursor: nextCursor,
            };
        } else {
            return {
                node: {
                    id: uniqId(),
                    start: cursor,
                    end: nextCursor - 1,
                    name: `Error: ${node.name} (${read} != ${node.value[0]})`,
                    type: 'generic'
                },
                cursor: nextCursor,
            };
        }
    }

    private readContainer(node: ContainerField, data: Uint8Array, cursor: number): { node: AbtNode, cursor: number } {
        const result = node.content ? this.readChildren(node.content, data, cursor) : undefined;
        
        return {
            node: {
                id: uniqId(),
                type: 'generic',
                start: cursor,
                end: result ? result.cursor - 1 : cursor - 1,
                name: node.name,
                children: result ? result.nodes : undefined
            },
            cursor: result ? result.cursor : cursor
        }
    }

    private readFixed(node: FixedField, data: Uint8Array, cursor: number): { node: AbtNode, cursor: number } {
        if (node.size % 8 != 0) {
            throw new Error('Sub-byte sizes are not supported at the moment');
        }

        const nextCursor = cursor + node.size / 8;
        const value = this.readWord(cursor, data, node.size);
        const result = node.content ? this.readChildren(node.content, data, nextCursor) : undefined;

        return {
            cursor: (result ? result.cursor : nextCursor),
            node: {
                type: 'generic',
                name: `${node.name} : ${value}`,
                start: cursor,
                end: cursor + node.size / 8 - 1,
                id: uniqId(),
                children: result ? result.nodes : undefined
            }
        };
    }

    private readFlags(node: Flags, _data: Uint8Array, cursor: number): { node: AbtNode, cursor: number } {
        return {
            cursor,
            node: {
                type: 'generic',
                id: uniqId(),
                start: cursor,
                end: cursor,
                name: `flags: ${node.values.map(v => v.name).join(', ')}`
            }
        };
    }

    private readChildren(nodes: AnyElement[], data: Uint8Array, cursor: number): { nodes: AbtNode[], cursor: number } {
        let result: AbtNode[] = [];
        for (const node of nodes) {
            switch (node.type) {
                case 'const':
                    {
                        const ret = this.readConst(node, data, cursor);
                        result.push(ret.node);
                        cursor = ret.cursor;
                    }
                    break;
                case 'container':
                    {
                        const ret = this.readContainer(node, data, cursor);
                        result.push(ret.node);
                        cursor = ret.cursor;
                    }
                    break;
                case 'fixed':
                    {
                        const ret = this.readFixed(node, data, cursor);
                        result.push(ret.node);
                        cursor = ret.cursor;
                    }
                    break;
                case 'if':
                    if (node.then) {
                        const ret = this.readChildren(node.then, data, cursor);
                        result = result.concat(ret.nodes);
                        cursor = ret.cursor;
                    }
                    break;
                case 'flags':
                    const ret = this.readFlags(node, data, cursor);
                    result.push(ret.node);
                    cursor = ret.cursor;
                    break;
            }
        }

        return {
            nodes: result,
            cursor
        };
    }

    parse(definition: ParserDefinition, data: Uint8Array): AbtRoot {
    
        this.ctx = {
            endian: definition.endian === 'little' ? Endian.Little : Endian.Big,
            wordlength: definition.wordlength
        };
    
        if (this.ctx.endian != Endian.Little) {
            throw new Error('Only little endian is supported at the moment');
        }
    
        const children = this.readChildren(definition.content, data, 0);
    
        return {
            id: uniqId(),
            type: 'root',
            start: 0,
            end: children.cursor,
            children: children.nodes
        };
    }
}
