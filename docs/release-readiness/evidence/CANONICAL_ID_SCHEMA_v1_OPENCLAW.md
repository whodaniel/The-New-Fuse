# TNF Canonical ID Schema v1.0.0

> **See Also**:
> [TNF Entity ID Taxonomy V2](/Users/danielgoldberg/Desktop/A1-Inter-LLM-Com/The-New-Fuse/docs/TNF_ENTITY_ID_TAXONOMY_V2.md) -
> Database schema documentation **Runtime Note (2026-05-17)**: TNF
> frontload/onboarding now evaluates both this v1 schema and Taxonomy v2 through
> `configs/tnf-trait-policy.json`.

## Overview

The Canonical ID system provides a unified, human-readable identifier format for
all entities in the TNF ecosystem. It is designed to be:

- **Modular**: Each component can be extended independently
- **Composable**: IDs can be combined to represent relationships
- **Extendable**: New entity types can be added without breaking existing IDs

## Format

```
TNF:<ENTITY_TYPE>:<INSTANCE_NUMBER>[:<EXTENSION>]
```

### Components

| Component         | Required | Description                                   |
| ----------------- | -------- | --------------------------------------------- |
| `TNF`             | Yes      | Namespace prefix                              |
| `ENTITY_TYPE`     | Yes      | Category of entity (see types below)          |
| `INSTANCE_NUMBER` | Yes      | Zero-padded 3-digit instance number (001-999) |
| `EXTENSION`       | No       | Optional sub-component or variant             |

## Entity Types

### System Agents (ORCHESTRATOR, BROKER, MONITOR, etc.)

| Type           | Description               | Example                |
| -------------- | ------------------------- | ---------------------- |
| `ORCHESTRATOR` | Master coordination agent | `TNF:ORCHESTRATOR:001` |
| `BROKER`       | Message/task broker       | `TNF:BROKER:001`       |
| `MONITOR`      | System monitor            | `TNF:MONITOR:001`      |
| `VALIDATOR`    | Validation agent          | `TNF:VALIDATOR:001`    |
| `ROUTER`       | Request router            | `TNF:ROUTER:001`       |
| `SCHEDULER`    | Task scheduler            | `TNF:SCHEDULER:001`    |
| `GATEWAY`      | API gateway               | `TNF:GATEWAY:001`      |

### CLI Agents

| Type           | Description           | Example                |
| -------------- | --------------------- | ---------------------- |
| `CLI_CODER`    | Code generation agent | `TNF:CLI_CODER:001`    |
| `CLI_DEBUGGER` | Debugging agent       | `TNF:CLI_DEBUGGER:001` |
| `CLI_DEVOPS`   | DevOps agent          | `TNF:CLI_DEVOPS:001`   |
| `CLI_DATABASE` | Database agent        | `TNF:CLI_DATABASE:001` |
| `CLI_GIT`      | Git agent             | `TNF:CLI_GIT:001`      |
| `CLI_SHELL`    | Shell agent           | `TNF:CLI_SHELL:001`    |
| `CLI_TESTER`   | Testing agent         | `TNF:CLI_TESTER:001`   |

### IDE Agents

| Type            | Description     | Example                 |
| --------------- | --------------- | ----------------------- |
| `IDE_VSCODE`    | VS Code agent   | `TNF:IDE_VSCODE:001`    |
| `IDE_CURSOR`    | Cursor agent    | `TNF:IDE_CURSOR:001`    |
| `IDE_WINDSURF`  | Windsurf agent  | `TNF:IDE_WINDSURF:001`  |
| `IDE_JETBRAINS` | JetBrains agent | `TNF:IDE_JETBRAINS:001` |
| `IDE_NEOVIM`    | Neovim agent    | `TNF:IDE_NEOVIM:001`    |
| `IDE_EMACS`     | Emacs agent     | `TNF:IDE_EMACS:001`     |

### Browser Agents

| Type                 | Description      | Example                      |
| -------------------- | ---------------- | ---------------------------- |
| `BROWSER_GEMINI`     | Google Gemini    | `TNF:BROWSER_GEMINI:001`     |
| `BROWSER_CLAUDE`     | Anthropic Claude | `TNF:BROWSER_CLAUDE:001`     |
| `BROWSER_CHATGPT`    | OpenAI ChatGPT   | `TNF:BROWSER_CHATGPT:001`    |
| `BROWSER_COPILOT`    | GitHub Copilot   | `TNF:BROWSER_COPILOT:001`    |
| `BROWSER_PERPLEXITY` | Perplexity AI    | `TNF:BROWSER_PERPLEXITY:001` |
| `BROWSER_PHIND`      | Phind            | `TNF:BROWSER_PHIND:001`      |

### GitHub Agents

