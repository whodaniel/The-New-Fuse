---
name: skill-builder
description:
  Route TNF skill creation and evolution requests to the canonical meta-skill
  compiler. Use when creating or revising an executable TNF skill from a
  workflow. Do not use for general feature work, runtime-loop changes, or
  executing existing skills.
metadata:
  type: meta
  role: router
---

# META-SKILL: TNF Skill Builder

The canonical capability-generation contract is
[meta-skill](../meta-skill/SKILL.md). Read that entrypoint and only its
task-relevant references. Produce its strict dispatch envelope and use its
validation and sandbox admission gate.

Do not write model responses into a compiled skill bank, update MCP
configuration, rewrite runtime loops or system prompts, or activate a generated
skill before evaluation. The compiler owns the bounded transient registry and
its receipt/quarantine state under `.agent/skills/`.

This entrypoint preserves existing skill-builder discovery. General
instructional skill authoring remains distinct from automatic executable
capability admission.
