import * as React from "react";

export const TreeViewLabel = React.memo(function _TreeViewLabel(props: React.PropsWithChildren<{}>) {
    return <div style={{
        display: 'inline-block',
        padding: '6px 0'
    }}>{props.children}</div>
});
