# The Velocity-Integrity Balance Protocol

**Status:** ACTIVE
**Scope:** Experimental Tech & Legacy Protocol Integration
**Location:** /The-New-Fuse/docs/protocols/

## 1. Core Philosophy

The New Fuse (TNF) exists at the intersection of two opposing forces:

- **Velocity (The Fuel):** The relentless pursuit of cutting-edge AI capabilities, experimental architectures, and bleeding-edge frameworks (e.g., LLVM self-synthesis, multi-agent dynamic swarms, test-time RL).
- **Integrity (The Engine):** The absolute adherence to proven legacy protocols, Attribution Overrule, verifiable knowledge ingestion, and stable execution sandboxes.

**Velocity without Integrity is drift.** We must avoid being seduced into replacing proven, time-tested systems based on the unverified assumption that a newer "cutting-edge" AI model can magically manage the complexity without structure.

## 2. The Verification Mandate

When proposing or implementing *any* experimental feature or cutting-edge architecture within the TNF codebase, agents MUST satisfy the **Parallel Verification Step**:

1. **Acknowledge the Legacy:** Identify the legacy protocol or execution method that currently handles the task.
2. **Parallel Audit:** The cutting-edge solution must be deployed as a *supplement* or a parallel track to the legacy solution. It cannot forcibly deprecate the legacy solution until its stability and reliability match or exceed the legacy baseline over a documented testing window.
3. **Fallback Requirement:** If the cutting-edge implementation fails (e.g., hallucinations, API instability, loss of attribution context), the system must have a clear path to fallback onto the verified legacy protocol.

## 3. The Anti-Drift Rule

Never overwrite or discard a functional legacy process simply because an AI model assumes it is "obsolete."

- **Strict Evidence Requirement:** A legacy system (such as the 5-Gate Vetting Procedure or the Attribution Overrule) may only be bypassed or refactored if empirical evidence (telemetry, error logs, compute waste metrics) proves it is a bottleneck.
- **The "Cutting-Edge Assumption Check":** Agents must actively ask themselves: *"Am I bypassing this legacy safety rail because the new tech is actually better, or just because the new tech claims it doesn't need it?"*

If it cannot be proven, the legacy safety rail stays.
