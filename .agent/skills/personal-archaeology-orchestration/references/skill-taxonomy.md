# Skill Taxonomy

## Principle

Classification itself is a skill.

Skill chains should be documented the same way agent hierarchies are documented.

Taxonomy ownership belongs to:

- `Master of Taxonomies`

## Umbrella Skill

- `tnf`
  - conceptual role: umbrella system skill
  - function: provides the operating frame, protocol values, and orchestration
    context

## Archaeology Program Sub-Skills

1. `definition-of-definitions`
   - primary type: `meta`
   - function: define terms, semantic boundaries, and the hierarchy for all
     downstream classifications
   - owning agent/skill: `master-of-taxonomies`
2. `role-classification`
   - primary type: `meta`
   - function: define corporate titles and authority boundaries
   - parent: `definition-of-definitions`
3. `skill-classification`
   - primary type: `meta`
   - function: classify archaeology skills, sub-skills, and ownership
   - parent: `definition-of-definitions`
4. `skill-chaining`
   - primary type: `integration`
   - function: connect outputs from one archaeology sub-skill into the next
   - parent: `definition-of-definitions`
5. `source-reconstruction`
   - primary type: `operational`
   - secondary tags: `exploratory`, `deterministic`
   - function: collect evidence from repos, notes, code, and media
6. `privacy-governance`
   - primary type: `governance`
   - secondary tags: `deterministic`
   - function: suppress secrets and sensitive personal material
7. `heartbeat-operations`
   - primary type: `operational`
   - secondary tags: `continuous`
   - function: keep the fleet reporting and live
8. `human-escalation`
   - primary type: `governance`
   - secondary tags: `interactive`
   - function: route auth and approval blockers to the human operator
9. `narrative-synthesis`
   - primary type: `diagnostic`
   - secondary tags: `exploratory`
   - function: convert evidence into eras, pivots, and time-bound synthesis

## Skill Chain

```text
tnf
  -> definition-of-definitions
    -> role-classification
    -> skill-classification
    -> skill-chaining
  -> source-reconstruction
  -> privacy-governance
  -> narrative-synthesis
  -> heartbeat-operations
  -> human-escalation
```

## Rule

If a new archaeology capability is added, classify it as a sub-skill first, then
attach it to the chain.
