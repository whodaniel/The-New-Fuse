# Concept Context Frames

Concepts are context frames: each concept defines a local coordinate system for meaning.

## Minimal Concept Node Schema

- `name`: short canonical name
- `definition`: 1-2 lines
- `signals`: how to detect it in the system (files/routes/logs)
- `interfaces`: what touches it (services, UI surfaces, skills)
- `failure_modes`: what it looks like when broken

## Relationship Types

- `depends_on`
- `implemented_by`
- `refines`
- `conflicts_with`
- `observed_as`

## Output Artifacts

- `CONCEPTS.md`: glossary of nodes.
- `CONCEPTS.mmd`: mermaid graph for quick visualization.

