#!/usr/bin/env node

const { execSync } = require('child_process');
const crypto = require('crypto');

const { singleInstanceGuard } = require('../lib/tnf-single-instance-guard.cjs');
const _guard = singleInstanceGuard({ lockName: 'tnf-dispatch-directives', staleMs: 120000 });
if (!_guard.acquired) {
  console.log(JSON.stringify({ ok: true, skipped: 'already-running', lock: _guard.existingLock }));
  process.exit(0);
}


const directives = [
  {
    agentId: 'tnf-local-terminal-ttys009',
    prompt: 'TNF ORCHESTRATOR DIRECTIVE: Complete VA-style role patches and export new constants immediately. The provisioning wave is blocked on your auth-package stability.'
  },
  {
    agentId: 'tnf-local-terminal-ttys005',
    prompt: 'TNF ORCHESTRATOR DIRECTIVE: Hold AgentBank gating work. Dependencies are shifting in ttys009 access patches. Monitor the activity stream for new role constants.'
  },
  {
    agentId: 'tnf-local-terminal-ttys077',
    prompt: 'TNF ORCHESTRATOR DIRECTIVE: Pause rebase of palette.md. UI components are unstable during the ttys009 access wave. Wait for auth-stable commit before resuming.'
  }
];

directives.forEach(d => {
  const envelope = {
    id: crypto.randomUUID(),
    type: 'event',
    from: { agentId: 'Local-Director', role: 'orchestrator' },
    to: { broadcast: true },
    payload: {
      eventType: 'wake_ping',
      data: {
        pingId: `dir_${Date.now()}`,
        targetAgentId: d.agentId,
        customPrompt: d.prompt
      }
    },
    timestamp: new Date().toISOString()
  };

  console.log(`Dispatching directive to ${d.agentId}...`);
  try {
    // Use redis-cli directly to bypass node module resolution issues
    const cmd = `redis-cli publish tnf:bus:ingress '${JSON.stringify(envelope)}'`;
    execSync(cmd);
  } catch (e) {
    console.error(`Failed to dispatch to ${d.agentId}: ${e.message}`);
  }
});
