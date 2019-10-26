import { Codec } from './Codec';
import { Either, left, right } from 'fp-ts/lib/Either';

export class CStringCodec implements Codec {
    public decode(data: Uint8Array): Either<string, string> {
        let utf8decoder = new TextDecoder();
        return right(utf8decoder.decode(data.slice(0, Math.min(data.length, 4096))));
    }
}