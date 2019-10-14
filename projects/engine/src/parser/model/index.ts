/**
 * This is the only entry point of the model. Direct access to other elements in this 
 * directory may cause weird type or runtime errors. 
 */

export { Parser } from './Parser';

// Parser elements
export { ConstField } from './elements/ConstField';
export { FixedField } from './elements/FixedField';
export { Flags } from './elements/Flags';
export { If } from './elements/If';

// Misc
export { Container } from './core/Container';
