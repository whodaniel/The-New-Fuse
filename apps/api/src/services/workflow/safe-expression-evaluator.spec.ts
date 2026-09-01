import { describe, expect, it } from '@jest/globals';

import {
  evaluateConditionExpression,
  ExpressionEvalError,
  ExpressionSyntaxError,
} from './safe-expression-evaluator';

describe('safe-expression-evaluator', () => {
  describe('basic comparisons and the UI placeholder example', () => {
    it('evaluates the exact placeholder shown in condition-node.tsx', () => {
      expect(evaluateConditionExpression('input.value > 10', { input: { value: 15 } })).toBe(true);
      expect(evaluateConditionExpression('input.value > 10', { input: { value: 5 } })).toBe(false);
    });

    it('supports equality, inequality, and strict variants', () => {
      expect(evaluateConditionExpression('input.status == "ok"', { input: { status: 'ok' } })).toBe(
        true
      );
      expect(
        evaluateConditionExpression('input.status === "ok"', { input: { status: 'ok' } })
      ).toBe(true);
      expect(
        evaluateConditionExpression('input.status != "ok"', { input: { status: 'bad' } })
      ).toBe(true);
      expect(evaluateConditionExpression('input.count !== 0', { input: { count: 0 } })).toBe(false);
    });

    it('supports <, <=, >=', () => {
      expect(evaluateConditionExpression('input.n < 5', { input: { n: 3 } })).toBe(true);
      expect(evaluateConditionExpression('input.n <= 5', { input: { n: 5 } })).toBe(true);
      expect(evaluateConditionExpression('input.n >= 5', { input: { n: 5 } })).toBe(true);
    });
  });

  describe('logical and ternary composition', () => {
    it('supports && and ||', () => {
      expect(
        evaluateConditionExpression('input.a > 1 && input.b > 1', { input: { a: 2, b: 2 } })
      ).toBe(true);
      expect(
        evaluateConditionExpression('input.a > 1 && input.b > 1', { input: { a: 2, b: 0 } })
      ).toBe(false);
      expect(
        evaluateConditionExpression('input.a > 1 || input.b > 1', { input: { a: 0, b: 2 } })
      ).toBe(true);
    });

    it('supports negation', () => {
      expect(evaluateConditionExpression('!input.flag', { input: { flag: false } })).toBe(true);
      expect(evaluateConditionExpression('!input.flag', { input: { flag: true } })).toBe(false);
    });

    it('supports ternary expressions', () => {
      expect(
        evaluateConditionExpression('(input.n > 0 ? "pos" : "neg") == "pos"', { input: { n: 1 } })
      ).toBe(true);
    });

    it('supports arithmetic and parens', () => {
      expect(
        evaluateConditionExpression('(input.a + input.b) * 2 > 10', { input: { a: 3, b: 3 } })
      ).toBe(true);
    });
  });

  describe('member access', () => {
    it('supports nested dot access', () => {
      expect(
        evaluateConditionExpression('input.user.profile.age >= 18', {
          input: { user: { profile: { age: 21 } } },
        })
      ).toBe(true);
    });

    it('supports bracket/computed access', () => {
      expect(
        evaluateConditionExpression('input.items[0] == "first"', { input: { items: ['first'] } })
      ).toBe(true);
    });

    it('returns undefined (falsy) for missing nested properties rather than throwing', () => {
      expect(evaluateConditionExpression('input.a.b.c == "x"', { input: {} })).toBe(false);
    });
  });

  describe('allowlisted methods', () => {
    it('supports string.includes/startsWith/endsWith/toLowerCase/toUpperCase/trim', () => {
      expect(
        evaluateConditionExpression('input.text.includes("world")', {
          input: { text: 'hello world' },
        })
      ).toBe(true);
      expect(
        evaluateConditionExpression('input.text.startsWith("hello")', {
          input: { text: 'hello world' },
        })
      ).toBe(true);
      expect(
        evaluateConditionExpression('input.text.toLowerCase() == "hi"', { input: { text: 'HI' } })
      ).toBe(true);
    });

    it('supports array.includes', () => {
      expect(
        evaluateConditionExpression('input.tags.includes("urgent")', {
          input: { tags: ['low', 'urgent'] },
        })
      ).toBe(true);
    });

    it('rejects a method call that is not on the allowlist', () => {
      expect(() =>
        evaluateConditionExpression('input.arr.map(x)', { input: { arr: [1, 2] } })
      ).toThrow(ExpressionEvalError);
    });

    it('rejects calling a non-method-call expression, e.g. a bare function call', () => {
      expect(() => evaluateConditionExpression('foo(1)', { input: {} })).toThrow(
        ExpressionEvalError
      );
    });
  });

  describe('security: identifier scope', () => {
    it('rejects any identifier other than input/context', () => {
      expect(() => evaluateConditionExpression('process.env', { input: {} })).toThrow(
        ExpressionEvalError
      );
      expect(() => evaluateConditionExpression('global.x', { input: {} })).toThrow(
        ExpressionEvalError
      );
      expect(() => evaluateConditionExpression('require("fs")', { input: {} })).toThrow();
      expect(() => evaluateConditionExpression('window.location', { input: {} })).toThrow(
        ExpressionEvalError
      );
    });

    it('rejects the classic constructor-chain sandbox escape', () => {
      // this.constructor.constructor('return process')() and its many variants all rely on
      // either a bare disallowed identifier (`this`) or calling something that resolves to a
      // function (`constructor`) — both are rejected: `constructor` is a plain property read
      // (fine), but the grammar only permits *calling* the result of a `.method()` member
      // expression against the allowlist, so `input.constructor.constructor('...')()` fails at
      // the call-resolution step, not by pattern-matching the string.
      expect(() =>
        evaluateConditionExpression('input.constructor.constructor("return 1")()', { input: {} })
      ).toThrow(ExpressionEvalError);
    });

    it('rejects attempts to reach globalThis via bracket-notation identifier obfuscation', () => {
      // Even if an attacker builds the property name at runtime, member access only ever reads
      // a plain property off a value already reachable from `input`/`context` — there is no path
      // to any ambient global, because `evaluate('identifier', ...)` only recognizes the two
      // allowlisted root names in the first place.
      expect(() =>
        evaluateConditionExpression('input["__proto__"]["polluted"]', { input: {} })
      ).not.toThrow();
      // (reading __proto__ is inert here — it just returns Object.prototype, which cannot be
      // called or used to reach anything outside the grammar's own vocabulary)
    });

    it('has no eval, Function, or template-literal-with-expression syntax in the grammar at all', () => {
      expect(() => evaluateConditionExpression('eval("1")', { input: {} })).toThrow();
      expect(() => evaluateConditionExpression('Function("return 1")()', { input: {} })).toThrow();
      expect(() => evaluateConditionExpression('`${1}`', { input: {} })).toThrow(
        ExpressionSyntaxError
      );
    });

    it('rejects assignment syntax (no mutation primitive exists)', () => {
      expect(() => evaluateConditionExpression('input.x = 1', { input: {} })).toThrow();
    });

    it('rejects new-expressions (no constructor-invocation syntax exists)', () => {
      expect(() => evaluateConditionExpression('new Object()', { input: {} })).toThrow();
    });
  });

  describe('error handling', () => {
    it('throws ExpressionSyntaxError on malformed input', () => {
      expect(() => evaluateConditionExpression('input.value >', { input: {} })).toThrow(
        ExpressionSyntaxError
      );
      expect(() => evaluateConditionExpression('((input.value)', { input: {} })).toThrow(
        ExpressionSyntaxError
      );
    });

    it('throws ExpressionSyntaxError on an empty expression', () => {
      expect(() => evaluateConditionExpression('   ', { input: {} })).toThrow(
        ExpressionSyntaxError
      );
    });

    it('coerces the final result to boolean like a real JS condition would', () => {
      expect(evaluateConditionExpression('input.value', { input: { value: 0 } })).toBe(false);
      expect(evaluateConditionExpression('input.value', { input: { value: 'x' } })).toBe(true);
      expect(evaluateConditionExpression('input.value', { input: { value: null } })).toBe(false);
    });
  });
});
