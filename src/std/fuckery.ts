
/**
 * Compile-time check making sure a switch statement is exhaustive.
 */
export function checkExhaustiveSwitch(a: "Error: Is this switch statement missing a case?"): never {
    throw new Error(`Invalid data type in program: "${a}"`);
}
