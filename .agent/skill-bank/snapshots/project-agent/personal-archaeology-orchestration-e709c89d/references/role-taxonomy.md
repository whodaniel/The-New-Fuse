# Role Taxonomy

## Why

TNF uses `Master Director` for top-level protocol authority. Domain programs
should not overload that title.

## Canonical Terms

- `Master Director`
  - TNF-global protocol or platform authority
  - the CEO-level role for the TNF organization
  - currently embodied by `tnf-cli-agent`
- `Master Orchestrator`
  - top-level orchestrator for one bounded program
  - example: personal archaeology reconstruction
- `Team Orchestrator`
  - coordinator for a bounded sub-fleet under a master orchestrator
  - examples: source acquisition, narrative reconstruction
- `Investigator`
  - specialist collector or synthesizer focused on one evidence lane
- `Sentinel`
  - watchdog for heartbeat health, blocked states, or escalation hygiene

## Naming Rule

For the archaeology fleet:

- use `personal-archaeology-master-orchestrator`
- use `personal-archaeology-<team>-team-orchestrator`
- reserve `master-director` for TNF platform docs and runtime roles
