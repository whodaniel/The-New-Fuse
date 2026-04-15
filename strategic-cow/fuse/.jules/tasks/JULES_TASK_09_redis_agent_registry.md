<instruction>You are an expert software engineer. You are working on a WIP
branch. Please run `git status` and `git diff` to understand the changes and the
current state of the code. Analyze the workspace context and complete the
mission brief.</instruction> <workspace_context> This is a NestJS monorepo for
an AI Agent Orchestration Engine called "The New Fuse". The system uses Redis
for real-time agent coordination. There should be agent registry functionality
for tracking online agents, their heartbeats, and capabilities.
</workspace_context> <mission_brief>

## Task: Audit and Improve Redis Agent Registry

Audit the existing Redis-based agent registry implementation and improve it.

### Steps:

1. Search for existing Redis agent registry code:
   - `grep -r "AgentRegistry" packages/`
   - `grep -r "redis.*agent" packages/`
   - Check `packages/core/src/redis/` or similar directories
2. Document what exists:
   - How agents register themselves
   - Heartbeat mechanism
   - How agents are discovered
3. Identify improvements needed:
   - Add agent capability indexing for fast discovery
   - Implement agent health scoring
   - Add automatic cleanup of stale registrations
   - Ensure atomic operations for concurrent access
4. Implement missing functionality:
   - `registerAgent(agentId, capabilities, metadata)`
   - `updateHeartbeat(agentId)`
   - `findAgentsByCapability(capability)`
   - `getHealthyAgents()`
   - `deregisterAgent(agentId)`
5. Add proper TypeScript types
6. Write unit tests if testing framework is available

### Success Criteria:

- Registry handles agent lifecycle (register, heartbeat, deregister)
- Capability-based agent discovery works
- Stale agents are automatically cleaned up
- No race conditions in concurrent operations </mission_brief>
