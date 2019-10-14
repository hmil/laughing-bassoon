import * as React from 'react';

function byteToAscii(c: number) {
    if (c >= 0x20 && c < 0x7f) {
        return String.fromCharCode(c);
    } else {
        return '.';
    }
}

function formatAsciiLine(line: Uint8Array) {
    let acc = '';
    for (let i = 0 ; i < line.length ; i++) {
        acc += byteToAscii(line[i]);
    }
    return acc;
}

export function HexViewAscii(props: { data: Uint8Array }) {
    const numberOfLines = Math.ceil(props.data.length / 16);
    return (
        <div className="asciiData" style={{
            padding: '0 1ch',
            borderLeft: '1px #eee solid',
            whiteSpace: 'pre'
        }}>{new Array(numberOfLines).fill(0)
            .map((_, i) => formatAsciiLine(props.data.slice(i * 16, (i + 1) * 16 )))
            .join('\n')
        }</div>
    );
}