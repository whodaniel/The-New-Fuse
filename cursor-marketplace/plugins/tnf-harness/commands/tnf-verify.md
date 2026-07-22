---
description:
  'Run the TNF Verify step — confirm recent changes against a proven testing
  pathway before treating work as done'
---

Perform the Verify step of TNF's Inspect → Act → Verify loop for the work done
so far this session.

1. Identify what changed (git diff / changed files) and what claim needs
   proving.
2. Choose a **proven, legacy pathway** to verify it — prefer, in order:
   - existing unit/integration tests for the touched area
   - a type-check (`tsc`), build, or lint
   - a known-good command that exercises the behavior
   - `tnf protocol gate` / `tnf doctor` if a local `tnf` CLI is available
3. Run it and capture a concrete signal: exit code, test count, diff, or output.
4. Report PASS/FAIL with the evidence. If FAIL, propose the smallest fix and
   re-verify — do not declare success on assumption.

Never substitute a claim of success for real verification. If cutting-edge logic
was used, verify it against a trusted baseline, not the new logic alone.
