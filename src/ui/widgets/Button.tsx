import * as React from 'react';
import { COLOR_BG_1, COLOR_BG_0, COLOR_HIGHLIGHT, COLOR_TEXT_MAIN, COLOR_TEXT_HIGHLIGHT } from 'ui/styles/colors';

export interface ButtonProps {
    value: string;
    active?: boolean;
    onClick: (evt: React.MouseEvent) => void;
    size?: 'lg' | 'md' | 'sm';
    style?: React.CSSProperties;
}

const fontSizeChart = {
    'lg': '20px',
    'md': '16px',
    'sm': '12px'
}

export function Button(props: ButtonProps) {
    const size = props.size || 'md';
    return <button
        onClick={props.onClick}
        style={{
            backgroundColor: props.active ? COLOR_HIGHLIGHT : COLOR_BG_1,
            color: props.active ? COLOR_TEXT_HIGHLIGHT : COLOR_TEXT_MAIN,
            border: `1px ${COLOR_BG_0} solid`,
            outline: 'none',
            fontSize: fontSizeChart[size],
            ...props.style
        }}>{props.value}</button>;
}