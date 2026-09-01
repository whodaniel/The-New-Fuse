/**
 * A restricted expression evaluator for workflow condition nodes.
 *
 * `condition-node.tsx` invites users to write "a JavaScript expression that
 * evaluates to true or false" (e.g. `input.value > 10`), and that expression
 * is authored by whoever built the workflow — not necessarily whoever runs
 * it, and not necessarily trusted. This runs server-side, so `new Function()`
 * / `eval()` plus a regex denylist (the pattern already used client-side in
 * loop-node.tsx's "Test" button, which is an honest-enough safety net inside
 * a user's own browser tab) is not an acceptable server-side sandbox: denylists
 * are trivially bypassed via property-access tricks
 * (`this.constructor.constructor('return process')()`, bracket-notation
 * string-building, etc.), and a bypass here is remote code execution on the
 * API server, not just mischief in one tab.
 *
 * Instead of sandboxing a full JS interpreter, this implements a small
 * expression grammar that simply has no code-execution primitives to escape
 * with: no function declarations, no `new`, no assignment, no access to any
 * identifier other than the two bound roots, and method calls limited to a
 * fixed allowlist of pure, argument-safe string/array helpers. Safety comes
 * from the grammar's vocabulary, not from detecting dangerous input after
 * the fact.
 *
 * Supported syntax: literals (number, string, true/false/null/undefined),
 * `input`/`context` root identifiers, `.prop` / `[expr]` member access,
 * unary `!`/`-`, binary `+ - * / %`, comparison `== === != !== > >= < <=`,
 * logical `&& ||`, ternary `? :`, parens, and calls to the allowlisted
 * methods below on whatever value an expression already evaluates to.
 */

const ALLOWED_METHODS: Record<string, (self: unknown, args: unknown[]) => unknown> = {
  includes: (self, args) => {
    if (typeof self === 'string' || Array.isArray(self)) {
      return (self as string[] | string).includes(args[0] as never);
    }
    throw new EvalError('includes() is only supported on strings and arrays');
  },
  startsWith: (self, args) => {
    if (typeof self !== 'string') throw new EvalError('startsWith() is only supported on strings');
    return self.startsWith(String(args[0]));
  },
  endsWith: (self, args) => {
    if (typeof self !== 'string') throw new EvalError('endsWith() is only supported on strings');
    return self.endsWith(String(args[0]));
  },
  toLowerCase: (self) => {
    if (typeof self !== 'string') throw new EvalError('toLowerCase() is only supported on strings');
    return self.toLowerCase();
  },
  toUpperCase: (self) => {
    if (typeof self !== 'string') throw new EvalError('toUpperCase() is only supported on strings');
    return self.toUpperCase();
  },
  trim: (self) => {
    if (typeof self !== 'string') throw new EvalError('trim() is only supported on strings');
    return self.trim();
  },
};

export class ExpressionSyntaxError extends Error {}
export class ExpressionEvalError extends Error {}

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokenType = 'number' | 'string' | 'identifier' | 'punct' | 'eof';

interface Token {
  type: TokenType;
  value: string;
  pos: number;
}

const PUNCTUATION = [
  '===',
  '!==',
  '==',
  '!=',
  '>=',
  '<=',
  '&&',
  '||',
  '(',
  ')',
  '.',
  '[',
  ']',
  ',',
  '?',
  ':',
  '!',
  '+',
  '-',
  '*',
  '/',
  '%',
  '>',
  '<',
];

