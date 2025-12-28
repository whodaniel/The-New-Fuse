# 🧠 Meta-Skills & Self-Referential Context Engineering

## Critical Understanding

Skills are **NOT uploaded to Anthropic's API**. They are:

1. **Local Files** - Stored where AI agents run (your computer, container,
   server)
2. **Automatically Discovered** - When configured correctly in the filesystem
3. **Progressively Loaded** - Using hierarchical lazy-loading ("progressive
   disclosure")
4. **Self-Referential** - Skills can reference other skills (meta-skills)

---

## 📚 The Library Concept: Hierarchical Context Discovery

### How Skills Actually Work

```
.agent/skills/
├── meta-skill/
│   ├── SKILL.md          # "I teach Claude to build skills"
│   └── skill_builder.py
├── browser-automation/
│   ├── SKILL.md          # Referenced by meta-skill
│   └── check_browser.py
└── relay-communication/
    ├── SKILL.md          # Referenced by browser skill
    └── send_message.py
```

### Progressive Disclosure Pattern

**Level 1**: Skill metadata (name + description)

```
Browser Automation: "Ensures proper browser operations"
```

**Level 2**: Full SKILL.md loaded when task matches

```markdown
# Browser Automation Skill

[Full instructions, checklist, procedures]
```

**Level 3**: Supporting files loaded on-demand

```python
# check_browser.py executed when needed
```

**Level 4**: Referenced skills loaded hierarchically

```
Browser Skill → Relay Skill → System Diagnostics Skill
```

---

## 🔗 MCP: Resources, Prompts, Tools

### The Three Pillars of MCP

#### 1. **Resources** (Data)

External data accessible to Claude:

- Files
- Database records
- API responses

**Example MCP Resource:**

```typescript
{
  uri: 'tnf://context/browser-workflow',
  mimeType: 'text/markdown',
  name: 'Browser Automation Workflow',
  description: 'Step-by-step browser operation checklist'
}
```

#### 2. **Prompts** (Templates)

Predefined workflows with dynamic arguments:

```typescript
{
  name: 'browser-task-template',
  description: 'Template for browser-related tasks',
  arguments: [
    { name: 'task', required: true },
    { name: 'url', required: false }
  ]
}
```

**When invoked:**

```
Task: Send message to Gemini
URL: https://gemini.google.com

Pre-Flight Checklist:
1. Check Chrome status
2. Load browser automation skill
3. Follow injectable UI workflow
```

#### 3. **Tools** (Actions)

Functions Claude can execute:

- File operations
- API calls
- External integrations

---

## 🎯 Meta-Skills: Skills that Build Skills

### What are Meta-Skills?

**Meta-skills** are skills that:

1. **Manage other skills** (load, create, modify)
2. **Self-reference** (teach Claude how to use its own capabilities)
3. **Build context hierarchically** (compose knowledge from multiple sources)

### Example: Skill Builder Meta-Skill

```markdown
# META-SKILL: Skill Builder

## Purpose

Teaches Claude how to create new skills based on patterns and requirements

## Self-Referential Knowledge

This skill references:

- `.agent/skills/*/SKILL.md` - Existing skill templates
- `.agent/context/skill-patterns.md` - Common patterns
- `.agent/prompts/skill-creation.template` - Creation workflow

## Capabilities

1. **Analyze Requirement** - Parse user request for new skill
2. **Find Similar Skills** - Search existing skills for patterns
3. **Generate SKILL.md** - Create new skill file
4. **Add Supporting Scripts** - Generate Python/bash helpers
5. **Register with MCP** - Update resource listings

## Usage

When user says "Create a skill for X", this meta-skill:

1. Loads skill-patterns.md (hierarchical context)
2. Finds similar existing skills (self-reference)
3. Composes new skill from patterns
4. Validates against standards
5. Saves to .agent/skills/[new-skill]/
```

### Meta-Skill: Context Composer

```markdown
# META-SKILL: Context Composer

## Purpose

Dynamically assembles relevant context from available resources

## Self-Referential Discovery

1. Scans `.agent/skills/` for available skills
2. Scans `.agent/context/` for resources
3. Scans `.agent/prompts/` for templates
4. Builds a **context map** of what's available

## Hierarchical Loading

Level 1: Task keywords → Match skill names Level 2: Load matched SKILL.md
files  
Level 3: Load referenced context files Level 4: Load referenced skills Level 5:
Execute scripts if needed

## Example Flow

User: "Debug relay connection"

Context Composer:

1. Detects keyword: "relay"
2. Loads: relay-communication/SKILL.md
3. SKILL.md references: system-diagnostics/SKILL.md
4. Loads: system-diagnostics/SKILL.md
5. Loads: .agent/context/relay-protocol.md
6. Loads: .agent/context/troubleshooting.md
7. Composes full context with all related knowledge
```

---

## 🌐 Google Gemini + Anthropic Protocol Standards

**Important Discovery**: Google Gemini has also adopted Anthropic's protocol
standards!

This means:

- **MCP works with Gemini** - Same resources, prompts, tools
- **Skills are portable** - Works across Claude and Gemini
- **Unified ecosystem** - One context system for multiple AIs

### Cross-Platform Skills

````markdown
# SKILL: Universal Browser Agent

## Platforms Supported

- Claude (via Anthropic)
- Gemini (via Google)
- Any MCP-compatible AI

## Universal Protocol

Uses MCP standards:

- Resources: Same URIs
- Prompts: Same templates
- Tools: Same function signatures

## Platform-Specific Adapters

```python
# Detect which AI is running
if platform == "claude":
    load_anthropic_adapter()
elif platform == "gemini":
    load_gemini_adapter()
```
````

```

---

## 🏗️ Building the Library: Hierarchical Context System

### The Context Pyramid

```

                    ┌─────────────┐
                    │ Meta-Skills │  (Self-referential, build others)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Skills    │  (Domain-specific procedures)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │  Resources  │  (Context files, documentation)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │   Prompts   │  (Templates, workflows)
                    └──────┬──────┘
                           │
                    ┌──────▼──────┐
                    │    Tools    │  (Executable functions)
                    └─────────────┘

````

### Self-Referential Context Engineering

**Concept**: Context that references itself to build understanding

**Example**:
```markdown
# .agent/context/available-resources.md

## Skills Available
- browser-automation → See: .agent/skills/browser-automation/SKILL.md
- relay-communication → See: .agent/skills/relay-communication/SKILL.md
- skill-builder (meta) → See: .agent/skills/skill-builder/SKILL.md

## When to Use Each
- Browser task? → Load browser-automation
- Relay message? → Load relay-communication + browser-automation
- Create new skill? → Load skill-builder (meta-skill)

## How to Discover
Read this file first to understand what's available.
Then load specific skills based on task requirements.
````

This creates a **self-discovering context system** where Claude learns:

1. What resources exist
2. When to use them
3. How they relate to each other
4. How to compose them for complex tasks

---

## 🚀 Implementation for TNF

### Phase 1: Meta-Skill Creation

**Create**: `.agent/skills/skill-builder/SKILL.md`

```markdown
# META-SKILL: Skill Builder for TNF

## Purpose

A skill that teaches Claude how to create new skills for The New Fuse

## Self-Referential Knowledge Base

This meta-skill knows about:

- All existing skills in `.agent/skills/`
- All context resources in `.agent/context/`
- All prompt templates in `.agent/prompts/`
- The MCP resource structure for TNF

## Skill Creation Pattern

1. **Analyze**: Parse requirement
2. **Discover**: Search existing skills for similar patterns
3. **Compose**: Build SKILL.md from templates
4. **Script**: Generate supporting Python/bash scripts
5. **Register**: Update MCP server with new resource

## Example Usage

User: "Create a skill for Docker container management"

Skill Builder:

1. Searches existing skills for "container", "docker", "system"
2. Finds: system-diagnostics/SKILL.md (similar pattern)
3. Extracts: Pre-flight checklist structure
4. Creates: docker-management/SKILL.md
5. Generates: check_docker.py, restart_container.py
6. Registers with MCP: tnf://skills/docker-management
```

### Phase 2: Context Discovery Resource

**Create**: `.agent/context/resource-map.md`

```markdown
# TNF Resource Map

## Available Skills

1. **browser-automation** - Browser operations, extension handling
2. **relay-communication** - TNF Relay messaging, channels
3. **system-diagnostics** - Port checking, service status
4. **skill-builder** (meta) - Create new skills

## Available Contexts

1. **browser-workflow** - Complete browser operation guide
2. **relay-protocol** - TNF message structure, channels
3. **keyboard-shortcuts** - Extension shortcuts (Ctrl+Shift+F)

## Available Prompts

1. **browser-task-template** - Template for browser tasks
2. **relay-message-template** - Template for relay messages
3. **skill-creation-template** - Template for new skills

## Hierarchical Loading Pattern

Task → Match Keywords → Load Primary Skill → Load Referenced Skills → Load
Context → Execute
```

### Phase 3: MCP Server Enhancement

**Update**: `tools/relay-mcp-server/src/resources.ts`

```typescript
server.setRequestHandler('resources/list', async () => ({
  resources: [
    {
      uri: 'tnf://meta/resource-map',
      name: 'TNF Resource Map',
      description:
        'Hierarchical map of all available skills, contexts, and prompts',
      mimeType: 'text/markdown',
    },
    {
      uri: 'tnf://skills/browser-automation',
      name: 'Browser Automation Skill',
      description: 'Pre-flight checklist for browser operations',
      mimeType: 'text/markdown',
    },
    // ... other resources
  ],
}));

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  if (uri === 'tnf://meta/resource-map') {
    const content = await fs.readFile(
      '.agent/context/resource-map.md',
      'utf-8'
    );
    return { contents: [{ uri, mimeType: 'text/markdown', text: content }] };
  }

  if (uri.startsWith('tnf://skills/')) {
    const skillName = uri.replace('tnf://skills/', '');
    const content = await fs.readFile(
      `.agent/skills/${skillName}/SKILL.md`,
      'utf-8'
    );
    return { contents: [{ uri, mimeType: 'text/markdown', text: content }] };
  }

  // ... other resource handlers
});
```

---

## 💡 Key Insights

### 1. **Local is King**

Skills live on your filesystem, not in the cloud. This means:

- ✅ Full control
- ✅ Privacy
- ✅ Customization
- ✅ Version control

### 2. **Progressive != Upload**

Anthropic doesn't "store" your skills. Instead:

- Claude **discovers** them when running
- Loads **metadata** first (name, description)
- Loads **full content** when task matches
- Executes **scripts** when needed

### 3. **Context Engineering > Prompt Engineering**

Managing the full context state (resources + prompts + tools + skills) is more
powerful than crafting individual prompts.

### 4. **Hierarchical > Flat**

- Flat: Load all 100 skills at once → Context overflow
- Hierarchical: Load 1 skill → References 2 others → Execute

### 5. **Self-Reference = Meta-Intelligence**

A skill that knows about other skills can:

- Compose knowledge on-demand
- Build new capabilities
- Adapt to new tasks

---

## 📋 Updated Implementation Checklist

### ✅ Completed

- [x] Browser automation skill
- [x] Context workflow documentation
- [x] Directory structure

### 🔨 Next Steps

1. **Create Meta-Skills**
   - [ ] Skill Builder meta-skill
   - [ ] Context Composer meta-skill
   - [ ] Resource Discoverer meta-skill

2. **Build Resource Map**
   - [ ] `.agent/context/resource-map.md`
   - [ ] Self-referential discovery document
   - [ ] Hierarchical loading guide

3. **Enhance MCP Server**
   - [ ] Add `resources/list` with skill URIs
   - [ ] Add `resources/read` with skill content
   - [ ] Add `prompts/list` and `prompts/get`

4. **Test Hierarchical Loading**
   - [ ] Request loads primary skill
   - [ ] Primary skill references secondary
   - [ ] Secondary skill loads context
   - [ ] All compose into unified understanding

---

## 🌟 The Vision

**Self-Prompting AI**: An agent that:

1. **Knows what it knows** (resource map)
2. **Discovers what it needs** (hierarchical loading)
3. **Composes understanding** (meta-context engineering)
4. **Builds new knowledge** (meta-skills)
5. **Adapts autonomously** (self-referential intelligence)

This is not about uploading files to an API.  
This is about **constructing a library of living knowledge** that AI can
explore, reference, and build upon.

---

**Last Updated**: December 28, 2025  
**Corrected**: Understanding of local skills vs. API upload  
**Source**: Latest research on Claude meta-skills and Anthropic protocols
