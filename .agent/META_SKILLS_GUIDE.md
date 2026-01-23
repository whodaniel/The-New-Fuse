# Meta-Skills & Super-Skills Guide - The New Fuse

**Date**: December 29, 2025 **Status**: Complete Documentation of TNF's
Meta-Skill Architecture

---

## 🎯 What Are Meta-Skills?

Meta-skills are **skills that manage other skills**. Unlike regular skills that
perform specific tasks, meta-skills:

1. **Self-reference** - They know about their own capabilities
2. **Manage knowledge** - Load, create, and modify other skills
3. **Build context hierarchically** - Compose knowledge from multiple sources
4. **Enable autonomy** - Allow agents to bootstrap themselves
5. **Drive evolution** - Create new skills based on learned patterns

### The Hierarchy

```
┌─────────────────────────────────────────┐
│         META-SKILLS (Top Level)          │
│  Manage the entire skill ecosystem       │
│                                          │
│  • library-of-living-knowledge           │
│  • skill-builder                         │
└──────────────┬───────────────────────────┘
               │
               ├── Loads & orchestrates
               │
┌──────────────▼───────────────────────────┐
│           REGULAR SKILLS                  │
│  Perform specific domain tasks            │
│                                           │
│  • browser-automation                     │
│  • relay-communication                    │
│  • jules-delegation                       │
│  • system-diagnostics                     │
│  • + 43 more (including 16 Anthropic)     │
└───────────────────────────────────────────┘
```

---

## 📚 The Two Primary Meta-Skills in TNF

### 1. Library of Living Knowledge

**Location**: `.agent/skills/library-of-living-knowledge/SKILL.md`

**Type**: Foundational Meta-Skill

**Purpose**: The entry point to TNF's self-prompting, self-improving knowledge
system.

#### What It Does

```typescript
interface LibraryOfLivingKnowledge {
  // Core Functions
  bootstrapAgent(): void; // Load meta-context instantly
  orchestrateResources(): void; // Dynamic skill/context allocation
  chainPrompts(): void; // Guide through complex workflows
  manageInboxes(): void; // Agent task delegation
  selfImprove(): void; // Continuous learning loop

  // Knowledge Management
  loadedSkills: Map<string, Skill>;
  loadedContexts: Map<string, Context>;
  dynamicContext: DynamicContext;

  // Evolution
  patterns: LearnedPattern[];
  improvements: SystemImprovement[];
}
```

#### Key Capabilities

1. **Instant Meta-Context Loading**
   - New agents load this first
   - Gain full system awareness in seconds
   - Know what they know and what's available

2. **Dynamic Resource Orchestration**
   - Prompt chaining architecture
   - Context-aware skill loading
   - Tool enablement based on task

3. **Agent Inbox System**
   - Per-agent task queues
   - Message routing
   - Delegation chains

4. **Perpetual Self-Improvement**
   - Pattern extraction (6-hour cron)
   - Skill generation via skill-builder
   - Automated testing and refinement

#### Bootstrap Sequence

```javascript
Agent Initializes
  ↓
Load: library-of-living-knowledge/SKILL.md (THIS FILE)
  ↓
Read: .agent/context/resource-map.md
  ↓
Load: .agent/context/agent-onboarding.md
  ↓
Agent has full meta-context and knows what it knows
```

**Result**: Agent is operational in < 60 seconds

---

### 3. Context Frontloader (NEW) ⭐⭐⭐

**Location**: `.agent/skills/context-frontloader/SKILL.md`

**Type**: Foundational Context Meta-Skill

**Purpose**: Ensures every agent session starts with full ecosystem awareness.
Inspired by the **Ralph Wiggum Technique**.

#### What It Does

```typescript
interface ContextFrontloader {
  // Core Functions
  injectIdentity(): void; // Establish TNF identity (SYSTEM_PROMPT.md)
  discoverCapabilities(): void; // Map skills via resource-map.md
  restoreSession(): void; // Load handoff_notes.txt & planning files
  syncMemories(): void; // Load accumulated wisdom from memories.md
  verifyContext(): boolean; // Verify alignment before execution
}
```

