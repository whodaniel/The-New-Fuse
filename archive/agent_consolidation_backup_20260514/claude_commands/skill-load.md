---
description: "Load and initialize Claude skills from Anthropic's repository"
category: "claude-skills"
---

Load specific Claude skills or all available skills from Anthropic's official skills repository.

**Usage**:
```
/skill-load all                    # Load all available skills
/skill-load pdf xlsx pptx         # Load specific skills
/skill-load category:document      # Load all document processing skills
/skill-load priority              # Load priority skills for development
```

**Parameters**: $ARGUMENTS (skill names, "all", or filters)

**Priority Skills** (automatically loaded):
- mcp-builder
- pdf
- xlsx
- webapp-testing
- skill-creator

**What happens**:
1. Clones/updates Anthropic's skills repository
2. Parses skill definitions from SKILL.md files
3. Registers skills with The New Fuse resource registry
4. Makes skills available via MCP server
5. Creates tool endpoints for skill execution

**After loading**, skills are available as:
- MCP resources (`skill://skill-name`)
- MCP tools (`skill_skill_name`)
- Slash commands (`/skill-<name>`)

**Statistics**: Use `/skill-stats` to see loaded skills and usage information.
