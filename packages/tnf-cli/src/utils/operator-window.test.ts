import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import {
  DEFAULT_OPERATOR_WINDOW_MS,
  detectOperatorWindowDirective,
  effectiveOperatorWindowMs,
  parseOperatorWindowArg,
  persistOperatorWindowMs,
  resolveOperatorWindowMs,
} from './operator-window.js';

describe('operator-window', () => {
  it('defaults to 30 seconds', () => {
    assert.equal(DEFAULT_OPERATOR_WINDOW_MS, 30_000);
    assert.equal(
      resolveOperatorWindowMs({}, path.join(os.tmpdir(), `tnf-ow-${Date.now()}-missing`)),
      30_000
    );
  });

  it('parses /window args as seconds or ms', () => {
    assert.equal(parseOperatorWindowArg('30'), 30_000);
    assert.equal(parseOperatorWindowArg('30s'), 30_000);
    assert.equal(parseOperatorWindowArg('45 sec'), 45_000);
    assert.equal(parseOperatorWindowArg('8000'), 8000);
    assert.equal(parseOperatorWindowArg('8000ms'), 8000);
    assert.equal(parseOperatorWindowArg(''), null);
    assert.equal(parseOperatorWindowArg('nope'), null);
  });

  it('detects natural-language window directives', () => {
    assert.equal(
      detectOperatorWindowDirective('operator window needs to be increased to 30'),
      30_000
    );
    assert.equal(detectOperatorWindowDirective('increase operator window to 45'), 45_000);
    assert.equal(detectOperatorWindowDirective('set the operator window to 20s'), 20_000);
    assert.equal(detectOperatorWindowDirective('just keep going'), null);
  });

  it('persists and resolves from tui-mode.json', () => {
    const home = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-ow-'));
    try {
      const saved = persistOperatorWindowMs(45_000, home);
      assert.equal(saved, 45_000);
      assert.equal(resolveOperatorWindowMs({}, home), 45_000);
      // Env overrides persisted.
      assert.equal(resolveOperatorWindowMs({ TNF_OPERATOR_WINDOW_MS: '12000' }, home), 12_000);
    } finally {
      fs.rmSync(home, { recursive: true, force: true });
    }
  });

  it('boosts window after stall turns', () => {
    assert.equal(effectiveOperatorWindowMs(8_000, 0), 8_000);
    assert.equal(effectiveOperatorWindowMs(8_000, 1), 8_000);
    assert.equal(effectiveOperatorWindowMs(8_000, 2), 60_000);
    assert.equal(effectiveOperatorWindowMs(90_000, 5), 90_000);
  });
});