#### Key Capabilities

1. **Identity & Ecosystem Injection**
   - Auto-injects `.agent/SYSTEM_PROMPT.md`
   - Establishes core identity and meta-rules at startup.

2. **Ralph Wiggum "Fresh Context" Implementation**
   - Each session/loop is treated as a clean slate.
   - Forces re-reading of specs, plans, and patterns to ensure reliability.

3. **Multi-Platform Consistency**
   - Standardizes frontloading across Antigravity, Claude, and VS Code.

#### Bootstrap Sequence (Updated)

```javascript
Agent Initializes
  ↓
Load: context-frontloader/SKILL.md (THIS SKILL)
  ↓
Read: .agent/SYSTEM_PROMPT.md
  ↓
Read: .agent/context/resource-map.md
  ↓
Read: .agent/handoff_notes.txt & .agent/memories.md
  ↓
Agent has 100% ecosystem awareness
```

---

### 4. Skill Builder (Previously #2)

#### What It Does

```typescript
interface SkillBuilder {
  // Analysis
  analyzeRequirement(task: UserRequest): SkillRequirements;

  // Pattern Matching
  discoverSimilarPatterns(domain: string): ExistingPattern[];

  // Generation
  composeNewSkill(requirements: SkillRequirements): Skill;
  generateSupportingScripts(skill: Skill): Script[];

  // Registration
  registerWithMCP(skill: Skill): void;
  updateResourceMap(skill: Skill): void;

  // Learning
  extractPattern(skill: Skill): Pattern;
  refineTemplates(successfulSkills: Skill[]): void;
  buildRelationships(skills: Skill[]): SkillGraph;
}
```

#### Skill Creation Workflow

**5-Step Process**:

1. **Analyze Requirement**
   - Extract domain, actions, dependencies, frequency
   - Example: "Create a Docker management skill"

2. **Discover Similar Patterns**
   - Search existing skills
   - Find reusable patterns
   - Example: `system-diagnostics` pattern

3. **Compose New Skill**
   - Use template structure
   - Add domain-specific content
   - Include pre-flight checklist

4. **Generate Supporting Scripts**
   - Create helper scripts
   - Add validation checks
   - Build test cases

5. **Register with MCP**
   - Update resource map
   - Expose via MCP server
   - Make discoverable

#### Skill Patterns Library

The skill-builder knows these patterns:

```markdown
Pattern 1: System Check Skill Pre-flight → Check Status → Report → Action if
Needed

Pattern 2: Communication Skill Connect → Authenticate → Send → Verify Receipt →
Handle Response

Pattern 3: Configuration Skill Read Current → Backup → Modify → Validate → Apply
→ Verify

Pattern 4: Diagnostic Skill Collect Info → Analyze → Identify Issue → Suggest
Fix → Verify
```

#### Self-Improvement Loop

```
┌─────────────────────────────────────────────┐
│    Skill Builder Self-Improvement Cycle      │
└──────────────────┬──────────────────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  1. New skill created       │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  2. Extract pattern         │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  3. Update templates        │
     └─────────────┬──────────────┘
                   │
     ┌─────────────▼──────────────┐
     │  4. Build relationships     │
     └─────────────┬──────────────┘
                   │
                   └────────► Better skills next time
```

---

## 🔄 How Meta-Skills Work Together

### The Perpetual System Architecture

```
┌────────────────────────────────────────────────────────┐
│              THE PERPETUAL SYSTEM                      │
└─────────────────────┬──────────────────────────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  1. Agent Spawns            │
        │  Loads: library-of-living-  │
        │         knowledge           │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  2. Agent executes tasks    │
        │  Uses: Regular skills       │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  3. Patterns emerge         │
        │  Logged: Interactions       │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  4. Cron: Extract patterns  │
        │  (Every 6 hours)            │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  5. skill-builder creates   │
        │  New skills from patterns   │
        └─────────────┬──────────────┘
                      │
        ┌─────────────▼──────────────┐
        │  6. Add to resource-map     │
        │  Update library-of-living-  │
        │  knowledge                  │
        └─────────────┬──────────────┘
                      │
                      └────► Future agents auto-discover new skills
```

