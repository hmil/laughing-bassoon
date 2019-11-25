import * as yaml from 'js-yaml';
import { pipe } from 'fp-ts/lib/pipeable';
import { fold } from 'fp-ts/lib/Either';
import { reporter } from 'io-ts-reporters';
import { ParserGrammar, dslToGrammar } from 'parser/domain/Grammar';
import { ParserDefinition } from 'parser/dsl';

export function loadSchema(src: string): Promise<ParserGrammar> {
    return new Promise((resolve, reject) => {
        var xhr = new XMLHttpRequest();
        xhr.open('get', src, true);
        xhr.responseType = 'text'
        xhr.onreadystatechange = () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    const json = yaml.safeLoad(xhr.response, {
                        filename: src,
                        schema: yaml.DEFAULT_FULL_SCHEMA
                    });
                    const parsed = ParserDefinition.decode(json);
                    pipe(
                        parsed,
                        fold(
                            _ => reject(reporter(parsed).join('\n')),
                            dsl => resolve(dslToGrammar(dsl))
                        )
                    );
                } else {
                    reject(`Network error ${xhr.status}`);
                }
            }
        }
        xhr.send();
    });
}