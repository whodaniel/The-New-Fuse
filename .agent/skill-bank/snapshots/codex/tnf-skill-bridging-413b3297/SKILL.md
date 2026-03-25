---
name: tnf-skill-bridging
description: Define and implement skill-bridges between TNF skills. Use when Codex must connect skill inputs/outputs, define handoff contracts, or create bridge artifacts that let multiple skills execute as a cohesive workflow.
---

# TNF Skill Bridging

## Overview
Bridging skills formalize how outputs from one skill become inputs to another. A bridge defines the handoff contract, validation checks, and execution order, making multi-skill workflows deterministic and testable.

## Bridge Contract
Every bridge must specify:
- Source skill(s) and target skill(s)
- Input/output schema (fields, formats, paths)
- Validation criteria (what proves the handoff is correct)
- Failure handling (fallback or escalation)

## Bridge Workflow
1. Identify the producing skill(s) and artifact(s).
2. Normalize outputs into a minimal handoff schema.
3. Validate against schema.
4. Execute the target skill(s) using the handoff.
5. Log success/failure to a bridge report.

## Quick Commands
- Create a bridge spec: `scripts/new_bridge_spec.sh <name>`
- Validate a bridge: `scripts/validate_bridge.sh <spec>`

## References
- `references/bridge-spec-template.md`
- `references/bridge-examples.md`