| Type                | Description       | Example                     |
| ------------------- | ----------------- | --------------------------- |
| `GITHUB_JULES`      | GitHub Jules      | `TNF:GITHUB_JULES:001`      |
| `GITHUB_COPILOT`    | GitHub Copilot    | `TNF:GITHUB_COPILOT:001`    |
| `GITHUB_ACTIONS`    | GitHub Actions    | `TNF:GITHUB_ACTIONS:001`    |
| `GITHUB_CODESPACES` | GitHub Codespaces | `TNF:GITHUB_CODESPACES:001` |

### Research Agents

| Type                  | Description         | Example                       |
| --------------------- | ------------------- | ----------------------------- |
| `RESEARCH_WEB`        | Web research        | `TNF:RESEARCH_WEB:001`        |
| `RESEARCH_ACADEMIC`   | Academic research   | `TNF:RESEARCH_ACADEMIC:001`   |
| `RESEARCH_MARKET`     | Market research     | `TNF:RESEARCH_MARKET:001`     |
| `RESEARCH_COMPETITOR` | Competitor research | `TNF:RESEARCH_COMPETITOR:001` |

### Data Agents

| Type              | Description        | Example                   |
| ----------------- | ------------------ | ------------------------- |
| `DATA_ANALYST`    | Data analysis      | `TNF:DATA_ANALYST:001`    |
| `DATA_ENGINEER`   | Data engineering   | `TNF:DATA_ENGINEER:001`   |
| `DATA_SCIENTIST`  | Data science       | `TNF:DATA_SCIENTIST:001`  |
| `DATA_VISUALIZER` | Data visualization | `TNF:DATA_VISUALIZER:001` |

### TNF Framework Agents

| Type              | Description      | Example                   |
| ----------------- | ---------------- | ------------------------- |
| `TNF_CORE`        | Core framework   | `TNF:TNF_CORE:001`        |
| `TNF_ONBOARDING`  | Onboarding agent | `TNF:TNF_ONBOARDING:001`  |
| `TNF_COORDINATOR` | Coordinator      | `TNF:TNF_COORDINATOR:001` |
| `TNF_HANDOFF`     | Handoff agent    | `TNF:TNF_HANDOFF:001`     |
| `TNF_HEARTBEAT`   | Heartbeat agent  | `TNF:TNF_HEARTBEAT:001`   |
| `TNF_CLEANUP`     | Cleanup agent    | `TNF:TNF_CLEANUP:001`     |

## Extensions

Extensions allow for sub-components or variants:

```
TNF:ORCHESTRATOR:001:PRIMARY     # Primary orchestrator
TNF:ORCHESTRATOR:001:BACKUP      # Backup orchestrator
TNF:CLI_CODER:001:PYTHON         # Python-specialized coder
TNF:CLI_CODER:001:TYPESCRIPT     # TypeScript-specialized coder
```

## Composability

IDs can be combined to represent relationships:

```
TNF:ORCHESTRATOR:001 > TNF:VALIDATOR:001   # Orchestrator manages Validator
TNF:CLI_CODER:001 + TNF:CLI_DEBUGGER:001   # Coder paired with Debugger
```

## UUID Mapping

Each Canonical ID maps to a UUID for database storage:

```json
{
  "canonicalId": "TNF:ORCHESTRATOR:001",
  "uuid": "f7f235df-abb5-4f3f-a0f2-a2a92a8aca83",
  "name": "Antigravity",
  "type": "ORCHESTRATOR"
}
```

## Current Registry

| Canonical ID           | UUID          | Name                | Status |
| ---------------------- | ------------- | ------------------- | ------ |
| `TNF:ORCHESTRATOR:001` | `f7f235df...` | Antigravity         | ACTIVE |
| `TNF:VALIDATOR:001`    | `d0cf89dd...` | PicoClaw-Tester     | ACTIVE |
| `TNF:CLI_TESTER:001`   | `ee42321e...` | PicoClaw-Subject    | ACTIVE |
| `TNF:RESEARCH_WEB:001` | `c4ad4914...` | PicoClaw-Perplexity | ACTIVE |

## Implementation Notes

1. **Database Schema**: Add `canonicalId` column to `agents` table
2. **Validation**: Regex pattern `^TNF:[A-Z_]+:[0-9]{3}(:[A-Z_]+)?$`
3. **Uniqueness**: `(entityType, instanceNumber)` must be unique per namespace
4. **Indexing**: Index on `canonicalId` for fast lookups
5. **Resolution**: API endpoint `/agent/resolve/:canonicalId` returns UUID and
   metadata

## Future Extensions

- **Multi-tenancy**: `TNF:ORG:TYPE:INSTANCE` for organization-scoped IDs
- **Versioning**: `TNF:TYPE:INSTANCE@v2` for versioned agents
- **Aliases**: `TNF:ALIAS:name` for human-friendly names
