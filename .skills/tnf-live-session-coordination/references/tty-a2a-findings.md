# TTY A2A Findings

Use this reference when terminal-level coordination or prompt contamination is
part of the task.

## Canonical Local Evidence

Primary local source:

1. `/Users/<owner>/worktrees/fuse-structural-reconstruction/fuse-control-plane/docs/project-planning/CONTROL_PLANE_MULTI_AGENT_TTY_A2A_FINDINGS_2026-03-21.md`
2. control-plane commit `8ad4a253480c477b9eadc4bbfdd1f647b7fc5940`

## Core Findings

1. Live Codex tabs may run in non-canonical/raw-ish TTY mode.
2. Raw `/dev/ttys00*` writes are not reliable A2A transport for live Codex
   prompts.
3. A trailing newline is not proof that Enter was accepted by the Codex UI.
4. Terminal automation can contaminate a live prompt if it targets the wrong
   tab or injects text instead of reading state.
5. A visibly frozen tab may still be a live Codex process with a dirty prompt
   buffer.

## Coordination Rule

Prefer:

1. shared thread context,
2. durable repo artifacts,
3. human confirmation for critical handoffs.

Treat raw TTY injection as:

1. emergency operator knowledge,
2. incident-recovery research,
3. not the normal TNF A2A substrate.

## Incident Artifact Classes

Use these labels when documenting a coordination failure:

1. `symptom-artifact`
2. `state-artifact`
3. `mode-artifact`
4. `interaction-artifact`
5. `recovery-artifact`
6. `policy-artifact`

## Recovery Priorities

1. Preserve the live session.
2. Avoid further prompt contamination.
3. Verify process state before assuming a crash.
4. Use human-local prompt clearing over blind device writes.

## TNF Design Implication

This incident class matters because it shows the difference between:

1. prompt-maintained coordination,
2. protocol-maintained continuity.

TNF should learn from terminal-level fallbacks without depending on them as the
default coordination transport.
