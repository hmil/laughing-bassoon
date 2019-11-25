import * as React from 'react';
import { COLOR_HIGHLIGHT, COLOR_TEXT_MAIN, COLOR_TEXT_HIGHLIGHT, COLOR_BG_2 } from '../styles/colors';

export interface SelectProps {
    value: string;
    options: string[];
    onChange: (val: string) => void;
}

const selectDefaultState = {
    opened: false
};

function SelectOption({value, onSelect}: { value: string, onSelect: (v: string) => void }) {
    const [ state, setState ] = React.useState({ hover: false });

    return <div 
        onMouseOver={() => setState({ hover: true })}
        onMouseOut={() => setState({ hover: false })}
        onClick={(evt) => {
            evt.preventDefault();
            onSelect(value);
        }}
        style={{
            padding: '2px 5px',
            backgroundColor: state.hover === true ? COLOR_HIGHLIGHT : '',
            color: state.hover === true ? COLOR_TEXT_HIGHLIGHT : COLOR_TEXT_MAIN
        }}>{value}</div>
}

export const Select = React.memo(function _Select(props: SelectProps) {

    const [state, setState] = React.useState(selectDefaultState);

    function onClick(evt: React.MouseEvent) {
        evt.stopPropagation();
        setState({
            opened: !state.opened
        });
    }

    return <div style={{
        position: 'relative',
        border: '1px #1a1a1a solid',
        padding: '2px 0px',
        cursor: 'default',
        backgroundColor: '#212121',
        width: '100%',
        color: COLOR_TEXT_MAIN
    }}
        onClick={onClick}>
        { state.opened ? <div>
            <div style={{
                position: 'fixed',
                height: '100vh',
                width: '100vw',
                top: 0,
                left: 0,
                backgroundColor: '#00000060',
                zIndex: 1000
            }}></div>
            <div style={{
                position: 'absolute',
                zIndex: 1050,
                top: 'calc(100% + 1px)',
                left: '-1px',
                backgroundColor: COLOR_BG_2,
                width: 'calc(100% + 2px)',
                boxShadow: '0px 2px 3px #0000005e'
            }}>
                { props.options.map(o => <SelectOption key={o} value={o} onSelect={props.onChange}></SelectOption>) }
            </div>
        </div>: undefined}
        <div style={{
            position: 'absolute',
            right: '5px'
        }}>
            &#9662;
        </div>
        <div style={{
            marginRight: '15px',
            padding: '0 5px'
        }}>
            {props.value}
        </div>
    </div>;
});
