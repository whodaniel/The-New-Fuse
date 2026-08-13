/**
 * Tests for scripts/protocols/validate-orchestration-health.cjs
 *
 * The script enforces two columns ("Last Audited" and "Challenge Rationale")
 * on every schedule row in the Master Calendar. Drift in the calendar (or a
 * generator hiccup) silently weakens the audit-trail story; this script is the
 * gate that prevents that.
 *
 * The script reads a hardcoded path and calls process.exit(); tests are a
 * mix of:
 *   - subprocess runs against real calendar (positive + negative calendar variants)
 *   - direct invocation of the validator logic via a copy that uses a passed-in
 *     calendar string (so we can synthesize malformed tables)
 *
 * Usage:
 *   node --test scripts/protocols/validate-orchestration-health.test.cjs
 */

'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { spawnSync } = require('node:child_process');

const SCRIPT = path.join(__dirname, 'validate-orchestration-health.cjs');
const REAL_CALENDAR = path.join(
  __dirname,
  '..',
  '..',
  'docs',
  'operations',
  'TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md'
);
const REPO = path.resolve(__dirname, '..', '..');

// Mirror of the validator logic — keep in sync with the script.
function validateOrchestrationHealth(calendarPath) {
  if (!fs.existsSync(calendarPath)) {
    throw new Error(`Could not find Master Calendar at ${calendarPath}`);
  }
  const content = fs.readFileSync(calendarPath, 'utf-8');
  const tableLines = content.split('\n').filter((line) => line.trim().startsWith('|'));

  if (tableLines.length < 2) {
    throw new Error('No schedule table found in the Master Calendar.');
  }
  const header = tableLines[0];
  if (!header.includes('Last Audited') || !header.includes('Challenge Rationale')) {
    throw new Error(
      'Master Calendar table must include "Last Audited" and "Challenge Rationale" columns.'
    );
  }
  const dataRows = tableLines.slice(2);
  const failures = [];
  dataRows.forEach((row, index) => {
    // Mirror the fixed slice approach: do not filter out empty cells, otherwise
    // a row with an empty inner cell would silently skip the audit.
    const raw = row.split('|');
    const columns = raw.length >= 2 && raw[0].trim() === '' ? raw.slice(1, -1) : raw;
    if (columns.length !== 12) return;
    const scheduleId = columns[0].trim();
    const lastAudited = columns[10].trim();
    const challengeRationale = columns[11].trim();
    if (!lastAudited) failures.push(`Schedule '${scheduleId}' is missing a 'Last Audited' date.`);
    if (!challengeRationale)
      failures.push(`Schedule '${scheduleId}' is missing a 'Challenge Rationale'.`);
  });
  if (failures.length) {
    throw new Error(
      `Orchestration Governance check failed: ${failures.length} issue(s): ${failures.join('; ')}`
    );
  }
  return { rowCount: dataRows.length };
}

function writeTempCalendar(body) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-orchestr-health-'));
  const file = path.join(dir, 'calendar.md');
  fs.writeFileSync(file, body);
  return { dir, file };
}

const VALID_HEADER =
  '| Schedule ID | Scope | Category | Owner | Cadence | TZ | Enabled | Runtime | Lock | Subroutine | Last Audited | Challenge Rationale |';
const VALID_SEPARATOR =
  '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |';

function makeRow(scheduleId = 'tnf-foo', lastAudited = '2026-07-15', rationale = 'N/A - Baseline') {
  // 12 columns total: schedule-id ... last-audited, challenge-rationale
  return `| ${scheduleId}           | system | orchestration | master-clock | _/15 _ * * * | UTC | yes | healthy | open | scripts/protocols/example.cjs | ${lastAudited}   | ${rationale} |`;
}

test('real handlers calendar file passes end-to-end via subprocess', () => {
  assert.ok(fs.existsSync(REAL_CALENDAR), 'real master calendar must exist');
  const r = spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
  assert.equal(r.status, 0, `script failed: ${r.stderr}`);
  assert.match(r.stdout, /Orchestration Governance check passed/);
});

test('real master calendar also validates against the in-process mirror', () => {
  const result = validateOrchestrationHealth(REAL_CALENDAR);
  assert.ok(result.rowCount > 10, `expected many schedule rows, got ${result.rowCount}`);
});

test('rejects a missing calendar file', () => {
  assert.throws(
    () => validateOrchestrationHealth('/no/such/calendar.md'),
    /Could not find Master Calendar/
  );
});

test('rejects an empty calendar', () => {
  const { file } = writeTempCalendar('# Empty\n\n');
  assert.throws(() => validateOrchestrationHealth(file), /No schedule table/);
});

test('rejects a calendar whose table header lacks the required columns', () => {
  const body = ['# TNF Master Calendar', '', '## Schedule Table', '',
    '| Foo | Bar |', '| --- | --- |', '| 1 | 2 |'].join('\n');
  const { file } = writeTempCalendar(body);
  assert.throws(() => validateOrchestrationHealth(file), /Last Audited.*Challenge Rationale/);
});

test('passes when the header has the columns and all rows are well formed', () => {
  const body = [
    '# TNF Master Calendar',
    '',
    '## Schedule Table',
    '',
    VALID_HEADER,
    VALID_SEPARATOR,
    makeRow('one'),
    makeRow('two'),
  ].join('\n');
  const { file } = writeTempCalendar(body);
  const result = validateOrchestrationHealth(file);
  assert.equal(result.rowCount, 2);
});

test('rejects when a row has an empty Last Audited cell', () => {
  const body = [
    '# TNF Master Calendar',
    '',
    '## Schedule Table',
    '',
    VALID_HEADER,
    VALID_SEPARATOR,
    makeRow('one', '', 'N/A - Baseline'),
  ].join('\n');
  const { file } = writeTempCalendar(body);
  assert.throws(() => validateOrchestrationHealth(file), /Last Audited/);
});

test('rejects when a row has an empty Challenge Rationale cell', () => {
  const body = [
    '# TNF Master Calendar',
    '',
    '## Schedule Table',
    '',
    VALID_HEADER,
    VALID_SEPARATOR,
    makeRow('one', '2026-07-15', ''),
  ].join('\n');
  const { file } = writeTempCalendar(body);
  assert.throws(() => validateOrchestrationHealth(file), /Challenge Rationale/);
});

test('subprocess exits non-zero on a malformed calendar (synthetic)', () => {
  const { dir } = writeTempCalendar([
    '# TNF Master Calendar',
    '',
    '## Schedule Table',
    '',
    VALID_HEADER,
    VALID_SEPARATOR,
    makeRow('alpha', '', 'N/A - Baseline'),
  ].join('\n'));
  // Run the subprocess from the temp directory so the script's hardcoded path
  // resolves to our calendar copy. Make the hardcoded path resolution work by
  // symlinking the real file's location -> calib dir.
  const target = path.join(REPO, 'docs', 'operations', 'TNF_STAFF_MASTER_CALENDAR_AND_SCHEDULE.md');
  const backup = `${target}.test-backup-${process.pid}`;
  fs.renameSync(target, backup);
  try {
    fs.writeFileSync(target, fs.readFileSync(path.join(dir, 'calendar.md')));
    const r = spawnSync(process.execPath, [SCRIPT], { cwd: REPO, encoding: 'utf8' });
    assert.notEqual(r.status, 0);
    assert.match(r.stderr, /Last Audited/);
  } finally {
    // restore
    fs.renameSync(backup, target);
  }
});
