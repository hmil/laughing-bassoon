import * as React from 'react';
import * as ReactDOM from 'react-dom';

export function OverlayPortal(props: React.PropsWithChildren<{}>) {
    const el = document.createElement("div");

    React.useEffect(() => {
        document.body.appendChild(el);
        return () => {
            document.body.removeChild(el);
        }
    }, []);

    return ReactDOM.createPortal(props.children, el);
}