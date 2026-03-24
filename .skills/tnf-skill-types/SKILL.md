---
name: tnf-skill-types
description: Define and apply TNF skill taxonomy. Use when Codex must classify skills by type, enforce type-specific rules, design new skill types, or validate a skill’s type selection and requirements.
---

# TNF Skill Types

## Overview
Standardize skill taxonomy so orchestration can route tasks and validate coverage. Each skill must declare exactly one primary type and optional secondary types in its documentation or metadata.

## Primary Types
- `operational`: Runs repeatable procedures on live systems and artifacts.
- `diagnostic`: Audits, traces, or explains system behavior and integrity.
- `construction`: Builds or scaffolds new systems or features.
- `governance`: Enforces policies, contracts, and compliance checks.
- `integration`: Connects systems, tools, or schemas across boundaries.
- `meta`: Defines or improves other skills, workflows, or ontologies.

## Secondary Tags (optional)
- `continuous`: Designed for scheduled or looped execution.
- `interactive`: Requires user choices mid-flow.
- `deterministic`: Script-first, low variance.
- `exploratory`: Requires investigation and synthesis.

## Type Selection Rules
- Choose the type that best describes the *primary output*.
- If a skill executes systems, it is `operational` even if it includes diagnostics.
- `meta` is reserved for skills that design or modify skills/workflows.

## Validation Checklist
- Primary type exists and is consistent with the workflow.
- References include type-specific constraints (if any).
- Scripts (if present) match the deterministic/exploratory tag.

## References
- `references/skill-type-matrix.md`
- `references/type-decision-tree.md`
