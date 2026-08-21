const assert = require('node:assert/strict');
const test = require('node:test');

const { cycleCommands } = require('./tnf-master-heartbeat-loop.cjs');

test('swarm context bridge replaces the shell so timeout signals reach node', () => {
  const command = cycleCommands(1).find((entry) => entry.name === 'swarm-context-bridge');
  assert.ok(command);
  assert.match(command.command, /&& exec node scripts\/runtime\/tnf-swarm-context-bridge[.]cjs$/);
});
