
type ComputeFunction = (resolvedVariables: Map<string, number>) => number;


export class Expression {

    public readonly variables: string[];

    private _compute: (resolvedVariables: Map<string, number>) => number;

    constructor(public readonly expression: string) {
        const { compute, variables } = this.parseExpression();
        this.variables = variables;
        this._compute = compute;
    }

    public compute(resolvedVariables: Map<string, number>): number {
        return this._compute(resolvedVariables);
    }

    private parseExpression(): { compute: ComputeFunction, variables: string[]} {

        // strawman implementation: just support binary operations

        const match = this.expression.match(/^\s*(\$[a-zA-Z][a-zA-Z0-9]+|\d+)\s*(?:([%+-/])\s*(\$[a-zA-Z][a-zA-Z0-9]+|\d+))?\s*$/);

        if (!match) {
            throw new Error(`Bad expression: ${this.expression}`);
        }
        const lhs = match[1];
        const operator = match[2];
        const rhs = match[3];

        let variables = [];
        if (isVariable(lhs)) {
            variables.push(lhs.substr(1));
        }
        if (isVariable(rhs)) {
            variables.push(rhs.substr(1));
        }

        const compute: ComputeFunction = (vars) => {
            if (operator == null) {
                return resolve(vars, lhs);
            }
            const left = resolve(vars, lhs);
            const right = resolve(vars, rhs);
            switch (operator) {
                case '%':
                    return left % right;
                case '+':
                    return left + right;
                case '-':
                    return left - right;
                case '/':
                    return ~~(left / right);
                default:
                    throw new Error(`Unsupported operator: ${operator}`);
            }
        }

        return { variables, compute };
    }
}

function resolve(vars: Map<string, number>, expr: string): number {
    if (isVariable(expr)) {
        const resolved = vars.get(expr.substr(1));
        if (resolved == null) {
            throw new Error(`Variable not resolved: ${expr}!`);
        }
        return resolved;
    }
    return parseInt(expr, 10);
}
function isVariable(s: string | undefined) {
    if (s == null) {
        return false;
    }
    const char0 = s.charCodeAt(0);
    return !(48 <= char0 && char0 <= 57);
}