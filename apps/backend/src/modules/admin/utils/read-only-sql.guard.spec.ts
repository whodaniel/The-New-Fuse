import {
  assertReadOnlyInspectionSql,
  ReadOnlySqlViolation,
} from './read-only-sql.guard';

function expectAllowed(sql: string) {
  expect(() => assertReadOnlyInspectionSql(sql)).not.toThrow();
}

function expectRejected(sql: string) {
  expect(() => assertReadOnlyInspectionSql(sql)).toThrow(ReadOnlySqlViolation);
}

describe('assertReadOnlyInspectionSql', () => {
  it('allows a plain SELECT', () => {
    expectAllowed('SELECT 1');
    expect(assertReadOnlyInspectionSql('SELECT 1')).toBe('SELECT 1');
  });

  it('allows SELECT containing dangerous words inside strings', () => {
    expectAllowed("SELECT 'DROP TABLE users' AS warning");
    expectAllowed("SELECT $$DELETE FROM t$$ AS payload");
    expectAllowed("SELECT 'INSERT INTO x VALUES (1)'");
  });

  it('allows read-only WITH and CASE ... END', () => {
    expectAllowed(`
      WITH recent AS (
        SELECT id FROM agents WHERE active = true
      )
      SELECT id,
        CASE WHEN id IS NOT NULL THEN 'yes' ELSE 'no' END AS flag
      FROM recent
    `);
  });

  it('rejects stacked statements', () => {
    expectRejected('SELECT 1; DROP TABLE users');
    expectRejected('SELECT 1; SELECT 2');
    expectRejected("SELECT 1; SELECT 'nope'");
  });

  it('rejects comment-smuggled mutations and multi-line tricks', () => {
    expectRejected('SELECT 1; /* comment */ DELETE FROM users');
    expectRejected('SELECT 1;\nDELETE FROM users');
    expectRejected('-- preface\nDELETE FROM users');
    expectRejected('/* SELECT 1 */ DELETE FROM users');
  });

  it('rejects semicolon tricks with trailing writes', () => {
    expectRejected('SELECT 1;;DELETE FROM users');
    expectRejected("SELECT 1; ; UPDATE users SET role = 'admin'");
  });

  it('rejects writable CTEs', () => {
    expectRejected(`
      WITH deleted AS (
        DELETE FROM users WHERE id = 1 RETURNING id
      )
      SELECT * FROM deleted
    `);
    expectRejected(`
      WITH inserted AS (
        INSERT INTO users(id) VALUES (1) RETURNING id
      )
      SELECT * FROM inserted
    `);
    expectRejected(`
      WITH updated AS (
        UPDATE users SET name = 'x' RETURNING id
      )
      SELECT * FROM updated
    `);
  });

  it('rejects INSERT/UPDATE/DELETE/DROP/TRUNCATE/ALTER', () => {
    expectRejected('INSERT INTO users(id) VALUES (1)');
    expectRejected("UPDATE users SET name = 'x'");
    expectRejected('DELETE FROM users');
    expectRejected('DROP TABLE users');
    expectRejected('TRUNCATE users');
    expectRejected('ALTER TABLE users ADD COLUMN x int');
  });

  it('rejects transaction and session statements', () => {
    expectRejected('BEGIN');
    expectRejected('COMMIT');
    expectRejected('ROLLBACK');
    expectRejected('START TRANSACTION');
    expectRejected('SET search_path TO public');
    expectRejected('SELECT 1; COMMIT');
  });

  it('rejects EXEC/CALL and dialect equivalents', () => {
    expectRejected('CALL refresh_stats()');
    expectRejected('EXECUTE some_plan');
    expectRejected('EXEC sp_help');
    expectRejected('DO $$ BEGIN DELETE FROM users; END $$');
  });

  it('rejects SELECT INTO and FOR UPDATE', () => {
    expectRejected('SELECT * INTO users_copy FROM users');
    expectRejected('SELECT id FROM users FOR UPDATE');
  });

  it('strips a single trailing semicolon on allowed SELECT', () => {
    expect(assertReadOnlyInspectionSql('SELECT 1;')).toBe('SELECT 1');
  });

  it('rejects empty / whitespace', () => {
    expectRejected('');
    expectRejected('   ');
    expectRejected(';;;');
  });
});