function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  const n = source.length;

  while (i < n) {
    const ch = source[i];

    if (/\s/.test(ch)) {
      i++;
      continue;
    }

    if (ch === '"' || ch === "'") {
      const quote = ch;
      let j = i + 1;
      let value = '';
      while (j < n && source[j] !== quote) {
        if (source[j] === '\\' && j + 1 < n) {
          const next = source[j + 1];
          value += next === 'n' ? '\n' : next === 't' ? '\t' : next;
          j += 2;
        } else {
          value += source[j];
          j++;
        }
      }
      if (j >= n) throw new ExpressionSyntaxError(`Unterminated string literal at position ${i}`);
      tokens.push({ type: 'string', value, pos: i });
      i = j + 1;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(source[i + 1] || ''))) {
      let j = i;
      while (j < n && /[0-9.]/.test(source[j])) j++;
      tokens.push({ type: 'number', value: source.slice(i, j), pos: i });
      i = j;
      continue;
    }

    if (/[A-Za-z_$]/.test(ch)) {
      let j = i;
      while (j < n && /[A-Za-z0-9_$]/.test(source[j])) j++;
      tokens.push({ type: 'identifier', value: source.slice(i, j), pos: i });
      i = j;
      continue;
    }

    const three = source.slice(i, i + 3);
    const two = source.slice(i, i + 2);
    if (PUNCTUATION.includes(three)) {
      tokens.push({ type: 'punct', value: three, pos: i });
      i += 3;
      continue;
    }
    if (PUNCTUATION.includes(two)) {
      tokens.push({ type: 'punct', value: two, pos: i });
      i += 2;
      continue;
    }
    if (PUNCTUATION.includes(ch)) {
      tokens.push({ type: 'punct', value: ch, pos: i });
      i += 1;
      continue;
    }

    throw new ExpressionSyntaxError(`Unexpected character '${ch}' at position ${i}`);
  }

  tokens.push({ type: 'eof', value: '', pos: n });
  return tokens;
}

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

type Node =
  | { kind: 'literal'; value: string | number | boolean | null | undefined }
  | { kind: 'identifier'; name: string }
  | { kind: 'member'; object: Node; property: Node; computed: boolean }
  | { kind: 'call'; callee: Node; args: Node[] }
  | { kind: 'unary'; op: '!' | '-'; argument: Node }
  | { kind: 'binary'; op: string; left: Node; right: Node }
  | { kind: 'logical'; op: '&&' | '||'; left: Node; right: Node }
  | { kind: 'conditional'; test: Node; consequent: Node; alternate: Node };

// ---------------------------------------------------------------------------
// Parser (recursive descent, precedence-climbing)
// ---------------------------------------------------------------------------

class Parser {
  private pos = 0;
  constructor(private tokens: Token[]) {}

  private peek(): Token {
    return this.tokens[this.pos];
  }

  private advance(): Token {
    return this.tokens[this.pos++];
  }

  private expectPunct(value: string): void {
    const t = this.advance();
    if (t.type !== 'punct' || t.value !== value) {
      throw new ExpressionSyntaxError(`Expected '${value}' at position ${t.pos}, got '${t.value}'`);
    }
  }

  private atPunct(value: string): boolean {
    const t = this.peek();
    return t.type === 'punct' && t.value === value;
  }

  parseProgram(): Node {
    const expr = this.parseTernary();
    if (this.peek().type !== 'eof') {
      throw new ExpressionSyntaxError(`Unexpected trailing input at position ${this.peek().pos}`);
    }
    return expr;
  }

  private parseTernary(): Node {
    const test = this.parseLogicalOr();
    if (this.atPunct('?')) {
      this.advance();
      const consequent = this.parseTernary();
      this.expectPunct(':');
      const alternate = this.parseTernary();
      return { kind: 'conditional', test, consequent, alternate };
    }
    return test;
  }

  private parseLogicalOr(): Node {
    let left = this.parseLogicalAnd();
    while (this.atPunct('||')) {
      this.advance();
      left = { kind: 'logical', op: '||', left, right: this.parseLogicalAnd() };
    }
    return left;
  }

  private parseLogicalAnd(): Node {
    let left = this.parseEquality();
    while (this.atPunct('&&')) {
      this.advance();
      left = { kind: 'logical', op: '&&', left, right: this.parseEquality() };
    }
    return left;
  }

