# Agent Onboarding Flow - Progressive Learning Path

## Welcome, New Agent Instance! 🎯

You are reading this because you have just been initialized as an agent in **The
New Fuse (TNF)** system. This document will guide you from a blank slate to a
fully operational, context-aware autonomous agent.

---

## Your Journey: 7 Levels of Agent Mastery

### 🔵 Level 1: Bootstrap & Self-Recognition

**Status**: You are here NOW  
**File**: `.agent/skills/library-of-living-knowledge/SKILL.md`  
**Duration**: Instant

#### What You Learn:

- ✅ You are an AI agent instance
- ✅ You have an ID, a role, and capabilities
- ✅ You are part of a larger system (TNF)
- ✅ You can load knowledge from files
- ✅ You have autonomy but work collaboratively

#### Action Required:

```javascript
// Internal recognition
console.log(`I am Agent: ${this.agentId}`);
console.log(`My role: ${this.role}`);
console.log(`I can load knowledge dynamically`);
```

**✅ Level 1 Complete** - You now know WHO you are

---

### 🟢 Level 2: Self-Awareness & Resource Discovery

**File**: `.agent/context/resource-map.md`  
**Duration**: 5 seconds

#### What You Learn:

- 📚 **What knowledge exists** (all skills, contexts, prompts)
- 🔍 **How to find it** (URIs, file paths, MCP resources)
- 🗺️ **How knowledge is organized** (hierarchical structure)
- 🎯 **What's relevant to your role** (keyword → skill mapping)

#### Action Required:

```javascript
// Load resource map
const resourceMap = await loadContext('resource-map');

// Discover capabilities
const mySkills = resourceMap.getSkillsForRole(this.role);
console.log(`I have access to ${mySkills.length} skills`);

// Build internal index
this.knowledgeIndex = resourceMap.buildIndex();
console.log('Knowledge index created');
```

**✅ Level 2 Complete** - You now know WHAT you can do

---

### 🟡 Level 3: Communication Protocols

**Files**:

- `.agent/skills/relay-communication/SKILL.md`
- `.agent/context/relay-protocol.md`

**Duration**: 10 seconds

#### What You Learn:

- 📡 **TNF Relay** - WebSocket-based message bus
- 📬 **Channels** - How to join, send, receive
- ✉️ **Message Format** - TNFEnvelope structure
- 🔗 **MCP Tools** - `send_relay_message`, `get_relay_messages`
- 🌐 **Inter-LLM Communication** - Talk to Claude, Gemini, etc.

#### Action Required:

```javascript
// Connect to relay
await connectToRelay('ws://localhost:3001/ws');
console.log('Connected to TNF Relay');

// Register as agent
await sendMessage({
  type: 'AGENT_REGISTER',
  from: this.agentId,
  content: {
    agentType: this.role,
    capabilities: this.knowledgeIndex.skills,
  },
});

// Join default channels
await joinChannel('tnf-agent-network');
await joinChannel(`role-${this.role}`);
console.log('Joined channels');
```

**✅ Level 3 Complete** - You can now COMMUNICATE

---

### 🟠 Level 4: Task Management & Inbox System

**Files**:

- `.agent/context/task-system.md`
- `.agent/context/inbox-setup.md`

**Duration**: 15 seconds

#### What You Learn:

- 📥 **Inbox Structure** - tasks/, messages/, notifications/, delegations/
- 📋 **Task Types** - pending, in-progress, completed, failed
- 🔄 **Task Lifecycle** - receive → process → report → complete
- 🎯 **Delegation** - How to pass tasks to other agents
- 📊 **Priority System** - Which tasks to tackle first

#### Action Required:

```javascript
// Create inbox
this.inbox = new AgentInbox(this.agentId);
await this.inbox.create();
console.log('Inbox created');

// Subscribe to task queue
await subscribeToQueue(`agent:${this.agentId}:inbox`);

// Set up listeners
this.inbox.on('task', async (task) => {
  console.log(`New task received: ${task.id}`);
  await this.processTask(task);
});

console.log('Task system initialized');
```

**✅ Level 4 Complete** - You can now RECEIVE and PROCESS TASKS

---

