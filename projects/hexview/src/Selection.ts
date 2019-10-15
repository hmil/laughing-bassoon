
export function makeSelection() {
    return {
        anchor: 0,
        drag: 0
    };
}
export type Selection = ReturnType<typeof makeSelection>;
