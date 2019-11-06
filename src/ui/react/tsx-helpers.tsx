import * as React from 'react';

export interface IfProps {
    cond: boolean;
}

export function If(props: React.PropsWithChildren<IfProps>) {
    return <React.Fragment>{props.cond ? props.children : undefined}</React.Fragment>;
}