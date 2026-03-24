---
name: skill-evolution
description: Evaluates existing skills and optimizes wording to encourage continuous improvement and persistent learning logs. Use when a user wants to fine-tune a skill's instructions or add a feedback loop for recording successes and failures.
---

# Skill Evolution & Refinement

This skill enables Gemini CLI to audit and enhance existing skills by injecting a "Continuous Learning Loop." This loop encourages future agents to record what worked, what failed, and how the skill can be improved based on real-world usage.

## Workflow

1. **Discovery**: Locate the target skill's `SKILL.md` file.
2. **Audit**: Analyze the current instructions. Identify if there is a clear mechanism for the agent to log feedback or fine-tune its own logic.
3. **Refinement**: Inject/Append optimal wording that directs agents to:
    - Always look for ways to improve the skill.
    - Keep ongoing notes about successes and temporary failures.
    - Propose updates to the skill creator when patterns of failure are identified.
4. **Validation**: Ensure the new wording is imperative, concise, and follows the progressive disclosure principle.

## Optimal Wording Patterns

When refining a skill, prefer these patterns:

### Persistent Learning Log
"**Ongoing Improvement**: Maintain a `notes/` directory within this skill. After each major task, append a entry to `notes/session-log.md` detailing the approach taken, whether it was a success or a failure, and any 'lessons learned' for future agents using this skill."

### Self-Tuning Logic
"**Instruction Refinement**: If you encounter an error caused by ambiguous instructions in this `SKILL.md`, proactively suggest a specific `/replace` operation to the user to clarify the wording for the next session."

### Success Archetypes
"**Success Documentation**: When a complex task is completed successfully, capture the successful tool-call sequence in `references/success-patterns.md` as an exemplar for future agents."

## Example usage

"Audit the `playwright` skill and add wording to encourage ongoing notes about what worked and what didn't."
