# META-SKILL: TNF Skill Builder

## Purpose

A meta-skill that teaches Claude how to create new skills for The New Fuse based
on patterns and requirements.

## What is a Meta-Skill?

A skill that:

- Manages other skills (load, create, modify)
- Self-references (knows about its own capabilities)
- Builds context hierarchically (composes knowledge from multiple sources)

## Self-Referential Knowledge Base

This meta-skill has knowledge of:

1. **All existing skills** in `.agent/skills/`
2. **All context resources** in `.agent/context/`
3. **All prompt templates** in `.agent/prompts/`
4. **The MCP resource structure** for TNF
5. **Common skill patterns** and best practices

## Skill Creation Workflow

### Step 1: Analyze Requirement

Parse the user's request to extract:

- **Domain**: What area does this skill cover? (browser, network, database,
  etc.)
- **Actions**: What specific operations are needed?
- **Dependencies**: What other skills/tools are required?
- **Frequency**: How often will this be used?

### Step 2: Discover Similar Patterns

Search existing skills for similar patterns:

```bash
# Find skills in similar domain
ls -la .agent/skills/ | grep -i [domain]

# Read existing skill structures
cat .agent/skills/*/SKILL.md | grep "## Purpose"
```

### Step 3: Compose New Skill

Build `SKILL.md` using this template:

````markdown
# [Skill Name]

## Purpose

[Clear statement of what this skill does]

## Pre-Flight Checklist

[Step-by-step verification before execution]

## Self-Referential Knowledge

This skill references:

- `.agent/skills/[related-skill]/SKILL.md`
- `.agent/context/[related-context].md`

## Workflow Diagram

```
[ASCII diagram of process flow]
```

## Common Mistakes to Avoid

[List of antipatterns]

## Testing

[How to verify the skill works]

## Integration with TNF

[How this skill fits into the TNF ecosystem]
````

### Step 4: Generate Supporting Scripts

Create helper scripts based on skill requirements:

**For system checks**:

```python
#!/usr/bin/env python3
import subprocess
import sys

def check_status():
    # Implementation
    pass

if __name__ == "__main__":
    sys.exit(check_status())
```

**For operations**:

```bash
#!/bin/bash
# Skill: [name]
# Purpose: [description]

set -e

# Implementation
```

### Step 5: Register with MCP

Update TNF Relay MCP server to expose the new skill:

```typescript
{
  uri: 'tnf://skills/[skill-name]',
  name: '[Skill Name]',
  description: '[Brief description]',
  mimeType: 'text/markdown'
}
```

## Example: Creating a Docker Management Skill

### User Request

"Create a skill for managing Docker containers in TNF"

### Skill Builder Process

1. **Analyze**:
   - Domain: Infrastructure/Containers
   - Actions: Start, stop, check status, view logs
   - Dependencies: Docker CLI, system access
   - Frequency: Medium (CI/CD, development)

2. **Discover**:
   - Similar skill: `system-diagnostics` (checks system status)
   - Pattern: Pre-flight checklist → Execute → Verify
   - Script pattern: Python subprocess calls

3. **Compose SKILL.md**:

   ```markdown
   # Docker Management Skill

   ## Purpose

   Manage Docker containers for TNF services

   ## Pre-Flight Checklist

   1. ✅ Check Docker is installed
   2. ✅ Verify Docker daemon running
   3. ✅ Confirm user has docker permissions

   ## Self-Referential Knowledge

   - Extends: `.agent/skills/system-diagnostics/SKILL.md`
   - Uses context: `.agent/context/tnf-architecture.md`
   ```

4. **Generate Scripts**:
   - `check_docker.py` - Verify Docker status
   - `manage_container.py` - Start/stop/restart containers
   - `get_logs.sh` - Retrieve container logs

5. **Register**:
   ```typescript
   {
     uri: 'tnf://skills/docker-management',
     name: 'Docker Management Skill',
     description: 'Manage Docker containers for TNF services'
   }
   ```

## Skill Patterns Library

### Pattern 1: System Check Skill

Used for: Verifying prerequisites

```
Pre-flight → Check Status → Report → Action if Needed
```

### Pattern 2: Communication Skill

Used for: Inter-service messaging

```
Connect → Authenticate → Send → Verify Receipt → Handle Response
```

### Pattern 3: Configuration Skill

Used for: System configuration

```
Read Current → Backup → Modify → Validate → Apply → Verify
```

### Pattern 4: Diagnostic Skill

Used for: Troubleshooting

```
Collect Info → Analyze → Identify Issue → Suggest Fix → Verify
```

## Meta-Skill Self-Improvement

This skill can improve itself by:

1. **Learning from Patterns**: When a new skill is created, extract its pattern
2. **Updating Templates**: Refine templates based on successful skills
3. **Building Relationships**: Track which skills commonly work together

## Integration with TNF

This meta-skill is **automatically loaded** when Claude detects keywords:

- "create skill"
- "new skill"
- "build capability"
- "add functionality"

It then:

1. Reads the resource map
2. Analyzes existing skills
3. Composes a new skill
4. Writes to `.agent/skills/[new-skill]/`
5. Updates MCP server configuration

## Version History

- **v1.0** (Dec 28, 2025): Initial meta-skill creation
- **Future**: Add AI-assisted pattern extraction

## Notes

This is a **living skill** - it evolves as more skills are created and patterns
emerge.
