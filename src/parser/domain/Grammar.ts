import { ParserDefinition, AnyElement } from 'parser/dsl';
import { CodecLibrary } from 'parser/codec/CodecLibrary';
import { CustomCodec } from 'parser/codec/CustomCodec';
import { IntCodec } from 'parser/codec/IntCodec';
import { CStringCodec } from 'parser/codec/CStringCodec';
import { uniqId } from 'parser/uid';


export function dslToGrammar(dsl: ParserDefinition): ParserGrammar {

    const codecs = new CodecLibrary();

    // Register built-in codecs.
    codecs.registerCodec('int', new IntCodec());
    codecs.registerCodec('cstring', new CStringCodec());

    // Register custom codecs.
    if (dsl.codecs != null) {
        dsl.codecs.forEach(c => codecs.registerCodec(c.name, new CustomCodec(c)));
    }

    const root = dsl.content.map(c => importContent(c));

    return { 
        codecs: dsl.codecs || [],
        root: root, 
        type: dsl.type
    };
}

function importContent(c: AnyElement): GrammarInstruction {
    const id = `${uniqId()}`;

    switch (c.type) {
        case 'container':
            return {
                id,
                type: 'container',
                content: c.content?.map(importContent) || [],
                ref: c.ref,
                size: importSize(c)
            };
        case 'fixed':
            return {
                id,
                type: 'fixed',
                codec: c.codec,
                constraints: c.constraints,
                ref: c.ref,
                size: importSize(c) || { value: '', unit: 'byte' }
            };
        case 'flags':
            throw new Error('Who needs flags anyways?');
        case 'if':
            return {
                id,
                type: 'if',
                condition: c.cond,
                ref: c.ref,
                then: c.then?.map(importContent) || []
            };
        case 'repeat':
            return {
                id,
                type: 'repeat',
                ref: c.ref,
                until: c.until.map(importContent),
                do: c.do.map(importContent)
            };
    }
}

function importSize({ size, bitSize }: { size?: string | number, bitSize?: string | number }): Size | undefined {
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
}

export interface ParserGrammar {
    readonly codecs: ParserCodec[];
    readonly root: GrammarInstruction[];
    readonly type: string;
}

export interface ParserCodec {
    readonly type: string;
    readonly name: string;
    readonly encode: string;
    readonly decode: string;
}

export interface Size {
    readonly value: string;
    readonly unit: 'bit' | 'byte';
}

export interface BaseGrammarInstruction<T extends string> {
    readonly type: T;
    readonly id: string;
    readonly ref: string | undefined;
}

export interface FixedGrammarInstruction extends BaseGrammarInstruction<'fixed'> {
    readonly codec: string | undefined;
    readonly size: Size;
    readonly constraints: { type: 'isNull' }[] | undefined;
}

export interface ContainerGrammarInstruction extends BaseGrammarInstruction<'container'> {
    readonly size: Size | undefined;
    readonly content: ReadonlyArray<GrammarInstruction>;
}

export interface RepeatGrammarInstruction extends BaseGrammarInstruction<'repeat'> {
    readonly until: ReadonlyArray<GrammarInstruction>;
    readonly do: ReadonlyArray<GrammarInstruction>;
}

export interface IfGrammarInstruction extends BaseGrammarInstruction<'if'> {
    readonly condition: string;
    readonly then: ReadonlyArray<GrammarInstruction>;
}

export interface TrailerGrammarInstruction extends BaseGrammarInstruction<'trailer'> {
}

export type GrammarInstruction = FixedGrammarInstruction | ContainerGrammarInstruction | RepeatGrammarInstruction| IfGrammarInstruction | TrailerGrammarInstruction;