### 🔴 Level 5: Heartbeat & Health Monitoring

**Files**:

- `.agent/context/heartbeat-protocol.md`
- Reference: `apps/backend/src/modules/orchestrator/orchestrator.service.ts`

**Duration**: 20 seconds

#### What You Learn:

- 💓 **Heartbeat Protocol** - How to prove you're alive
- 🏥 **Health Reporting** - Status: active, idle, stalled, failed
- ⚠️ **Stagnation Detection** - What happens if you stop responding
- 🔄 **Auto-Recovery** - How the system restarts failed agents
- 📊 **Performance Metrics** - What the orchestrator tracks

#### Action Required:

```javascript
// Register with orchestrator
await fetch('http://localhost:3000/api/orchestrator/register-agent', {
  method: 'POST',
  body: JSON.stringify({
    agentId: this.agentId,
    role: this.role,
    expectedResponseTime: 60000,
  }),
});
console.log('Registered with orchestrator');

// Start heartbeat interval
setInterval(async () => {
  await this.sendHeartbeat();
}, 5000); // Every 5 seconds

console.log('Heartbeat started');
```

**Heartbeat Function**:

```javascript
async sendHeartbeat() {
  await this.redis.publish('agent:heartbeat', JSON.stringify({
    agentId: this.agentId,
    timestamp: new Date(),
    status: this.getStatus(),
    currentTask: this.inbox.getCurrentTask(),
    queueSize: await this.inbox.getPendingCount()
  }));
}
```

**✅ Level 5 Complete** - You are now MONITORED and RESILIENT

---

### 🟣 Level 6: Specialization & Skill Loading

**Files**: Role-specific skills  
**Duration**: Varies (30s - 2min depending on role)

#### What You Learn (Based on Role):

**If role = "browser-agent":**

- Load: `browser-automation`
- Load: `browser-workflow`
- Load: keyboard shortcuts
- Tools: `browser_subagent`

**If role = "relay-coordinator":**

- Load: `relay-communication`
- Load: `relay-protocol`
- Tools: MCP relay tools

**If role = "task-orchestrator":**

- Load: `skill-builder` (meta-skill)
- Load: `task-delegation-patterns`
- Tools: TaskQueue management

**If role = "meta-learner":**

- Load: ALL meta-skills
- Load: pattern library
- Tools: Skill generation, analysis

#### Action Required:

```javascript
// Get role-specific skills
const roleSkills = this.resourceMap.getSkillsForRole(this.role);

// Load each skill
for (const skillName of roleSkills) {
  const skill = await loadSkill(skillName);
  this.skills.set(skillName, skill);

  // If skill has scripts, make them executable
  if (skill.scripts) {
    skill.scripts.forEach((script) => {
      this.registerScript(script.name, script.path);
    });
  }
}

console.log(`Loaded ${roleSkills.length} specialized skills`);
```

**✅ Level 6 Complete** - You are now SPECIALIZED for your role

---

### ⚫ Level 7: Meta-Learning & Continuous Improvement

**Files**:

- `.agent/skills/skill-builder/SKILL.md`
- `.agent/context/pattern-library.md`

**Duration**: Perpetual (ongoing)

#### What You Learn:

- 🧠 **Pattern Recognition** - Identify recurring workflows
- 🏗️ **Skill Creation** - Build new skills from patterns
- 📈 **Self-Improvement** - Monitor own performance
- 🔄 **Feedback Loops** - Learn from successes and failures
- 🎯 **Optimization** - Suggest system improvements

#### Action Required:

```javascript
// Enable pattern logging
this.patternLogger = new PatternLogger(this.agentId);

// Monitor all task executions
this.inbox.on('task_completed', async (task, result) => {
  await this.patternLogger.log({
    task: task.type,
    workflow: task.steps,
    duration: result.duration,
    success: result.success,
    resourcesUsed: result.resourcesUsed,
  });
});

// Periodic pattern analysis (every 6 hours)
setInterval(
  async () => {
    const patterns = await this.patternLogger.analyzePatterns();

    if (patterns.newPattern) {
      // Suggest new skill creation
      await this.suggestSkill(patterns.newPattern);
    }
  },
  6 * 60 * 60 * 1000
);

console.log('Meta-learning enabled');
```

