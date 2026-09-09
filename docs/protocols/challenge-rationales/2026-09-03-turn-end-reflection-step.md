# Turn End reflection step — 2026-09-03

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:CHALLENGE_RATIONALE] [VISIBILITY:COLLECTIVE]`

- file: docs/protocols/TURN_END_MANDATE.md  ← **TIER 2, NOT YET EDITED**
- file: scripts/protocols/turn-end-reflection.cjs (new)
- file: docs/protocols/schemas/tnf-session-handoff.schema.json
- file: docs/protocols/lessons/INDEX.md (new)
- authority_tier: the tooling and schema are TIER 3 and are done. Amending
  `TURN_END_MANDATE.md` — a LOCKED, ledger-protected document — is TIER 2 and
  awaits operator sign-off. This rationale exists so that edit can be made
  without re-deriving it.

## Assumption challenged

Turn End records what a session *did* and what the next session should *do*. It
never asks what the session *learned*, or whether it built something reusable.

That omission contradicts two of TNF's own foundational axioms:

- **Axiom 5 (Persistence)** — "Fruitful understandings shall never be left as
  transactional transients. Any solidified idea must be instantly codified."
- **Axiom 8 / D3 (Non-Temporal Proliferation)** — "if an agent improves itself
  but fails to implement that improvement into the shared TNF framework, **the
  action is void**."

The cost is measurable. Three lesson files sat in `docs/protocols/reports/` with
nothing pointing at them, so nothing found them and sessions rediscovered the
same ground. And the 2026-08-30 lexicon purge improved 25 documents while never
reaching a single executable — Axiom 8's failure mode, exactly.

## Replacement behavior

Turn End gains a reflection step, `scripts/protocols/turn-end-reflection.cjs`,
asking two questions:

1. Did this session learn something a future session would otherwise rediscover
   the hard way?
2. Did this session actualize a reusable capability not already in the library?

The script does **not** answer them. It surfaces candidates with evidence — new
executable modules added since a ref, scored for descriptor overlap against all
177 skills, plus the lesson artifacts already on disk — and scaffolds a lesson or
skill on request. An automated "no lessons today" would be the fabricated pass
`TURN_END_MANDATE` already forbids ("`na` is preferable to inventing a pass"),
and an auto-written lesson would be a confident guess about what mattered.

The handoff schema gains `reflection`, with `lessons` and `skills` each requiring
`considered: boolean`. **Absence means the question was never asked; an explicit
`considered: true` with an empty `recorded` and a stated rationale means it was
asked and answered no.** That distinction is the whole point.

`docs/protocols/lessons/INDEX.md` is created and written at record time, because
an unindexed lesson is functionally a lesson that does not exist. The three
earlier lessons are linked from it and left in place so no existing reference
breaks.

## Proposed TURN_END_MANDATE amendment (TIER 2)

Add to §Session completion, after the existing list:

> A substantial session must also answer, and record in `reflection`:
> whether it learned something a future session would otherwise rediscover, and
> whether it actualized a reusable capability not already in the skill library.
> `scripts/protocols/turn-end-reflection.cjs` surfaces the candidates. Answering
> "no" explicitly is a valid answer; leaving `reflection` absent is not.

## Safety invariants retained

- No LOCKED document was edited. The mandate amendment is proposed here only.
- The script writes nothing unless explicitly asked (`--record-lesson`,
  `--propose-skill`), and refuses to overwrite an existing lesson or skill.
- A proposed skill is scaffolded `status: PROPOSED` with its overlap analysis
  embedded, so it cannot quietly enter the library as finished work.
- The reflection field is optional in the schema, so every existing handoff
  remains valid.

## Applied to this session

- Lesson: `docs/protocols/lessons/2026-09-03-validate-on-read-unbounded-writers.md`
- Skill: `.agent/skills/authoring-enforcement-gates/SKILL.md` (PROPOSED, overlap
  reviewed — nearest neighbours all ≤33%)

## Authority basis

Operator instruction in session, 2026-09-03: "make part of turn end procedure
that the agent should ask itself if there has been any lessons learned that can
be added to TNF lessons learned archives, and if they had to actualize any new
skills in their prior sessions work that don't overlap with the skills that
already exist in TNF that could be saved as new reusable skill."
