---
name: tnf-video-intelligence-completion
description:
  Complete or audit TNF video intelligence from playlist delta through
  transcript, visual or audio evidence-gap recovery, actionable factoids,
  implementation plans, and dispatch reconciliation. Use when video ingestion,
  AI playlist refreshes, transcript analysis, visualContextFlags, or
  executable-intelligence queues are involved.
---

# TNF Video Intelligence Completion

Do not equate a fetched transcript, a generated report, or a successful source
manifest row with completed ingestion.

Required stages:

1. Compare the live playlist against durable video IDs and acquire new items.
2. Acquire timestamped transcript/captions and preserve the attributed raw
   input.
3. Scan for implied missing evidence: deictic phrases, demonstrations, diagrams,
   UI references, sound comparisons, inaudible sections, and transcript gaps.
4. Recover the relevant frame, clip, audio feature, or external artifact; when
   recovery is impossible, keep the claim explicitly unresolved.
5. Produce atomic actionable factoids and implementation plans with source
   timestamps, confidence, verification needs, and TNF target surfaces.
6. Reconcile every processed source into the executable-intelligence action
   queue or an explicit non-actionable/deferred classification.

Completion requires non-zero source reconciliation and source-count accounting;
`manifest success > 0` with `action queue sources_seen = 0` is a failed
pipeline, not a successful ingestion run.

Use these existing authorities rather than inventing a parallel schema:

- `docs/protocols/EXPANDED_VIDEO_INTELLIGENCE_SPEC.md`
- `docs/protocols/EXECUTABLE_INTELLIGENCE_FRAMEWORK.md`
- `docs/protocols/SOVEREIGN_DISTILLATION_AND_DUAL_TRACK_PROTOCOL.md`
- `.agent/skills/multimodal-feature-extraction/SKILL.md`

Keep private second-brain artifacts outside public OSS paths. Promote a general
mechanism into TNF only after attribution, verification, applicability, and
storage-boundary checks.
