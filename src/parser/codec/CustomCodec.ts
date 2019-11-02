import { Codec } from "./Codec";
import { CodecModel } from "../model/core/CodecModel";
import { right, left, Either } from "fp-ts/lib/Either";

type DecodingFn = (value: Uint8Array, str:(data: Uint8Array) => string) => number;

function str(data: Uint8Array) {
    let utf8decoder = new TextDecoder();
    return utf8decoder.decode(data);
}

export class CustomCodec implements Codec {

    private readonly decodingFn: DecodingFn;
    
    constructor(model: CodecModel) {
        this.decodingFn = new Function('value', 'str', `return ${model.decode}`) as DecodingFn;
    }

    decode(data: Uint8Array): Either<string, number> {
        try {
            return right(this.decodingFn(data, str));
        } catch (e) {
            return left(e);
        }
    }
}