import { Codec } from './Codec';
import { Either, left, right } from 'fp-ts/lib/Either';

export class IntCodec implements Codec {
    public decode(data: Uint8Array): Either<string, number> {
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