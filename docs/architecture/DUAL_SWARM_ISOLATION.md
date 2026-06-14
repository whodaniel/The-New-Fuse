# Architectural Primitive: Dual-Swarm Isolation

## 1. The Discovery
On March 22, 2026, we identified that the system can maintain two separate instances of the `Terminal.app` process simultaneously. This is visible in the macOS `Command + Tab` switcher as two distinct Terminal icons.

## 2. The Capability
This "Dual-Swarm" structure provides **Process-Level Isolation**. Unlike separate tabs or windows within a single process, separate application instances have independent memory spaces and OS-level identifiers.

### 2.1 Use Cases
- **Master/Understudy Redundancy**: Run the primary coordinator in Process A and the Understudy in Process B. An OS-level hang of Process A will not affect the Understudy.
- **Security Sandboxing**: Run agents with access to sensitive credentials in one process, and experimental/untrusted scraping agents in the other.
- **Cognitive Switching**: Use `Command + Tab` to instantly switch between different 'Cognitive Planes' (e.g., "Swarm A: Code Production" vs. "Swarm B: System Auditing").
- **Environment Isolation**: Instance A can run with one set of environment variables (e.g., Production Redis), while Instance B runs with another (e.g., Dev/Staging Redis).

## 3. Implementation Patterns
- **Launch Command**: `open -n -a Terminal` spawns a new isolated process.
- **Targeting**: AppleScript can distinguish between these instances using `index` or `unix id`.
- **Relay Federation**: Both swarms can talk to the same Redis Bus, or be assigned to separate 'Islands' by pointing them at different Redis databases or channels.

---
**Status**: ARCHITECTURAL ASSET
**Operator**: Local Sub-Director
