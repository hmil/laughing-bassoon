import * as React from 'react';
import { COLOR_BG_1, COLOR_TEXT_MAIN, COLOR_BG_0 } from 'ui/styles/colors';

export interface TextInputProps {
    value: string;
    onChange?: (value: string) => void;
    onBlur?: () => void;
    style?: React.CSSProperties;
    focus?: boolean;
}

export const TextInput = React.memo(function _TextInput(props: TextInputProps) {

    const [value, setValue] = React.useState(props.value);
    let cancelled = false;

    const ref = React.createRef<HTMLInputElement>();

    React.useEffect(() => {
        if (ref.current != null && props.focus === true) {
            ref.current.focus();
        }
    }, [props.focus, ref.current])

    function onBlur() {
        if (props.onBlur) {
            props.onBlur();
        }
        if (props.onChange && !cancelled) {
            props.onChange(value);
        } else {
            setValue(props.value);
        }
    }

    function onKeyDown(evt: React.KeyboardEvent) {
        if (evt.key === 'Enter') {
            (evt.target as HTMLInputElement).blur();
        } else if (evt.key === 'Escape') {
            setValue(props.value);
            cancelled = true;
            (evt.target as HTMLInputElement).blur();
        }
    }

    return <input 
        style={{
            backgroundColor: COLOR_BG_1,
            color: COLOR_TEXT_MAIN,
            border: `1px ${COLOR_BG_0} solid`,
            padding: `2px 5px`,
            fontSize: 'inherit',
            outline: 'none',
            width: '100%',
            ...props.style
        }}
        type="text"
        ref={ref}
        value={value}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onChange={evt => setValue(evt.target.value)} />
});