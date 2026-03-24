---
name: skill-synthesizer
description: Explores existing skills and dreams up ways to combine two or more into powerful conglomerate skills. Use when a user wants to discover synergies between disparate capabilities or design multi-tool workflows.
---

# Skill Synthesis & Conglomeration

This skill empowers Gemini CLI to act as a "Skill Architect," identifying potential synergies between separate skills and proposing new, combined capabilities that are more powerful than the sum of their parts.

## Workflow

1. **Inventory**: Use `/skills list` or `list_directory` to understand the available skills.
2. **Structural Analysis**: Read the `SKILL.md` and `scripts/` of candidate skills. Identify overlapping toolsets, complementary domain knowledge, or potential data handoffs.
3. **Synergy Prototyping**: "Dream up" a conglomerate skill. For example:
    - `screenshot` + `openai-docs` = `ui-to-docs-mapper` (Take a screenshot of a UI, find relevant docs, and explain how to code it).
    - `git-yeet` + `playwright` = `auto-qa-deployer` (Verify a build in browser before automatically opening a PR).
4. **Conglomerate Design**: Draft a new `SKILL.md` for the combined capability, ensuring it utilizes the underlying resources of both parent skills efficiently.

## Conglomeration Patterns

### Tool Complement
Combine a "Tool" skill (e.g., Browser automation) with a "Knowledge" skill (e.g., Brand guidelines) to create an automated validator.

### Pipeline Chain
Connect skills in a sequential sequence (Skill A output -> Skill B input).

### Perspective Mashup
Combine a "Developer" skill with an "Auditor" skill to create a self-correcting development loop.

## Example usage

"Explore my skills and dream up a way to combine the `stitch-direct` skill with the `react-components` skill to create an autonomous UI factory."

## Ongoing Improvement

- **Persistent Learning Log**: Maintain a `notes/` directory within this skill. After each synthesis task, append an entry to `notes/session-log.md` detailing the approach taken, the quality of the resulting conglomerate, and any 'lessons learned' for future agents.
- **Success Documentation**: When a particularly powerful or creative conglomerate skill is designed, capture its `SKILL.md` and logic in `references/success-patterns.md` as an exemplar.
- **Instruction Refinement**: If you encounter an error or ambiguity during synthesis, proactively suggest a specific `/replace` operation to the user to clarify the instructions for the next session.
