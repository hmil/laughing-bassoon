import * as React from 'react';

import { FixedField } from '../../parser/model';
import { Select } from '../widgets/Select';
import { AppContext } from 'state/AppContext';
import { TextInput } from 'ui/widgets/TextInput';
import { Button } from 'ui/widgets/Button';

function codecAsString(codec: string | undefined): string {
    if (codec == null) {
        return '-';
    } else {
        return codec;
    }
}

function stringAsCodec(value: string): string | undefined {
    if (value === '-') {
        return undefined;
    } else {
        return value;
    }
}

interface FixedFieldEditorHeaderProps {
    value: FixedField;
    onChange: (v: FixedField) => void;
}

function getSize(value: FixedField) {
    return 'size' in value ? `${value.size}` : `${value.bitSize}`;
}

export function FixedFieldEditorHeader({value, onChange}: FixedFieldEditorHeaderProps) {

    const { state } = React.useContext(AppContext);

    const [ editorState, setEditorState ] = React.useState({ editName: false });

    const isBits = 'bitSize' in value;

    const onCodecChange = React.useCallback((v: string) => {
        onChange({ ...value, codec: stringAsCodec(v)});
    }, [value, onChange]);

    const onToggleBitMode = React.useCallback((evt: React.MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        if ('bitSize' in value) {
            const clone = { ...value };
            delete clone.bitSize;
            (clone as any).size = value.bitSize;
            onChange(clone);
        } else {
            const clone = { ...value };
            delete clone.size;
            (clone as any).bitSize = value.size;
            onChange(clone);
        }
    }, [value, onChange]);

    const startEditName = React.useCallback((evt: React.MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();

        setEditorState({
            editName: true
        });
    }, [setEditorState]);

    return <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
        }}>
            { editorState.editName === false ?
                <div 
                    onDoubleClick={startEditName}
                    style={{
                        flexGrow: 1
                    }}>
                    {value.name} 
                </div> :
                <div style={{
                    flexGrow: 1
                }}>
                    <TextInput value={value.name} 
                        onChange={newName => onChange({
                            ...value,
                            name: newName
                        })} 
                        onBlur={ () => setEditorState({ editName: false}) }></TextInput>
                </div>
            }
            
            <div style={{width: '80px', marginLeft: '5px', flexShrink: 0}}>
                {/* TODO: If value is an expression, flexGrow this field and align to the left. */}
                <TextInput style={{ textAlign: 'right' }} value={getSize(value)} onChange={newSize => onChange({
                    ...value,
                    [isBits ? 'bitSize' : 'size']: newSize
                })}></TextInput>
            </div>
            <div style={{marginRight: '5px', marginLeft: '1px', height: '100%', flexShrink: 0}}>
                <Button style={{ width: '17px', height: '100%', padding: '2px' }} size='sm' value={isBits ? 'b' : 'B'} active={isBits} onClick={onToggleBitMode}></Button>
            </div>
            <div style={{width: '120px', margin: '0 5px'}}>
                <Select onChange={onCodecChange} options={['-'].concat(state.availableCodecs)} value={codecAsString(value.codec)}></Select>
            </div>
    </div>;
}