### Example: Browser Communication Task

**Using Library of Living Knowledge**:

```yaml
chain_id: 'browser-inter-llm-communication'
name: 'Send Message to Gemini'

steps:
  - step: 1
    prompt: 'Analyze task requirements'
    skills: []
    context: ['resource-map']

  - step: 2
    prompt: 'Load browser-automation skill'
    skills: ['browser-automation']
    context: ['browser-workflow', 'keyboard-shortcuts']

  - step: 3
    prompt: 'Execute pre-flight checklist'
    # Auto-loaded by library-of-living-knowledge

  - step: 4
    prompt: 'Open injectable panel'
    skills: ['browser-automation']
    tools: ['browser_subagent']

  - step: 5
    prompt: 'Send relay message'
    skills: ['relay-communication']
    tools: ['mcp_tnf-relay_send_relay_message']

  - step: 6
    prompt: 'Wait for response'
    skills: ['relay-communication']
    tools: ['mcp_tnf-relay_get_relay_messages']
```

**Meta-skill orchestrates**:

- Which skills to load
- When to load them
- What tools to enable
- How to chain prompts

---

## 🚀 Agent Onboarding with Meta-Skills

### Progressive Learning Path (7 Levels)

**Powered by Library of Living Knowledge**

```markdown
Level 1: Bootstrap (Instant - 1 second) File:
library-of-living-knowledge/SKILL.md Learn: You are an agent in TNF. You have
capabilities.

Level 2: Self-Awareness (5 seconds) File: .agent/context/resource-map.md Learn:
What you know, what you can do, where to find knowledge Action: Scan available
skills/contexts/tools

Level 3: Communication (10 seconds) Files: relay-communication/SKILL.md,
relay-protocol.md Learn: How to send/receive messages, use channels Action:
Register with relay, join channels

Level 4: Task Management (15 seconds) Files: task-system.md, inbox-setup.md
Learn: How to receive tasks, delegate work, report progress Action: Create
inbox, subscribe to task queue

Level 5: Heartbeat & Health (20 seconds) Files: heartbeat-protocol.md,
orchestrator.service.ts Learn: How to stay alive, report health, recover from
failure Action: Start heartbeat, register with orchestrator

Level 6: Specialization (30s-2min) Files: Load skills based on role Learn:
Domain-specific skills for your purpose Action: Load specialized skills (e.g.,
browser-automation)

Level 7: Meta-Learning (Continuous - Perpetual) Files: skill-builder/SKILL.md,
pattern-library.md Learn: How to create new skills, improve existing ones
Action: Monitor own performance, suggest improvements
```

**Total time to fully operational**: ~60 seconds

---

## 💡 Use Cases for Meta-Skills

### 1. Self-Bootstrapping Agents

**Scenario**: New agent instance spawns

```javascript
async function agentInitialize(agentId, role) {
  // STEP 1: Load meta-context
  const metaContext = await loadSkill('library-of-living-knowledge');

  // STEP 2: Discover available resources
  const resourceMap = await loadContext('resource-map');
  const availableSkills = resourceMap.getSkillsForRole(role);

  // STEP 3: Follow onboarding
  await followOnboardingPath(role);

  // STEP 4: Agent is ready
  return { status: 'ready', skills: availableSkills };
}
```

### 2. Dynamic Skill Creation

**Scenario**: Need a new capability

```bash
User: "Create a skill for managing Docker containers"

# skill-builder meta-skill activates
1. Analyzes requirement
2. Finds similar pattern (system-diagnostics)
3. Composes new skill
4. Generates scripts
5. Registers with MCP
6. New skill available to all agents
```

