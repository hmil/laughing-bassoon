
import { CodecLibrary } from './CodecLibrary';
import { IntCodec } from './IntCodec';
import { CustomCodec } from './CustomCodec';
import { CStringCodec } from './CStringCodec';
import { ParserCodec } from 'parser/domain/Grammar';

export function createCodecLibrary(definition: ParserCodec[] | undefined) {
    const library = new CodecLibrary();

    // Register built-in codecs.
    library.registerCodec('int', new IntCodec());
    library.registerCodec('cstring', new CStringCodec());

    // Register custom codecs.
    if (definition != null) {
        definition.forEach(c => library.registerCodec(c.name, new CustomCodec(c)));
    }

    return library;
}