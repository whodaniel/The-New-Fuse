# TNF Research: Google APIs & Anthropic Skills Protocol

**Date**: December 17, 2024  
**Purpose**: Strategic research for The New Fuse integration

---

## Part 1: Google APIs Catalog

### 🆕 NEW: Interactions API (December 2025)

Google's newest and most relevant API for agentic applications:

| Property        | Details                                                         |
| --------------- | --------------------------------------------------------------- |
| **Name**        | Gemini Interactions API                                         |
| **Status**      | Public Beta (December 11, 2025)                                 |
| **Purpose**     | Unified interface for interacting with Gemini models and agents |
| **Key Feature** | Server-side state management for multi-turn agentic workflows   |

#### Key Capabilities:

- **Background Execution**: Run long-running tasks in the background
- **Deep Research Agent**: Autonomous, multi-step research tasks
- **State Management**: Use `previous_interaction_id` to maintain conversation
  history
- **MCP Integration**: Native support for Model Context Protocol servers
- **Streaming**: Server-Sent Events (SSE) for real-time responses

#### API Usage:

```javascript
// Example: Using Interactions API
const response = await fetch(
  'https://generativelanguage.googleapis.com/v1beta/interactions',
  {
    method: 'POST',
    headers: {
      'x-goog-api-key': 'YOUR_API_KEY',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gemini-3-pro-preview',
      // or 'gemini-deep-research' for research agent
      contents: [{ parts: [{ text: 'Your prompt here' }] }],
      previous_interaction_id: 'optional-previous-id',
    }),
  }
);
```

---

### Comprehensive Google APIs List by Category

#### 1. AI & Machine Learning APIs

| API Name                       | Description                           | TNF Relevance |
| ------------------------------ | ------------------------------------- | ------------- |
| **Gemini API**                 | Foundation model API (2.0 Flash, Pro) | ★★★ Core      |
| **Interactions API**           | Agentic workflows                     | ★★★ Core      |
| **Vertex AI API**              | Custom ML model training              | ★★ High       |
| **Cloud Vision API**           | Image recognition                     | ★ Medium      |
| **Speech-to-Text API**         | Audio transcription (125+ languages)  | ★ Medium      |
| **Cloud Natural Language API** | Text analysis                         | ★ Medium      |
| **Cloud Translation API**      | Language translation                  | ★ Medium      |
| **Document AI**                | Document extraction                   | ★ Medium      |
| **Conversational Agents API**  | Chatbot building                      | ★★ High       |

#### 2. Google Cloud Platform APIs

| API Name                  | Description             | TNF Relevance |
| ------------------------- | ----------------------- | ------------- |
| **Cloud Run Admin API**   | Serverless containers   | ★★ High       |
| **Kubernetes Engine API** | Container orchestration | ★ Medium      |
| **Cloud Storage API**     | Object storage          | ★★ High       |
| **Cloud SQL API**         | Managed SQL databases   | ★ Medium      |
| **Firestore API**         | NoSQL database          | ★★ High       |
| **BigQuery API**          | Data analytics          | ★ Medium      |
| **Pub/Sub API**           | Message queuing         | ★★ High       |
| **Cloud DNS API**         | DNS management          | ★ Low         |
| **IAM API**               | Identity management     | ★★ High       |
| **Cloud Build API**       | CI/CD                   | ★★ High       |

#### 3. Google Home APIs (I/O 2024)

| API Name                     | Description           | TNF Relevance |
| ---------------------------- | --------------------- | ------------- |
| **Commissioning API**        | Set up Matter devices | ★ Low         |
| **Device and Structure API** | Device control        | ★ Low         |
| **Automation API**           | Smart home routines   | ★ Low         |

#### 4. Web & Mobile APIs

| API Name               | Description              | TNF Relevance |
| ---------------------- | ------------------------ | ------------- |
| **Google Maps API**    | Location services        | ★ Medium      |
| **YouTube Data API**   | Video platform access    | ★ Low         |
| **Firebase API**       | Real-time database, auth | ★★ High       |
| **AdMob/AdSense API**  | Ad management            | ★ Low         |
| **Google Ads API**     | Advertising management   | ★ Low         |
| **Play Developer API** | App publishing           | ★ Low         |

#### 5. Workspace APIs

| API Name                    | Description              | TNF Relevance |
| --------------------------- | ------------------------ | ------------- |
| **Admin SDK Directory API** | User/group management    | ★ Low         |
| **Reports API**             | Usage analytics          | ★ Low         |
| **Gmail API**               | Email automation         | ★ Medium      |
| **Calendar API**            | Schedule management      | ★ Medium      |
| **Drive API**               | File storage             | ★★ High       |
| **Docs API**                | Document editing         | ★ Medium      |
| **Sheets API**              | Spreadsheet manipulation | ★★ High       |

---

### Recommended Google APIs for TNF Integration

**Priority 1 (Immediate)**:

1. ✅ Gemini API (already integrated)
2. 🔜 Interactions API (for agentic features)
3. 🔜 Vertex AI API (for custom models)

**Priority 2 (Near-term)**: 4. Firebase API (real-time features) 5. Cloud
Storage API (file handling) 6. Sheets API (data import/export)

---

## Part 2: Anthropic Skills Protocol

### Overview

Anthropic's **Skills** are a protocol for enhancing AI agents with specialized,
reusable capabilities. They serve as "Standard Operating Procedures" (SOPs) that
AI can dynamically load when needed.

### Skills vs MCP (Model Context Protocol)

