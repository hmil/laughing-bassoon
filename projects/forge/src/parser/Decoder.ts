import { Either, left, right } from 'fp-ts/lib/Either';
import { Codec } from './model/core/Codec';

function str(data: Uint8Array) {
    let utf8decoder = new TextDecoder();
    return utf8decoder.decode(data);
}

export class Decoder {

    public decode(data: Uint8Array, codec?: Codec): Either<string, number> {
        // Dummy implementation: Decode little-endian numbers

        if (codec != null) {
            const decodingFn = new Function('value', 'str', `return ${codec.decode}`);
            try {
                return right(decodingFn(data, str));
            } catch (e) {
                return left(e);
            }
        }

        return this.decodeAsLittleEndianNumeral(data);
    }

    private decodeAsLittleEndianNumeral(data: Uint8Array): Either<string, number> {
        if (data.length > 4) {
            return left("Can't decode numbers larger than 32 bit long.");
        }

        let acc = 0;
        for (let i = 0 ; i < data.length ; i++) {
            acc += data[i] << i;
        }
        return right(acc);
    }
}
