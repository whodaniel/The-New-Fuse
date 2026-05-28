# Privacy And Evidence Model

## Evidence Tiers

- `hard`: direct platform or git metadata, deterministic timestamps, durable
  primary artifacts
- `strong`: filename-dated or git-first-commit-backed artifacts, well-scoped
  repo roots
- `moderate`: filesystem timestamps, weakly anchored summaries, indirect
  artifacts
- `inference`: synthesized narrative or clustering that connects multiple
  evidence points

Never present `inference` as if it were `hard`.

## Privacy Model

Default stance: suppress rather than redact when a file looks like it contains
live secrets or sensitive personal identifiers.

High-risk inputs to skip:

- `.env*`
- private keys and keystores
- wallet or seed materials
- credential dumps
- tokens or API keys with assigned values
- identity documents and personal identifiers

Low-risk inputs to keep:

- repo names
- manifest files without secrets
- screenshots and videos whose filenames/timestamps are informative
- exported notes that pass secret/content filtering
- dated markdown, txt, and rtf documents

## Safe Narrative Construction

1. Start from durable anchors.
2. Add adjacent artifacts only if they increase chronology or meaning.
3. Distinguish project history from personal history without erasing either.
4. Keep provenance attached to every event.
5. Prefer aggregate counts and labels in public summaries over raw excerpts.
