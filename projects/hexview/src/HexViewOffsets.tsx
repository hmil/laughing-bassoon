import * as React from 'react';

function hexViewOffset(props: { offset: number, addressBits: number }) {
    const addressSize = props.addressBits / 4;
    const pad = new Array(addressSize).fill(0).join('');

    return `0x${(pad + props.offset.toString(16) + '0').substr(-addressSize)}`;
}

export function HexViewOffsets(props: { from: number, length: number }) {
    const numberOfLines = Math.ceil(props.length / 16);
    const startOffset = Math.floor(props.from / 16);
    return (
        <div className="offset" style={{
            paddingLeft: '4ch',
            paddingRight: '0.5ch',
            whiteSpace: 'pre',
            color: '#aaa'
        }}>
            {
                new Array(numberOfLines)
                .fill(0)
                .map((_, i) => hexViewOffset({ addressBits: 64, offset: startOffset + i }))
                .join('\n')
            }
        </div>
    );
}
