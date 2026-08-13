# Reference example

This is a stub reference document shipped with the `tnf-scaffold` skill. Replace
it with the domain notes, schemas, or API docs an agent would load on demand.

- Keep references shallow (one level deep from SKILL.md).
- Front-load the highest-signal content in the first paragraph — agents read
  top-down.
- Link to canonical sources rather than duplicating them inline.

## When to add a reference vs. putting it in SKILL.md

Move content into a reference when:

- It's > ~50 lines and only relevant to some invocations.
- It's a schema, API reference, or domain primer that agents consume
  selectively.
- You want to keep SKILL.md under ~500 lines for fast triggering.

Keep it in SKILL.md when:

- It's part of the imperative workflow ("Run X, check Y").
- Triggering the skill depends on the agent reading it.
