import * as React from 'react';
import { HexViewContext } from './Context';
import { setSelection } from './HexViewActions';

const lineHeight = 15;

function hexViewOffset(props: { offset: number, addressBits: number }) {
    const addressSize = props.addressBits / 4;
    const pad = new Array(addressSize).fill(0).join('');

    return `0x${(pad + props.offset.toString(16) + '0').substr(-addressSize)}`;
}

export function HexViewOffsets(props: { from: number, length: number }) {

    const [isDragging, setIsDragging] = React.useState(false);
    const containerRef = React.createRef<HTMLDivElement>();
    const {state, dispatch, getCurrentScroll} = React.useContext(HexViewContext);

    function startSelection(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        if (evt.button !== 0) return;
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop + getCurrentScroll()) + props.from;
        dispatch(setSelection({
            anchor: offset,
            drag: offset + 15
        }));
        setIsDragging(true);
    }

    function moveSelection(evt: React.MouseEvent<HTMLDivElement, MouseEvent>) {
        evt.preventDefault();
        const currentRef = containerRef.current;
        if (currentRef == null) {
            return;
        }
        if (!isDragging) {
            return;
        }
        const offset = mapCoordinatesToOffset(evt.clientX - currentRef.offsetLeft, evt.clientY - currentRef.offsetTop + getCurrentScroll()) + props.from;

        const anchor = (state.selection.anchor <= offset && state.selection.anchor % 16 !== 0) ? state.selection.anchor + 1 : 
                    (state.selection.anchor > offset && state.selection.anchor % 16 === 0) ? state.selection.anchor - 1 :
                    state.selection.anchor;
        const drag = state.selection.anchor <= offset ? offset + 15 : offset;

        dispatch(setSelection({ anchor, drag }));
    }

    function stopSelection() {
        setIsDragging(false);
    }

    const textContent = React.useMemo(() => {
        const numberOfLines = Math.ceil(props.length / 16);
        const startOffset = Math.floor(props.from / 16);
        return new Array(numberOfLines)
            .fill(0)
            .map((_, i) => hexViewOffset({ addressBits: 32, offset: startOffset + i }))
            .join('\n')
    }, [props]);

    return (
        <div    className="offset" 
                ref={containerRef}
                onMouseDown={startSelection}
                onMouseMove={moveSelection}
                onMouseUp={stopSelection}
                style={{
                    paddingLeft: '4ch',
                    paddingRight: '0.5ch',
                    whiteSpace: 'pre',
                    color: '#aaa'
                }}>
            { textContent }
        </div>
    );
}

function mapCoordinatesToOffset(_x: number, y: number) {
    const line = Math.floor(y / lineHeight); 

    return line * 16;
}