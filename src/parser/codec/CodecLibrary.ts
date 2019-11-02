import { Codec } from './Codec';
import { CodecModel } from '../model/core/CodecModel';
import { CustomCodec } from './CustomCodec';

export class CodecLibrary {

    private codecs: Map<string, Codec> = new Map();

    public resolve(key: string | CodecModel | undefined): Codec | null {
        if (key === undefined) {
            return null;
        }
        if (typeof key === 'string') {
            const codec = this.codecs.get(key);
            if (codec == null) {
                throw new Error(`Unknown codec: ${key}`);
            }
            return codec;
        }

        return new CustomCodec(key);
    }

    public registerCodec(name: string, codec: Codec) {
        if (this.codecs.has(name)) {
            throw new Error(`Redefinition of codec ${name}`);
        }
        this.codecs.set(name, codec);
    }
}