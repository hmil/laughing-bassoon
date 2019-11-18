import * as React from 'react';
import { COLOR_BG_0, COLOR_HIGHLIGHT, COLOR_TEXT_MAIN, COLOR_TEXT_HIGHLIGHT, COLOR_BG_2, COLOR_BG_3, COLOR_HIGHLIGHT_BRIGHTER, COLOR_BG_4 } from 'ui/styles/colors';
import { memo } from 'ui/react/hooks';

export interface ButtonProps {
    value: string;
    active?: boolean;
    onClick: (evt: React.MouseEvent) => void;
    size?: 'lg' | 'md' | 'sm';
    style?: React.CSSProperties;
    tooltip?: string;
}

const fontSizeChart = {
    'lg': '20px',
    'md': '16px',
    'sm': '12px'
}

export const Button = React.memo(function _Button(props: ButtonProps) {

    const [ isHover, setHover ] = React.useState(false);

    return <button
        onClick={props.onClick}
        onMouseOver={React.useCallback(() => setHover(true), [])}
        onMouseOut={React.useCallback(() => setHover(false), [])}
        title={props.tooltip}
        style={buttonStyle(isHover, props.active || false, props.style, props.size || 'md')}>{props.value}</button>;
});

const buttonStyle = memo((isHover: boolean, isActive: boolean, defaultStyle: React.CSSProperties | undefined, size: 'lg' | 'md' | 'sm'): React.CSSProperties => {
    const color1 = isActive ? COLOR_HIGHLIGHT : isHover ? COLOR_BG_3 : COLOR_BG_2;
    const color2 = isActive ? COLOR_HIGHLIGHT_BRIGHTER : isHover ? COLOR_BG_4 : COLOR_BG_3;
    const textColor = isActive ? COLOR_TEXT_HIGHLIGHT : COLOR_TEXT_MAIN;
    
    return {
        backgroundColor: color1,
        color: textColor,
        border: `1px ${COLOR_BG_0} solid`,
        borderRadius: '2px',
        outline: 'none',
        boxShadow: '0px 1px 1px #ffffff10 inset',
        background: `linear-gradient(0deg, ${color1} 30%, ${color2} 60%)`,
        fontSize: fontSizeChart[size],
        ...defaultStyle
    };
});