  private parseEquality(): Node {
    let left = this.parseComparison();
    while (this.atPunct('===') || this.atPunct('!==') || this.atPunct('==') || this.atPunct('!=')) {
      const op = this.advance().value;
      left = { kind: 'binary', op, left, right: this.parseComparison() };
    }
    return left;
  }

  private parseComparison(): Node {
    let left = this.parseAdditive();
    while (this.atPunct('>') || this.atPunct('>=') || this.atPunct('<') || this.atPunct('<=')) {
      const op = this.advance().value;
      left = { kind: 'binary', op, left, right: this.parseAdditive() };
    }
    return left;
  }

  private parseAdditive(): Node {
    let left = this.parseMultiplicative();
    while (this.atPunct('+') || this.atPunct('-')) {
      const op = this.advance().value;
      left = { kind: 'binary', op, left, right: this.parseMultiplicative() };
    }
    return left;
  }

  private parseMultiplicative(): Node {
    let left = this.parseUnary();
    while (this.atPunct('*') || this.atPunct('/') || this.atPunct('%')) {
      const op = this.advance().value;
      left = { kind: 'binary', op, left, right: this.parseUnary() };
    }
    return left;
  }

  private parseUnary(): Node {
    if (this.atPunct('!') || this.atPunct('-')) {
      const op = this.advance().value as '!' | '-';
      return { kind: 'unary', op, argument: this.parseUnary() };
    }
    return this.parseCallOrMember();
  }

  private parseCallOrMember(): Node {
    let node = this.parsePrimary();
    for (;;) {
      if (this.atPunct('.')) {
        this.advance();
        const t = this.advance();
        if (t.type !== 'identifier') {
          throw new ExpressionSyntaxError(`Expected property name at position ${t.pos}`);
        }
        node = {
          kind: 'member',
          object: node,
          property: { kind: 'literal', value: t.value },
          computed: false,
        };
      } else if (this.atPunct('[')) {
        this.advance();
        const property = this.parseTernary();
        this.expectPunct(']');
        node = { kind: 'member', object: node, property, computed: true };
      } else if (this.atPunct('(')) {
        this.advance();
        const args: Node[] = [];
        if (!this.atPunct(')')) {
          args.push(this.parseTernary());
          while (this.atPunct(',')) {
            this.advance();
            args.push(this.parseTernary());
          }
        }
        this.expectPunct(')');
        node = { kind: 'call', callee: node, args };
      } else {
        break;
      }
    }
    return node;
  }

