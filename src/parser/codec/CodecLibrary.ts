import { Codec } from './Codec';

export class CodecLibrary {

    private codecs: Map<string, Codec> = new Map();

    public resolve(key: string | undefined): Codec | null {
        if (key === undefined) {
            return null;
        }

        const codec = this.codecs.get(key);
        if (codec == null) {
            throw new Error(`Unknown codec: ${key}`);
        }
        return codec;
    }

    public getAllCodecNames(): string[] {
        return Array.from(this.codecs.keys());
    }

    public registerCodec(name: string, codec: Codec) {
        if (this.codecs.has(name)) {
            throw new Error(`Redefinition of codec ${name}`);
        }
        this.codecs.set(name, codec);
    }
}