#!/usr/bin/env node

// Issue #176 — wrapper detection regression coverage.
// Reproduces the original false positive (`tail -f <wrapper>` making boot
// report "already running") and proves real interpreter/launcher invocations
// still match. Runs the actual production lib via bash, not a reimplementation.

const test = require('node:test');
const assert = require('node:assert/strict');
const { execFileSync, spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const LIB = path.join(__dirname, '..', 'runtime', 'wrapper-process-lib.sh');

function runBash(snippet) {
  return execFileSync('/bin/bash', ['-c', snippet], {
    encoding: 'utf8',
    timeout: 30000,
  }).trim();
}

function sourceLib() {
  return `. '${LIB}'`;
}

test('tail -f mentioning wrapper filename does NOT match (original false positive)', () => {
  const wrapper = 'claude-redis-wrapper.cjs';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-wrap-'));
  const target = path.join(tmp, wrapper);
  fs.writeFileSync(target, '// decoy\n');

  const tailProc = spawn('tail', ['-f', target], { stdio: 'ignore', detached: true });
  try {
    const out = runBash(`
      ${sourceLib()}
      if is_wrapper_running '${wrapper}'; then echo MATCH; else echo NOMATCH; fi
      _process_owns_wrapper ${tailProc.pid} '${wrapper}' && echo SIGMATCH || echo SIGNOMATCH
    `);
    assert.match(out, /NOMATCH/, 'is_wrapper_running must not see tail as runtime');
    assert.match(out, /SIGNOMATCH/, 'process signature must reject tail');
  } finally {
    try {
      process.kill(-tailProc.pid, 'SIGKILL');
    } catch {}
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('a live node <wrapper> invocation DOES match via signature path', () => {
  const wrapper = 'gemini-redis-wrapper.cjs';
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-wrap-'));
  const target = path.join(tmp, wrapper);
  // Long-lived node process executing a script at that path.
  fs.writeFileSync(
    path.join(tmp, 'hold.js'),
    'setInterval(() => {}, 1000);\n'
  );
  fs.symlinkSync(path.join(tmp, 'hold.js'), target);

  const nodeProc = spawn(process.execPath, [target], { stdio: 'ignore' });
  try {
    // argv0 of node may be resolved binary; command line ends with wrapper.
    const out = runBash(`
      ${sourceLib()}
      for i in 1 2 3 4 5; do
        if is_wrapper_running '${wrapper}'; then echo MATCH; exit 0; fi
        sleep 0.2
      done
      echo NOMATCH
    `);
    assert.match(out, /MATCH/, 'real node runtime must be detected');
  } finally {
    try {
      nodeProc.kill('SIGKILL');
    } catch {}
    fs.rmSync(tmp, { recursive: true, force: true });
  }
});

test('PID-ownership fast path matches recorded pid and skips foreign names', () => {
  const out = runBash(`
    ${sourceLib()}
    export TNF_WRAPPER_PID_FILE="$(mktemp)"
    printf '%s %s\\n' "$$" 'jules-redis-wrapper.cjs' > "$TNF_WRAPPER_PID_FILE"
    # Recorded name differs from queried name -> no fast-path match even though pid alive.
    if is_wrapper_running 'pi-redis-wrapper.cjs'; then echo WRONGFASTPATH; else echo OK1; fi
    rm -f "$TNF_WRAPPER_PID_FILE"
  `);
  assert.match(out, /OK1/);
});

test('self and ancestors are excluded from signature matches', () => {
  const out = runBash(`
    ${sourceLib()}
    SELF=$$
    _process_owns_wrapper "$SELF" 'start-agent-network.sh' && echo SELFMATCH || echo SELFREJECT
  `);
  assert.match(out, /SELFREJECT/);
});
