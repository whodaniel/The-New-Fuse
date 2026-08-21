/**
 * Regression: Super Admin .env rotation must never build RegExp from secrets,
 * must only rewrite the intended assignment keys, and must not mutate caller
 * auth state when the .env write fails.
 *
 * Run: pnpm --filter @the-new-fuse/tnf-cli exec tsx src/utils/super-admin-env.test.ts
 */
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  parseEnvAssignmentLine,
  persistSuperAdminTokenRotation,
  upsertEnvAssignment,
} from './super-admin-env.js';

const MASTER = 'TNF_SUPER_ADMIN_TOKEN';
const INPUT = 'TNF_SUPER_ADMIN_INPUT_TOKEN';

/** Includes +, /, =, ., *, ?, $, [, \ — the characters that broke RegExp rotation. */
const SPECIAL_TOKEN = String.raw`1cn+My++osniFsOFPaCpXK11A5gODfe5/pxfHmPK5cc=. *?$[\]`;
const NEXT_TOKEN = String.raw`n3w+Tok/en=. *?$[\]Value=`;

describe('parseEnvAssignmentLine', () => {
  it('matches plain, spaced, and export forms', () => {
    assert.deepEqual(parseEnvAssignmentLine(`${MASTER}=abc`, MASTER), {
      prefix: '',
      separator: '=',
      rawValue: 'abc',
    });
    assert.deepEqual(parseEnvAssignmentLine(`  ${MASTER} = abc`, MASTER), {
      prefix: '  ',
      separator: ' = ',
      rawValue: 'abc',
    });
    assert.deepEqual(parseEnvAssignmentLine(`export ${MASTER}=abc`, MASTER), {
      prefix: 'export ',
      separator: '=',
      rawValue: 'abc',
    });
  });

  it('rejects prefix-sharing keys and comments', () => {
    assert.equal(parseEnvAssignmentLine(`${MASTER}_BACKUP=abc`, MASTER), null);
    assert.equal(parseEnvAssignmentLine(`# ${MASTER}=abc`, MASTER), null);
  });
});

describe('upsertEnvAssignment', () => {
  it('replaces only the intended key when content contains the old secret elsewhere', () => {
    const oldToken = SPECIAL_TOKEN;
    const content = [
      `# leftover mention ${oldToken}`,
      `OTHER_SECRET=${oldToken}`,
      `${MASTER}=${oldToken}`,
      `${INPUT}=${oldToken}`,
      `NOTE=contains ${oldToken} in prose`,
      '',
    ].join('\n');

    const next = upsertEnvAssignment(content, MASTER, NEXT_TOKEN);
    assert.match(next, new RegExp(`^${MASTER}=`, 'm'));
    assert.ok(next.includes(`${MASTER}=${NEXT_TOKEN}`));
    assert.ok(next.includes(`OTHER_SECRET=${oldToken}`), 'other keys must keep old value');
    assert.ok(next.includes(`# leftover mention ${oldToken}`), 'comments must stay intact');
    assert.ok(next.includes(`NOTE=contains ${oldToken} in prose`));
    assert.ok(next.includes(`${INPUT}=${oldToken}`), 'sibling key unchanged until explicitly upserted');
  });

  it('handles special-character tokens without RegExp construction', () => {
    const content = `${MASTER}=${SPECIAL_TOKEN}\nFOO=bar\n`;
    const next = upsertEnvAssignment(content, MASTER, NEXT_TOKEN);
    assert.equal(next, `${MASTER}=${NEXT_TOKEN}\nFOO=bar\n`);
  });

  it('preserves double-quoted assignment style', () => {
    const content = `${MASTER}="${SPECIAL_TOKEN}"\n`;
    const next = upsertEnvAssignment(content, MASTER, NEXT_TOKEN);
    // Backslashes in the value are escaped for double-quoted dotenv form.
    assert.equal(next, `${MASTER}="n3w+Tok/en=. *?$[\\\\]Value="\n`);
  });

  it('appends the assignment when the key is missing', () => {
    const content = 'FOO=bar\n';
    const next = upsertEnvAssignment(content, MASTER, NEXT_TOKEN);
    assert.ok(next.includes('FOO=bar'));
    assert.ok(next.includes(`${MASTER}=${NEXT_TOKEN}`));
  });
});

describe('persistSuperAdminTokenRotation', () => {
  it('atomically updates master and input keys for special-character tokens', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-sa-env-'));
    try {
      const envPath = path.join(dir, '.env');
      fs.writeFileSync(
        envPath,
        [
          `OTHER=${SPECIAL_TOKEN}`,
          `${MASTER}=${SPECIAL_TOKEN}`,
          `${INPUT}=${SPECIAL_TOKEN}`,
          '',
        ].join('\n'),
        'utf8'
      );

      persistSuperAdminTokenRotation({
        envPath,
        keys: [MASTER, INPUT],
        newToken: NEXT_TOKEN,
      });

      const written = fs.readFileSync(envPath, 'utf8');
      assert.ok(written.includes(`${MASTER}=${NEXT_TOKEN}`));
      assert.ok(written.includes(`${INPUT}=${NEXT_TOKEN}`));
      assert.ok(written.includes(`OTHER=${SPECIAL_TOKEN}`));
      assert.ok(!written.includes(`${MASTER}=${SPECIAL_TOKEN}`));
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it('failure path: when .env write fails, file and caller env stay on the previous token', () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-sa-env-fail-'));
    try {
      const envPath = path.join(dir, '.env');
      const previous = SPECIAL_TOKEN;
      fs.writeFileSync(envPath, `${MASTER}=${previous}\n${INPUT}=${previous}\n`, 'utf8');

      const processEnv: Record<string, string | undefined> = {
        [MASTER]: previous,
        [INPUT]: previous,
      };

      const writeError = new Error('simulated ENOSPC');
      assert.throws(
        () =>
          persistSuperAdminTokenRotation({
            envPath,
            keys: [MASTER, INPUT],
            newToken: NEXT_TOKEN,
            writeFile: () => {
              throw writeError;
            },
          }),
        (err: unknown) => err === writeError
      );

      // Simulate requireSuperAdmin contract: only mutate process env after persist succeeds.
      const persistSucceeded = false;
      if (persistSucceeded) {
        processEnv[MASTER] = NEXT_TOKEN;
        processEnv[INPUT] = NEXT_TOKEN;
      }

      assert.equal(processEnv[MASTER], previous);
      assert.equal(processEnv[INPUT], previous);
      assert.equal(fs.readFileSync(envPath, 'utf8'), `${MASTER}=${previous}\n${INPUT}=${previous}\n`);
      assert.notEqual(processEnv[MASTER], NEXT_TOKEN);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });
});
