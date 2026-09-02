'use strict';

const assert = require('node:assert/strict');
const test = require('node:test');
const { shouldInjectTmuxPane } = require('./tnf-tmux-inject.cjs');

test('operator-class panes are a hard deny', () => {
  const decision = shouldInjectTmuxPane({
    session: 'tnf-o-deadbeef-pi',
    pane: '%1',
    attached: false,
    contents: '',
  });
  assert.deepEqual(decision, { ok: false, reason: 'operator-class' });
});

test('non-TNF sessions are denied', () => {
  const decision = shouldInjectTmuxPane({
    session: 'personal',
    pane: '%1',
    contents: '',
  });
  assert.deepEqual(decision, { ok: false, reason: 'not-tnf-agent' });
});

test('attached active pane is treated as frontmost', () => {
  const decision = shouldInjectTmuxPane({
    session: 'tnf-a-deadbeef-pi',
    pane: '%3',
    attached: true,
    activePane: '%3',
    contents: '',
  });
  assert.deepEqual(decision, { ok: false, reason: 'attached-active-pane' });
});

test('recent tty activity is skipped', () => {
  const decision = shouldInjectTmuxPane({
    session: 'tnf-a-deadbeef-pi',
    pane: '%3',
    recentlyActive: true,
    contents: '',
  });
  assert.deepEqual(decision, { ok: false, reason: 'tty-recently-active' });
});

test('unsubmitted composer text is skipped', () => {
  const decision = shouldInjectTmuxPane({
    session: 'tnf-a-deadbeef-pi',
    pane: '%3',
    attached: false,
    contents: 'tab to queue message\n$ half-typed',
  });
  assert.equal(decision.ok, false);
  assert.equal(decision.reason, 'typing-in-progress');
});

test('idle agent pane is eligible', () => {
  const decision = shouldInjectTmuxPane({
    session: 'tnf-a-deadbeef-pi',
    pane: '%3',
    attached: false,
    recentlyActive: false,
    contents: '❯\n',
  });
  assert.deepEqual(decision, { ok: true });
});

test('attached but different pane may be eligible', () => {
  const decision = shouldInjectTmuxPane({
    session: 'tnf-a-deadbeef-pi',
    pane: '%3',
    attached: true,
    activePane: '%9',
    recentlyActive: false,
    contents: '',
  });
  assert.deepEqual(decision, { ok: true });
});
