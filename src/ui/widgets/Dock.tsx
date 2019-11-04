import * as React from 'react';
import { H_LINE_BOTTOM } from '../styles/relief';

export interface DockProps {
    side: 'left' | 'right';
    title: string;
}

export function Dock(props: React.PropsWithChildren<DockProps>) {

    const [width, setWidth] = React.useState(400);

    const dockRef = React.useRef<HTMLDivElement>(null);

    function startDrag(evt: React.MouseEvent) {
        if (evt.button !== 0) return;
        evt.preventDefault();
        const startX = evt.clientX;

        function onMove(evt: MouseEvent) {
            setWidth(width + (props.side === 'left' ? 1 : -1) * (evt.clientX - startX));
        }

        function onUp(_evt: MouseEvent) {
            window.removeEventListener('mouseup', onUp);
            window.removeEventListener('mousemove', onMove);
            if (dockRef.current == null) {
                return;
            }
            setWidth(dockRef.current.clientWidth);
        }

        window.addEventListener('mouseup', onUp);
        window.addEventListener('mousemove', onMove);
    }

    const resizerPosition = props.side === 'left' ?
        { right: '0px', marginRight: '-2px' } :
        { left: '0px', marginLeft: '-1px' };

    return <div ref={dockRef} style={{
        width: `${width}px`,
        position: 'relative',
        backgroundColor: '#2f2f2f',
        boxShadow: 'rgba(255, 255, 255, 0.09) 0 1px 1px 0px inset, #00000047 0 2px 4px 1px',
        zIndex: 200,
        marginTop: '2px',
        borderRadius: '3px',
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column'
    }}>
        <div style={{
            position: 'absolute',
            width: '3px',
            height: '100%',
            cursor: 'ew-resize',
            ...resizerPosition
        }}
        onMouseDown={startDrag}></div>
        <h2 style={{
                padding: '10px 12px',
                margin: 0,    
                fontSize: '16px',
                fontWeight: 600,
                ...H_LINE_BOTTOM
            }}>{props.title}</h2>
        <div style={{
            height: "100%",
            flexShrink: 1,
            overflow: "auto"
        }}>
            {props.children}
        </div>
    </div>;
}