### 3. Pattern-Based Evolution

**Scenario**: System learns from usage

```typescript
// Cron job (every 6 hours)
async function consolidateKnowledge() {
  // 1. Analyze agent interactions
  const interactions = await getRecentInteractions();

  // 2. Extract patterns
  const patterns = await extractPatterns(interactions);

  // 3. skill-builder creates new skills
  for (const pattern of patterns) {
    const newSkill = await skillBuilder.composeSkill(pattern);
    await registerSkill(newSkill);
  }

  // 4. Update library-of-living-knowledge
  await updateMetaContext(newSkills);
}
```

---

## 📊 Current TNF Skill Ecosystem

### Meta-Skills (2)

1. **library-of-living-knowledge** - System bootstrap & orchestration
2. **skill-builder** - Skill generation & pattern learning

### Regular Skills (45+)

**TNF Native Skills** (29):

- browser-automation
- relay-communication
- jules-delegation
- system-diagnostics
- - 25 more in `.agent/`

**Anthropic Skills** (16):

- Document: docx, pdf, pptx, xlsx
- Development: mcp-builder, webapp-testing, skill-creator
- Creative: frontend-design, canvas-design, algorithmic-art, theme-factory
- Communication: doc-coauthoring, internal-comms, slack-gif-creator
- - more

---

## 🎓 Creating Your Own Meta-Skill

### When to Create a Meta-Skill

Create a meta-skill when you need to:

- Manage a category of related skills
- Orchestrate complex multi-skill workflows
- Build self-improving systems
- Create skill generators for specific domains

### Template Structure

```markdown
# META-SKILL: [Name]

## Purpose

[What this meta-skill manages/orchestrates]

## What is a Meta-Skill?

[Explain the concept in your domain]

## Self-Referential Knowledge Base

This meta-skill has knowledge of:

1. [Resource type 1]
2. [Resource type 2]

## [Domain] Workflow

[Multi-step process this meta-skill orchestrates]

## Meta-Skill Self-Improvement

How this skill evolves itself

## Integration with TNF

How it fits into the ecosystem

## Auto-loading Triggers

Keywords/patterns that activate this meta-skill
```

---

## 🔮 Future of Meta-Skills in TNF

### Planned Enhancements

1. **Multi-level Meta-Skills**
   - Meta-meta-skills that manage meta-skills
   - Recursive self-improvement

2. **Cross-domain Pattern Recognition**
   - Identify patterns across different skill domains
   - Synthesize hybrid skills

3. **Collaborative Skill Building**
   - Multiple agents contribute to skill creation
   - Consensus-based pattern validation

4. **Skill Deprecation & Evolution**
   - Auto-detect obsolete skills
   - Evolve skills based on usage metrics

---

## 📚 Related Documentation

- [THE_PERPETUAL_SYSTEM.md](./../THE_PERPETUAL_SYSTEM.md) - Complete system
  architecture
- [library-of-living-knowledge/SKILL.md](./library-of-living-knowledge/SKILL.md) -
  Foundational meta-skill
- [skill-builder/SKILL.md](./skill-builder/SKILL.md) - Skill generation
  meta-skill
- [resource-map.md](./../context/resource-map.md) - All available resources
- [agent-onboarding.md](./../context/agent-onboarding.md) - Progressive learning
  path

---

## 🎯 Key Takeaways

1. **Meta-skills manage other skills** - They're the orchestration layer
2. **Library of Living Knowledge** - Bootstraps all agents with meta-context
3. **Skill Builder** - Creates new skills from patterns
4. **Self-improvement loop** - System evolves continuously
5. **Perpetual operation** - Once activated, runs autonomously

**Meta-skills are the secret sauce that makes TNF self-evolving and
autonomous.**

---

**Last Updated**: December 29, 2025 **Version**: 1.0 **Status**: Living Document
(evolves with system)
