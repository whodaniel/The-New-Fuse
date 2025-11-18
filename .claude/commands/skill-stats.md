---
description: "View statistics and information about loaded Claude skills"
category: "claude-skills"
---

Display statistics and information about the Claude Skills integration in The New Fuse.

**Shows**:
- Total number of loaded skills
- Skills by category breakdown
- Available categories and tags
- Skill execution statistics
- Repository status and last update

**Example Usage**:
```
/skill-stats
/skill-stats detailed
/skill-stats category:document-processing
```

**Parameters**: $ARGUMENTS (optional: "detailed" or category filter)

**Output includes**:
- Total skills loaded
- Skills by category (e.g., 4 document-processing, 3 development-technical)
- Total categories available
- Total tags available
- Initialization status
- Repository location and version

Use this command to verify which skills are loaded and available for use.
