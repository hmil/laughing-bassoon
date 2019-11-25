import * as React from 'react';
import { analyzeFile, editGrammarNode } from 'ui/state/AppActions';
import { AppActions } from 'ui/state/AppReducer';
import { callback, memo } from 'ui/react/hooks';
import { If } from 'ui/react/tsx-helpers';
import { Button } from 'ui/widgets/Button';
import { TextInput } from 'ui/widgets/TextInput';

import { Select } from '../widgets/Select';
import { ValueGrammarElement } from 'ui/domain/grammar/Grammar';
import { UiAnalyzerService } from 'ui/services/ui-analyzer-service';
import { ServicesContext } from 'ui/ServicesContext';

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

interface ValueEditorHeaderProps {
    value: ValueGrammarElement;
    dispatch: React.Dispatch<AppActions>;
    availableCodecs: string[];
}

const onChangeCallback = callback((dispatch: React.Dispatch<AppActions>, analyzer: UiAnalyzerService) => (elem: ValueGrammarElement) => {
    dispatch(editGrammarNode(elem));
    dispatch(analyzeFile(analyzer));
});

const onNameChangeCallback = callback((value: ValueGrammarElement, onChange: (elem: ValueGrammarElement) => void) =>
    (newName: string) => onChange({
        ...value,
        ref: newName
    })
);
const onSizeChangeCallback = callback((value: ValueGrammarElement, onChange: (elem: ValueGrammarElement) => void) =>
    (newSize: string) => onChange({
        ...value,
        size: {
            unit: value.size.unit,
            value: newSize
        }
    })
);
const onStartEditNameCallback = callback((setState: (state: { editName: boolean }) => void) => (evt: React.MouseEvent) => {
    evt.preventDefault();
    evt.stopPropagation();

    setState({
        editName: true
    });
});

const useAvailableCodecs = memo((availableCodecs: string[]) => ['-'].concat(availableCodecs));

const STYLE_SIZE_LABEL: React.CSSProperties = {
    textAlign: 'right'
};
const STYLE_BIT_BUTTON: React.CSSProperties = {
    width: '17px',
    height: '100%',
    padding: '2px'
};

export const ValueEditorHeader = React.memo(function _ValueEditorHeader({value, dispatch, availableCodecs}: ValueEditorHeaderProps) {

    const [ editorState, setEditorState ] = React.useState({ editName: false });

    const { analyzer } = React.useContext(ServicesContext);
    const onChange = onChangeCallback(dispatch, analyzer);
    const onNameChange = onNameChangeCallback(value, onChange);
    const onSizeChange = onSizeChangeCallback(value, onChange);    
    const onStartEditName = onStartEditNameCallback(setEditorState);
    const allAvailableCodecs = useAvailableCodecs(availableCodecs);

    const isBits = value.size.unit === 'bit';

    const onCodecChange = React.useCallback((v: string) => {
        onChange({ ...value, codec: stringAsCodec(v)});
    }, [value, onChange]);

    const onToggleBitMode = React.useCallback((evt: React.MouseEvent) => {
        evt.preventDefault();
        evt.stopPropagation();
        onChange({
            ...value,
            size: {
                value: value.size.value,
                unit: value.size.unit === 'bit' ? 'byte' : 'bit'
            }
        });
    }, [value, onChange]);

    return <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            height: '100%'
        }}>
            <If cond={editorState.editName === false}>
                <div style={{
                        flexGrow: 1
                    }}>
                    <span onDoubleClick={onStartEditName} style={{
                        cursor: 'text'
                    }}>
                        {value.ref || '<value>'} 
                    </span>
                </div>
            </If>
            <If cond={editorState.editName === true}>
                <div style={{
                    flexGrow: 1
                }}>
                    <TextInput value={value.ref || ''} 
                        onChange={onNameChange}
                        onBlur={ () => setEditorState({ editName: false}) }
                        focus></TextInput>
                </div>
            </If>
            <div style={{width: '80px', marginLeft: '5px', flexShrink: 0}}>
                {/* TODO: If value is an expression, flexGrow this field and align to the left. */}
                <TextInput style={STYLE_SIZE_LABEL} value={value.size.value} onChange={onSizeChange}></TextInput>
            </div>
            <div style={{marginRight: '5px', marginLeft: '1px', flexShrink: 0}}>
                <Button style={STYLE_BIT_BUTTON} size='sm' value={isBits ? 'b' : 'B'} active={isBits} onClick={onToggleBitMode}></Button>
            </div>
            <div style={{width: '120px', margin: '0 5px', flexShrink: 0}}>
                <Select onChange={onCodecChange} options={allAvailableCodecs} value={codecAsString(value.codec)}></Select>
            </div>
    </div>;
});
