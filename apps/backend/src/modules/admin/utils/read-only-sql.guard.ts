/**
 * Structural gate for SUPER_ADMIN inspection SQL.
 *
 * Prefer statement-shape enforcement + READ ONLY transactions over keyword regex.
 * This module is intentionally dependency-free so adversarial unit tests can run
 * without a live database.
 */

const ALLOWED_LEADING = new Set(['SELECT', 'WITH', 'EXPLAIN', 'SHOW', 'TABLE', 'VALUES']);

/**
 * Mutating / session / transactional verbs that must not appear outside literals.
 * Avoid tokens that routinely appear in legitimate SELECT expressions (e.g. END in CASE).
 */
const FORBIDDEN_OUTSIDE_LITERALS =
  /\b(?:INSERT|UPDATE|DELETE|MERGE|UPSERT|REPLACE|DROP|TRUNCATE|ALTER|CREATE|GRANT|REVOKE|CALL|EXECUTE|EXEC|COPY|LISTEN|NOTIFY|LOAD|REINDEX|VACUUM|CLUSTER|DISCARD|PREPARE|DEALLOCATE|DECLARE|FETCH|MOVE|CLOSE|CHECKPOINT|REASSIGN|IMPORT|EXPORT|ATTACH|DETACH|BEGIN|COMMIT|ROLLBACK|SAVEPOINT|ABORT)\b/i;

const FORBIDDEN_PHRASES =
  /\b(?:START\s+TRANSACTION|START\s+WORK|LOCK\s+TABLE|REFRESH\s+MATERIALIZED|SECURITY\s+LABEL|OWNER\s+TO|FOR\s+(?:UPDATE|SHARE|NO\s+KEY\s+UPDATE|KEY\s+SHARE)\b|SELECT\b[\s\S]*?\bINTO\b|INTO\s+(?:TEMP|TEMPORARY|UNLOGGED|TABLE)\b|INTO\s+[A-Za-z_"][A-Za-z0-9_."]*)/i;

const SESSION_MUTATION = /\b(?:SET\s+(?:SESSION\s+|LOCAL\s+)?[A-Za-z_]|RESET\s+)/i;

export class ReadOnlySqlViolation extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ReadOnlySqlViolation';
  }
}

type MaskResult = { masked: string; error?: string };

/**
 * Mask string literals, dollar-quotes, and comments so keyword/statement checks
 * do not false-positive on payload text.
 */
export function maskSqlLiterals(input: string): MaskResult {
  let out = '';
  let i = 0;
  while (i < input.length) {
    const ch = input[i];

    if (ch === "'") {
      out += ' ';
      i += 1;
      while (i < input.length) {
        if (input[i] === "'") {
          if (input[i + 1] === "'") {
            i += 2;
            continue;
          }
          i += 1;
          break;
        }
        i += 1;
      }
      continue;
    }

    if (ch === '$') {
      const rest = input.slice(i);
      const tagMatch = rest.match(/^\$([A-Za-z_][A-Za-z0-9_]*)?\$/);
      if (tagMatch) {
        const tag = tagMatch[0];
        const closeAt = input.indexOf(tag, i + tag.length);
        if (closeAt === -1) {
          return { masked: out, error: 'Unterminated dollar-quoted string' };
        }
        out += ' '.repeat(closeAt + tag.length - i);
        i = closeAt + tag.length;
        continue;
      }
    }

    if (ch === '-' && input[i + 1] === '-') {
      while (i < input.length && input[i] !== '\n') {
        out += ' ';
        i += 1;
      }
      continue;
    }

    if (ch === '/' && input[i + 1] === '*') {
      out += '  ';
      i += 2;
      while (i < input.length) {
        if (input[i] === '*' && input[i + 1] === '/') {
          out += '  ';
          i += 2;
          break;
        }
        out += input[i] === '\n' ? '\n' : ' ';
        i += 1;
      }
      continue;
    }

    out += ch;
    i += 1;
  }
  return { masked: out };
}

function splitStatements(masked: string): string[] {
  return masked
    .split(';')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function leadingKeyword(statement: string): string | null {
  const match = statement.match(/^([A-Za-z]+)/);
  return match ? match[1]!.toUpperCase() : null;
}

/**
 * Validate that `query` is a single read-only inspection statement.
 * Returns the trimmed original query (without a trailing semicolon) for execution.
 */
export function assertReadOnlyInspectionSql(query: string): string {
  if (typeof query !== 'string' || !query.trim()) {
    throw new ReadOnlySqlViolation('Query is required');
  }

  const trimmed = query.trim();
  const { masked, error } = maskSqlLiterals(trimmed);
  if (error) {
    throw new ReadOnlySqlViolation(error);
  }

  const statements = splitStatements(masked);
  if (statements.length === 0) {
    throw new ReadOnlySqlViolation('Query is required');
  }
  if (statements.length > 1) {
    throw new ReadOnlySqlViolation('Multiple statements are not allowed');
  }

  const statement = statements[0]!;
  const lead = leadingKeyword(statement);
  if (!lead || !ALLOWED_LEADING.has(lead)) {
    throw new ReadOnlySqlViolation(
      `Only read-only inspection statements are allowed (got ${lead ?? 'empty'})`
    );
  }

  if (
    FORBIDDEN_OUTSIDE_LITERALS.test(statement) ||
    FORBIDDEN_PHRASES.test(statement) ||
    SESSION_MUTATION.test(statement)
  ) {
    throw new ReadOnlySqlViolation(
      'Mutating, transactional, or session-altering SQL is not allowed on the inspection endpoint'
    );
  }

  return trimmed.replace(/;+\s*$/, '');
}
