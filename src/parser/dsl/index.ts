/**
 * This is the only entry point of the model. Direct access to other elements in this 
 * directory may cause weird type or runtime errors. 
 */

export { ParserDefinition } from './ParserDefinition';

// Parser elements
export { Flags } from './elements/Flags';
export { IfField } from './elements/IfField';
export { ContainerField } from './elements/ContainerField';
export { Repeat } from './elements/Repeat';

// Misc
export { Container } from './core/Container';
export { AnyElement } from './AnyElement';