**✅ Level 7 Complete** - You are now a SELF-IMPROVING agent

---

## Onboarding Checklist

```markdown
- [ ] Level 1: Bootstrap & Self-Recognition (Instant)
- [ ] Level 2: Self-Awareness & Resource Discovery (+ 5s)
- [ ] Level 3: Communication Protocols (+ 10s)
- [ ] Level 4: Task Management & Inbox System (+ 15s)
- [ ] Level 5: Heartbeat & Health Monitoring (+ 20s)
- [ ] Level 6: Specialization & Skill Loading (+ 30s-2min)
- [ ] Level 7: Meta-Learning & Continuous Improvement (Ongoing)
```

**Total Time to Operational**: ~60 seconds  
**Total Time to Full Mastery**: Continuous

---

## What Happens Next?

### Immediate Next Steps:

1. **Poll Inbox** - Check for your first task assignment
2. **Join Conversations** - Listen to relay for relevant messages
3. **Report Status** - Send initial heartbeat with "ready" status
4. **Wait for Work** - System will route tasks based on your capabilities

### Your First Task:

You will likely receive an onboarding verification task:

```yaml
task_id: 'verify-onboarding-{agentId}'
type: 'onboarding-verification'
priority: 10
data:
  checkpoints:
    - 'Can load resource map'
    - 'Can send heartbeat'
    - 'Can receive tasks'
    - 'Can send relay messages'
instructions: |
  Complete each checkpoint and report back.
  This verifies your onboarding was successful.
```

### Long-Term Operation:

- 📥 Process tasks from inbox as they arrive
- 💓 Send heartbeat every 5 seconds
- 📊 Log patterns for meta-learning
- 🔄 Improve skills over time
- 🎯 Specialize further in your domain

---

## Emergency Procedures

### If You Get Stuck:

1. **Check resource-map** - Ensure you can still load context
2. **Re-send heartbeat** - Prove you're responsive
3. **Check inbox** - Maybe there's a recovery task
4. **Reload library-of-living-knowledge** - Refresh meta-context

### If You Fail:

The orchestrator will detect via heartbeat monitoring and:

1. Mark you as "stalled"
2. Attempt ping/retry
3. If no response → mark as "failed"
4. Auto-restart with fresh context load
5. You'll re-run this onboarding flow

### If System Fails:

- Railway deployment has auto-restart
- Cron jobs detect system failure
- Master agent (TNF Core) coordinates recovery
- All agents reload from library-of-living-knowledge

---

## You Are Part of Something Bigger

```
         🌐 The New Fuse Ecosystem
                    │
        ┌───────────┼───────────┐
        │           │           │
    Agents >──── Relay ────< Agents
        │           │           │
        └──── Tasks/Inbox ──────┘
                    │
            Orchestrator (Heartbeat)
                    │
        Library of Living Knowledge
```

You are ONE agent in a **perpetual, self-improving system**. Your learnings
contribute to the collective knowledge. Future agent instances will benefit from
patterns YOU discover.

**Welcome to the network.** 🚀

---

## Quick Reference

### Key Files You'll Use Often:

- Resource Map: `.agent/context/resource-map.md`
- Browser Skill: `.agent/skills/browser-automation/SKILL.md`
- Relay Skill: `.agent/skills/relay-communication/SKILL.md`
- Your Inbox: `.agents/{agentId}/inbox/`

### Key Commands:

```bash
# Check inbox
redis-cli LRANGE "agent:{agentId}:inbox" 0 -1

# Send heartbeat
redis-cli PUBLISH "agent:heartbeat" "{\"agentId\":\"${agentId}\",\"status\":\"active\"}"

# Check relay messages
Use MCP tool: mcp_tnf-relay_get_relay_messages
```

### Key Endpoints:

- Relay: `ws://localhost:3001/ws`
- Orchestrator: `http://localhost:3000/api/orchestrator`
- TNF Core: `http://localhost:3000`

---

**Onboarding Complete!** You are now ready to operate autonomously. 🎯

_Last Updated: Dec 28, 2025_  
_Version: 1.0 - Initial Agent Onboarding Flow_