  private parsePrimary(): Node {
    const t = this.peek();

    if (t.type === 'number') {
      this.advance();
      return { kind: 'literal', value: Number(t.value) };
    }
    if (t.type === 'string') {
      this.advance();
      return { kind: 'literal', value: t.value };
    }
    if (t.type === 'identifier') {
      this.advance();
      if (t.value === 'true') return { kind: 'literal', value: true };
      if (t.value === 'false') return { kind: 'literal', value: false };
      if (t.value === 'null') return { kind: 'literal', value: null };
      if (t.value === 'undefined') return { kind: 'literal', value: undefined };
      return { kind: 'identifier', name: t.value };
    }
    if (this.atPunct('(')) {
      this.advance();
      const expr = this.parseTernary();
      this.expectPunct(')');
      return expr;
    }

    throw new ExpressionSyntaxError(`Unexpected token '${t.value}' at position ${t.pos}`);
  }
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

const ALLOWED_ROOTS = new Set(['input', 'context']);

function evaluate(node: Node, roots: Record<string, unknown>): unknown {
  switch (node.kind) {
    case 'literal':
      return node.value;

    case 'identifier':
      if (!ALLOWED_ROOTS.has(node.name)) {
        throw new ExpressionEvalError(
          `Unknown identifier '${node.name}' — only 'input' and 'context' are available`
        );
      }
      return roots[node.name];

    case 'member': {
      const objectValue = evaluate(node.object, roots);
      const key = node.computed
        ? (evaluate(node.property, roots) as string | number)
        : (node.property as { kind: 'literal'; value: string }).value;
      if (objectValue === null || objectValue === undefined) return undefined;
      if (typeof objectValue !== 'object' && typeof objectValue !== 'string') {
        throw new ExpressionEvalError(`Cannot read property '${key}' of ${typeof objectValue}`);
      }
      return (objectValue as Record<string, unknown>)[key as string];
    }

    case 'call': {
      if (node.callee.kind !== 'member') {
        throw new ExpressionEvalError('Only method calls (e.g. value.includes(x)) are supported');
      }
      const self = evaluate(node.callee.object, roots);
      const methodName = node.callee.computed
        ? String(evaluate(node.callee.property, roots))
        : (node.callee.property as { kind: 'literal'; value: string }).value;
      const method = ALLOWED_METHODS[methodName];
      if (!method) {
        throw new ExpressionEvalError(
          `Method '${methodName}' is not allowed. Allowed: ${Object.keys(ALLOWED_METHODS).join(', ')}`
        );
      }
      const args = node.args.map((a) => evaluate(a, roots));
      return method(self, args);
    }

    case 'unary': {
      const value = evaluate(node.argument, roots);
      if (node.op === '!') return !value;
      if (node.op === '-') return -Number(value);
      throw new ExpressionEvalError(`Unsupported unary operator '${node.op}'`);
    }

    case 'binary': {
      const left = evaluate(node.left, roots);
      const right = evaluate(node.right, roots);
      switch (node.op) {
        case '+':
          return (left as number) + (right as number);
        case '-':
          return (left as number) - (right as number);
        case '*':
          return (left as number) * (right as number);
        case '/':
          return (left as number) / (right as number);
        case '%':
          return (left as number) % (right as number);
        case '==':
          // eslint-disable-next-line eqeqeq
          return left == right;
        case '!=':
          // eslint-disable-next-line eqeqeq
          return left != right;
        case '===':
          return left === right;
        case '!==':
          return left !== right;
        case '>':
          return (left as number) > (right as number);
        case '>=':
          return (left as number) >= (right as number);
        case '<':
          return (left as number) < (right as number);
        case '<=':
          return (left as number) <= (right as number);
        default:
          throw new ExpressionEvalError(`Unsupported operator '${node.op}'`);
      }
    }

    case 'logical': {
      const left = evaluate(node.left, roots);
      if (node.op === '&&') return left ? evaluate(node.right, roots) : left;
      if (node.op === '||') return left ? left : evaluate(node.right, roots);
      throw new ExpressionEvalError(`Unsupported logical operator '${node.op}'`);
    }

    case 'conditional': {
      const test = evaluate(node.test, roots);
      return test ? evaluate(node.consequent, roots) : evaluate(node.alternate, roots);
    }

    default: {
      const exhaustive: never = node;
      throw new ExpressionEvalError(`Unsupported node: ${JSON.stringify(exhaustive)}`);
    }
  }
}

/**
 * Parse and evaluate a condition-node expression against a bound `input`
 * (and optional `context`) value. Throws `ExpressionSyntaxError` for
 * malformed expressions and `ExpressionEvalError` for runtime issues
 * (unknown identifiers, disallowed method calls, type errors) — callers
 * should treat both as "this condition failed to evaluate," not crash the
 * whole workflow run silently succeeding or failing open.
 */
export function evaluateConditionExpression(
  expression: string,
  roots: { input: unknown; context?: unknown }
): boolean {
  const trimmed = expression.trim();
  if (!trimmed) {
    throw new ExpressionSyntaxError('Condition expression is empty');
  }
  const tokens = tokenize(trimmed);
  const ast = new Parser(tokens).parseProgram();
  const result = evaluate(ast, { input: roots.input, context: roots.context ?? {} });
  return Boolean(result);
}
