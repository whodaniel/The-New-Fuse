'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const tmux = require('./tnf-tmux.cjs');

test('session names are class-prefixed and slash-free', () => {
  const env = { TNF_TMUX_HOST_ID: 'h:deadbeef' };
  const agent = tmux.sessionName({ className: 'agent', agentId: 'tnf-pi-redis-wrapper' }, env);
  const operator = tmux.sessionName({ className: 'operator', slug: 'interactive-pi' }, env);
  assert.equal(agent, 'tnf-a-deadbeef-tnf-pi-redis-wrapper');
  assert.equal(operator, 'tnf-o-deadbeef-interactive-pi');
  assert.equal(tmux.isAgentSession(agent), true);
  assert.equal(tmux.isOperatorSession(operator), true);
  assert.equal(tmux.isAgentSession(operator), false);
});

test('logical addresses match the plan shape', () => {
  const env = { TNF_TMUX_HOST_ID: 'h:f8875b92' };
  assert.equal(
    tmux.logicalAddress({ className: 'agent', agentId: 'pi', incarnation: '1' }, env),
    'tnf/agent/h:f8875b92/pi/1'
  );
  assert.equal(
    tmux.logicalAddress({ className: 'operator', slug: 'pi' }, env),
    'tnf/operator/h:f8875b92/pi'
  );
});

test('socket defaults to ~/.tnf/tmux/tnf.sock and honors TNF_TMUX_SOCKET', () => {
  const isolated = path.join(os.tmpdir(), 'tnf-tmux-test.sock');
  assert.equal(tmux.socketPath({ TNF_TMUX_SOCKET: isolated }), isolated);
  const fallback = tmux.socketPath({});
  assert.ok(fallback.endsWith(path.join('.tnf', 'tmux', 'tnf.sock')));
});

test('alreadyInTnfTmux matches only the dedicated socket', () => {
  const sock = '/tmp/tnf-test.sock';
  assert.equal(tmux.alreadyInTnfTmux({ TNF_TMUX_SOCKET: sock, TMUX: `${sock},123,0` }), true);
  assert.equal(tmux.alreadyInTnfTmux({ TNF_TMUX_SOCKET: sock, TMUX: '/tmp/other.sock,1,0' }), false);
  assert.equal(tmux.alreadyInTnfTmux({ TNF_TMUX_SOCKET: sock }), false);
});

test('reaper denies operator-class and attached clients', () => {
  const now = 1_700_000_000_000;
  const idle = { nowMs: now, idleSeconds: 60 };
  assert.deepEqual(
    tmux.shouldReapSession({ session: 'tnf-o-deadbeef-pi', attached: 0, activity: 1, dead: '1' }, idle),
    { reap: false, reason: 'operator-class' }
  );
  assert.equal(
    tmux.shouldReapSession(
      { session: 'tnf-a-deadbeef-pi', attached: 1, activity: 1, dead: '1', command: 'zsh' },
      idle
    ).reason,
    'attached-client'
  );
  assert.equal(
    tmux.shouldReapSession(
      { session: 'tnf-a-deadbeef-pi', clients: ['/dev/ttys000'], activity: 1, dead: '1' },
      idle
    ).reason,
    'attached-client'
  );
});

test('reaper denies live agent commands and recently active shells', () => {
  const now = 1_700_000_000_000;
  assert.equal(
    tmux.shouldReapSession(
      { session: 'tnf-a-deadbeef-pi', attached: 0, activity: now / 1000 - 10, command: 'node', dead: '0' },
      { nowMs: now, idleSeconds: 60 }
    ).reason,
    'not-idle'
  );
  assert.equal(
    tmux.shouldReapSession(
      { session: 'tnf-a-deadbeef-pi', attached: 0, activity: now / 1000 - 120, command: 'node', dead: '0' },
      { nowMs: now, idleSeconds: 60 }
    ).reason,
    'command-alive'
  );
});

test('reaper allows idle agent sessions whose command is gone', () => {
  const now = 1_700_000_000_000;
  const decision = tmux.shouldReapSession(
    { session: 'tnf-a-deadbeef-pi', attached: 0, activity: now / 1000 - 400, command: 'zsh', dead: '0' },
    { nowMs: now, idleSeconds: 60 }
  );
  assert.deepEqual(decision, { reap: true, reason: 'idle-and-command-gone' });
});

test('wrap reports fallback when tmux is not installed', { skip: tmux.tmuxAvailable() }, () => {
  const result = tmux.wrap({
    className: 'agent',
    agentId: 'probe',
    command: ['true'],
    detach: true,
    noRegister: true,
  });
  assert.equal(result.ok, false);
  assert.equal(result.error, 'tmux-not-installed');
  assert.equal(result.fallback, true);
});

test('parseArgv keeps wrap command after --', () => {
  const parsed = tmux.parseArgv([
    'node',
    'tnf-tmux.cjs',
    'wrap',
    '--class',
    'operator',
    '--slug',
    'pi',
    '--detach',
    '--',
    'pi',
    '--help',
  ]);
  assert.equal(parsed.cmd, 'wrap');
  assert.equal(parsed.options.className, 'operator');
  assert.deepEqual(parsed.command, ['pi', '--help']);
});

test('live tmux wrap/list/reap isolation on a private socket', { skip: !tmux.tmuxAvailable() }, () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'tnf-tmux-'));
  const env = {
    ...process.env,
    TNF_TMUX_SOCKET: path.join(dir, 'tnf.sock'),
    TNF_TMUX_HOST_ID: 'h:testhost',
    TMUX: '',
  };
  try {
    const agent = tmux.wrap(
      {
        className: 'agent',
        agentId: 'probe',
        command: ['sleep', '120'],
        detach: true,
        noRegister: true,
        cwd: dir,
      },
      env
    );
    assert.equal(agent.ok, true, agent.error);
    assert.equal(agent.session, 'tnf-a-testhost-probe');
    assert.ok(agent.tmux.pane);

    const operator = tmux.wrap(
      {
        className: 'operator',
        slug: 'probe',
        command: ['sleep', '120'],
        detach: true,
        noRegister: true,
        cwd: dir,
      },
      env
    );
    assert.equal(operator.ok, true, operator.error);
    assert.equal(tmux.isOperatorSession(operator.session), true);

    const listed = tmux.listPanes(env);
    assert.ok(listed.some((p) => p.session === agent.session));
    assert.ok(listed.some((p) => p.session === operator.session));

    const dry = tmux.reap({ dryRun: true, idleSeconds: 0 }, env);
    const operatorRow = dry.considered.find((row) => row.session === operator.session);
    const agentRow = dry.considered.find((row) => row.session === agent.session);
    assert.ok(operatorRow);
    assert.equal(operatorRow.reason, 'operator-class');
    assert.equal(
      dry.reaped.some((row) => row.session === operator.session),
      false
    );
    assert.ok(agentRow);
    assert.equal(agentRow.reason, 'command-alive');
  } finally {
    const { spawnSync } = require('child_process');
    spawnSync('tmux', ['-S', env.TNF_TMUX_SOCKET, 'kill-server'], { encoding: 'utf8' });
    fs.rmSync(dir, { recursive: true, force: true });
  }
});
