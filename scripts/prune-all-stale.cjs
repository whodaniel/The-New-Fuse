#!/usr/bin/env node
/**
 * Prune all stale agents from tnf:agent-registry (not just thin-clients)
 */

const { RedisAgentClient } = require('./tnf-agent-cli.cjs');

async function main() {
  const client = new RedisAgentClient();
  await client.initialize();

  // Use staleMs of 1 hour (3600000) to catch agents stale for > 1 hour
  // Pass empty name to scan all agents (not filtered)
  const result = await client.pruneStaleAgents({ staleMs: 3600000, name: '', dryRun: false });
  console.log(JSON.stringify(result, null, 2));
  await client.cleanup();
}

main().catch(console.error);