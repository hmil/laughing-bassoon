import * as React from 'react';

export function Toolbar() {

    return <div
        style={{
            backgroundColor: '#212121',
            padding: '5px',
            height: '30px'
        }}>
        <button type="button">
            Import
        </button>
        <button type="button">
            Export
        </button>
    </div>;
}
