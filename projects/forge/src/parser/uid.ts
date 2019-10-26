
export const uniqId = (() => {
    let counter = 0;
    return () => counter++;
})();
