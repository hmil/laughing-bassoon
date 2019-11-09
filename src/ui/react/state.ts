
export function derivedState<P, D>(factory: (nextProps: P, prevProps: P | undefined, last: D | undefined) => D) {

    let memo: { lastValue: D, lastProps: P } | undefined;

    return (props: P) => {
        if (memo !== undefined && compareObjects(props, memo.lastProps) === true) {
            return memo.lastValue;
        }
        memo = {
            lastProps: props,
            lastValue: factory(props, memo && memo.lastProps, memo && memo.lastValue)
        }
        return memo.lastValue;
    }
}

function compareObjects<T extends {}>(a: T, b: T) {
    for(var key in a) {
        if(!(key in b) || a[key] !== b[key]) {
            return false;
        }
    }
    for(var key in b) {
        if(!(key in a) || a[key] !== b[key]) {
            return false;
        }
    }
    return true;
}
