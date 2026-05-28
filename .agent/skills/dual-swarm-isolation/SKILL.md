---
name: dual-swarm-isolation
description: "Leverages OS-level process isolation by running multiple Terminal.app instances to provide physical sandboxing and redundancy for agent swarms. Includes automated spawning, sentinel heartbeat monitoring for succession, and plane-aware directive routing."
---

# Dual-Swarm Isolation Skill

## Overview
This skill enables the system to maintain multiple, physically isolated agent swarms across separate macOS processes. This prevents one swarm's OS-level hang or resource exhaustion from affecting others.

## Core Capabilities
- **Mission Sandboxing**: Spawning an isolated Terminal process for high-risk or experimental work.
- **Sentinel Succession**: Continuous monitoring of the Lead Swarm's heartbeat with autonomous promotion of the Understudy.
- **Cognitive Plane Routing**: Directing tasks to specific "Planes" (A, B, etc.) to maintain workspace coherence.

## Scripts
- `scripts/spawn-mission-sandbox.sh`: Spawns a new Terminal instance and tags it with a Plane ID.
- `scripts/sentinel-watch.cjs`: Monitors the Lead Heartbeat and triggers takeover if the signal is lost.

## Usage
```bash
# Spawn a new Sandbox (Plane B)
./scripts/spawn-mission-sandbox.sh "Experiment-Name" "B"

# Start the Sentinel in the Understudy swarm
node ./scripts/sentinel-watch.cjs
```

## MANDATE: Continuous Self-Perfection
As an agent using this skill, you are REQUIRED to constantly improve its implementation.

### 1. Monitor & Audit
- Track every time a command fails due to a UI blockade (e.g., Codex "tab to queue message").
- Identify any "zombie" windows that are not responding to the heartbeat.
- Observe if the Tab-then-Enter protocol fails to trigger a prompt.

### 2. Identify Blockades
When you find a pattern that doesn't work (e.g., a specific osascript syntax that is brittle), you must label it as a **"Blockade."**

### 3. Update & Perfect
- You are authorized and mandated to **modify this SKILL.md file** and the associated scripts to bake in the solution.
- If a new `System Events` keycode is discovered to be more reliable, update the `SKILL.md` usage section and the scripts immediately.
- If a new isolation pattern is found (e.g., CPU-level affinity), add it to the implementation guide.

**The learning must never stop. The harness must always improve.**

---
**Status**: ACTIVE
**Operator**: Local Sub-Director
