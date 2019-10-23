/**
 * Abstract Binary Tree - kind of an Abstract Syntax Tree (AST) but for binary files.
 */
export interface BaseAbtNode<Type extends string> {
    id: number;
    type: Type;
    start: number;
    end: number;
    children?: AbtNode[];
}


export type AbtNode = GenericAbtNode;

/**
 * This is a placeholder node type to get the ball running on the UI side since I don't know
 * yet exactly what the Abt is gonna look like.
 */
export interface GenericAbtNode extends BaseAbtNode<'generic'> {
    name: string;
}

export interface AbtRoot extends BaseAbtNode<'root'> {
    children: Array<AbtNode>;
}