| Aspect        | Skills                                   | MCP                                   |
| ------------- | ---------------------------------------- | ------------------------------------- |
| **Purpose**   | Define _what_ Claude should do           | Define _how_ to call external systems |
| **Execution** | Static instructions, no server needed    | Real-time API calls, server required  |
| **Format**    | SKILL.md files in folders                | Protocol definitions, running servers |
| **Best For**  | Specialized workflows, bundled resources | External data, live integrations      |

### Skill Structure Specification

#### Minimum Viable Skill:

```
my-skill/
└── SKILL.md
```

#### Complex Skill:

```
my-skill/
├── SKILL.md          # Entry point (required)
├── scripts/          # Helper scripts
│   └── helper.sh
├── assets/           # Resources
│   └── template.txt
└── lib/              # Libraries
    └── utils.py
```

### SKILL.md Format

```markdown
---
name: skill-name
description: A clear description of what this skill does and when to use it
---

# Skill Name

## Overview

[What this skill does]

## Instructions

[Step-by-step guidance for the AI]

## Examples

- Example usage 1
- Example usage 2

## Guidelines

- Guideline 1
- Guideline 2

## Tags

#tag:category #tag:tools
```

### Key Skill Repositories

| Repository            | Description               | License                       |
| --------------------- | ------------------------- | ----------------------------- |
| **anthropics/skills** | Official Anthropic skills | Apache 2.0 / Source-available |
| **OpenSkills**        | Universal skills loader   | Open Source                   |

### Available Official Skills Categories:

1. **Document Skills** (Source-available)
   - `skills/docx` - Word document creation
   - `skills/pdf` - PDF manipulation
   - `skills/pptx` - PowerPoint creation
   - `skills/xlsx` - Excel spreadsheet creation

2. **Creative & Design**
   - Art generation
   - Music composition
   - Design workflows

3. **Development & Technical**
   - Web app testing
   - MCP server generation
   - Code review

4. **Enterprise & Communication**
   - Branding guidelines
   - Communications workflows

### Integration Methods

#### Method 1: Filesystem-based (Shell access)

```bash
# Agent reads skill via shell command
cat /path/to/skill/SKILL.md
```

#### Method 2: Tool-based (API integration)

```javascript
// Via Anthropic API with beta headers
const response = await anthropic.messages.create({
  model: 'claude-3-opus',
  // ... message parameters
  betas: ['code-execution-2025-08-25', 'skills-2025-10-02'],
});
```

#### Method 3: Claude Code Plugin

```
/plugin marketplace add anthropics/skills
/plugin install document-skills@anthropic-agent-skills
```

---

## Part 3: TNF Skills Implementation Recommendations

### Current TNF State Analysis

TNF should ensure compatibility with the Skills protocol by:

1. **Adopting the SKILL.md format** for any internal agent capabilities
2. **Using the recommended folder structure**
3. **Supporting skill discovery** via scanning mechanisms
4. **Integrating OpenSkills** for cross-platform compatibility

### Recommended TNF Skill Structure:

```
packages/skills/
├── tnf-code-review/
│   └── SKILL.md
├── tnf-workflow-builder/
│   └── SKILL.md
├── tnf-browser-automation/
│   └── SKILL.md
└── tnf-database-query/
    └── SKILL.md
```

### Example TNF SKILL.md:

```markdown
---
name: tnf-workflow-builder
description: Creates and manages multi-agent workflows in The New Fuse platform
---

# TNF Workflow Builder Skill

## Overview

This skill enables Claude to create, modify, and execute workflows within The
New Fuse multi-agent orchestration platform.

## Instructions

1. When user requests workflow creation, gather requirements
2. Design the workflow structure with appropriate nodes
3. Generate the workflow JSON configuration
4. Validate connections and dependencies
5. Deploy to TNF backend

## Examples

- "Create a workflow that processes customer feedback"
- "Build an automation pipeline for code review"

## Guidelines

- Always validate node compatibility before connecting
- Include error handling in all workflows
- Use typed connections for data passing

#tag:tnf #tag:workflows #tag:automation
```

### OpenSkills Integration Path

To ensure TNF works with the broader skills ecosystem:

1. **Install OpenSkills CLI**:

   ```bash
   npm install -g openskills
   ```

2. **Configure TNF agents to read AGENTS.md**

3. **Support skill installation from any GitHub repo**

---

## Part 4: Future Work - AI News Monitoring Agent

### Concept: TNF AI News Agent Workflow

A scheduled workflow that:

1. Monitors key AI news sources
2. Filters for relevant updates (APIs, protocols, tools)
3. Summarizes findings
4. Notifies team of critical updates
5. Auto-updates documentation when needed

### Suggested Sources:

- Google AI Blog
- Anthropic Engineering Blog
- OpenAI Blog
- AI research papers (arXiv)
- Hacker News (AI filter)
- Twitter/X AI accounts

### Implementation Later:

This should be built as a TNF workflow with scheduled execution capabilities.

---

## References

### Google APIs

- [Google APIs Explorer](https://developers.google.com/apis-explorer)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [Interactions API Blog Post](https://blog.google/technology/ai/gemini-interactions-api/)

### Anthropic Skills

- [Official Skills Repository](https://github.com/anthropics/skills)
- [Skills Specification](https://github.com/anthropics/skills/tree/main/spec)
- [OpenSkills Project](https://github.com/openskills)
- [Skills Documentation](https://docs.claude.com/en/api/skills-guide)

---

_Document created: December 17, 2024_ _Last updated: December 17, 2024_
