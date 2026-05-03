---
name: TNF Skill Taxonomy Integration
slug: skill-taxonomy-integration
description: Unified skill storage and discovery across TNF
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [skills, taxonomy, integration]
priority: P1
---

# TNF Skill Taxonomy Integration

## Overview

This document defines the standardized format and location for all TNF skills, ensuring consistent discovery and versioning.

## Skill Locations

| Location | Type | Format | Discovery |
|----------|------|--------|-----------|
| `.agent/skills/` | Agent skills | `SKILL.md` | Manual |
| `packages/agent/src/skill-bank/compiled/` | Compiled skills | `.md` | `tnf skills list` |

## Standard Frontmatter

All skills should include YAML frontmatter:

```yaml
---
name: Skill Name
slug: skill-slug
description: Short description of what the skill does
version: 1.0.0
author: TNF Agentic Network
created: 2026-05-03
updated: 2026-05-03
tags: [tag1, tag2]
priority: P0|P1|P2|P3
---
```

## Field Definitions

| Field | Required | Description |
|-------|----------|-------------|
| `name` | Yes | Human-readable name |
| `slug` | Yes | URL-friendly identifier |
| `description` | Yes | Short description (max 200 chars) |
| `version` | Yes | Semantic version (1.0.0) |
| `author` | No | Creator (default: TNF Agentic Network) |
| `created` | Yes | ISO date of creation |
| `updated` | Yes | ISO date of last update |
| `tags` | No | Array of searchable tags |
| `priority` | No | P0-P3 priority level |

## Discovery Commands

```bash
# List all skills
tnf skills list

# Filter by source
tnf skills list --source agent-skills
tnf skills list --source compiled

# JSON output
tnf skills list --json
```

## Skill Categories

- **P0** - Foundation (framework-consciousness, context-frontloader)
- **P1** - Core Operations (cli, planning, skills)
- **P2** - Utilities (diagnostics, env-manager)
- **P3** - Specialized (browser-automation, archaeology)

## Migration Notes

Existing skills in `.agent/skills/*/SKILL.md` should be converted to include frontmatter. Compiled skills already follow the format.

## Related Files

- `.agent/context/resource-map.md` - Master skill index
- `.agent/context/tnf-alignment-summary.md` - Quick reference
- `.agent/context/hermes-tnf-mapping.md` - CLI parity mapping