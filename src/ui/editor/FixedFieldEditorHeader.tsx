import * as React from 'react';

import { FixedField } from '../../parser/model';
import { CodecModel } from '../../parser/model/core/CodecModel';
import { Select } from '../widgets/Select';

function codecAsString(codec: string | CodecModel | undefined) {
    if (codec == null) {
        return '-';
    } else if (typeof codec === 'string') {
        return codec;
    } else {
        return 'custom';
    }
}

const codecOptions = [
    'cstring',
    'octal',
    'integer',
    '-'
];

interface FixedFieldEditorHeaderProps {
    value: FixedField;
    onChange: (v: FixedField) => void;
}

export function FixedFieldEditorHeader({value, onChange}: FixedFieldEditorHeaderProps) {

    function onCodecChange(v: string) {
        onChange({ ...value, value: v});
    }

    return <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
            {value.name} 
            <div style={{width: '150px'}}>
                <Select onChange={onCodecChange} options={codecOptions} value={codecAsString(value.value)}></Select>
            </div>
    </div>;
}
