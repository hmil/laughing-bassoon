import * as React from 'react';
import { Button } from './widgets/Button';
import { COLOR_BG_2 } from './styles/colors';

export interface ToolbarProps {
    title: string;
}

export function Toolbar(props: ToolbarProps) {

    return <div
        style={{
            backgroundColor: COLOR_BG_2,
            padding: '5px',
            height: '30px',
            boxShadow: 'rgba(0, 0, 0, 0.29) 0px 6px 7px 0px',
            zIndex: 100,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            fontSize: '14px'
        }}>
            <div>
                <Button value="Open" onClick={() => {}} />
                {/* actions */}
            </div>
            <div style={{
                padding: '4px'
            }}>{props.title}</div>
            <div>
                {/* {spacer} */}
            </div>
    </div>;
}
