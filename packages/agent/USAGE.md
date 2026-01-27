# Using Clawdbot Integration

This guide explains how to run and verify the distributed agent system.

## Prerequisites

Ensure your `.env` file contains:

```bash
# Point to your Redis instance (for distributed scheduling)
REDIS_URL=redis://...

# Point to your local Cloud Sandbox (for tool execution)
CLAWD_SANDBOX_URL=ws://localhost:3000
```

## 1. Start Infrastructure

You need to run the Cloud Sandbox (the "Hands") and the Backend (the "Brain"
worker).

### Terminal A: Start Cloud Sandbox

```bash
# In apps/cloud-sandbox or root
cd apps/cloud-sandbox
pnpm start
# OR from root if script exists (it might not)
# pnpm --filter @the-new-fuse/cloud-sandbox run start
```

_Verify it says "Cloud Sandbox Server listening on port 3000"_

### Terminal B: Start Backend

```bash
pnpm dev:backend
```

_Verify it connects to Redis and logs "AgentExecutionProcessor" initialization._

## 2. Schedule a Distributed Job

Use the helper script to push a job to the Redis queue. This simulates the Agent
scheduling a proactive task.

### Terminal C: Run Schedule Script

```bash
# From root
npx tsx packages/agent/scripts/schedule-test-job.ts
```

**Expected Output (Terminal C):**

```
--- ClawdScheduler Distributed Test ---
Connecting to Redis...
Scheduling skill 'system-status' ...
✅ Task scheduled successfully via Redis!
```

**Expected Output (Terminal B - Backend):**

```
Processing execute-agent job ...
Starting agent ... with task: system-status
...
Agent execution completed
```

## 3. Run Local Demo (Optional)

To test the Agent logic immediately without the backend/distributed scheduler
(Direct Mode):

```bash
npx tsx packages/agent/examples/demo-unified-clawd.ts
```

This runs the agent locally, which connects to the Cloud Sandbox directly to
execute the skill.
