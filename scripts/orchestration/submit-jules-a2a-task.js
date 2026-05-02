#!/usr/bin/env node
/**
 * Submit Jules Task based on AGENT-01 findings
 * Addresses: a2a-core protocol improvements
 */

const { execSync } = require('child_process');

const task = `
<instruction>You are an expert TypeScript engineer. Run git status and review the current branch state before making changes.</instruction>

<workspace_context>
This is The New Fuse monorepo - a multi-agent AI platform built with:
- TypeScript, NestJS backend
- React frontend
- WebSocket relay for agent communication
- DACC-v1 protocol for agent coordination

Focus: packages/a2a-core - Agent-to-Agent communication library (v0.3.0)
</workspace_context>

<mission_brief>
## Task: Add DACC-v1 Signature Support to a2a-core

### Background
An agent audit identified that a2a-core v0.3.0 lacks cryptographic signing for messages, creating identity-drift risk during multi-agent handoffs.

### Steps
1. Navigate to packages/a2a-core/src/types.ts
2. Add a 'signature' field to the A2APacket interface
3. Add optional 'conatus' metadata field for agent state
4. Create a new file: packages/a2a-core/src/signing.ts with:
   - Function to sign messages with HMAC-SHA256
   - Function to verify message signatures
   - Type definitions for signed packets
5. Export signing utilities from index.ts
6. Run: pnpm build in packages/a2a-core to verify compilation

### Success Criteria
- A2APacket interface has optional 'signature' and 'metadata.conatus' fields
- signing.ts exports signMessage() and verifySignature() functions
- Package builds without errors
- No breaking changes to existing code
</mission_brief>
`;

console.log('Submitting Jules task for a2a-core DACC-v1 compliance...\n');

try {
  const result = execSync(`jules new "${task.replace(/"/g, '\\"').replace(/\n/g, '\\n')}"`, {
    encoding: 'utf8',
    stdio: 'pipe',
    maxBuffer: 1024 * 1024,
  });
  console.log('✓ Jules task submitted successfully');
  console.log(result);
} catch (error) {
  console.error('Jules task submission failed:', error.message);
  console.log('\nYou can manually submit with: jules new "<task>"');
}
