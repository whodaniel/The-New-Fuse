# TNF Information Ingestion Pipeline

`[CLASS:PRIME] [STATUS:LOCKED] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

## Purpose

Operationalize TNF information ingestion so every source is converted into an
Executable Intelligence Artifact with strict attribution and taxonomy-based
actionability.

## Pipeline Contract

1. Input a source payload (file text, stdin, or direct text).
2. Require attribution pointers (`source_id`, `source_type`, `source_uri`).
3. Require ownership pointers (`owner_principal_id`, `visibility`, `release_state`).
4. Classify content into the Taxonomy of Actionability:
- Procedural
- Strategic
- Governance
5. Assign utility metrics:
- Freshness Decay
- Implementation Density
- Verification Difficulty
6. Enforce release gates:
- `private` and `agent-scope` remain sealed (`release_state=sealed`)
- `collective` requires explicit release (`release_state=released-collective`)
- `public` requires explicit release (`release_state=released-public`)
7. Emit a machine-readable artifact following
`docs/protocols/schemas/tnf-executable-intelligence.schema.json`.

## Command

```bash
python3 scripts/autonomy/tnf_intelligence_ingest.py \
  --source-id src-001 \
  --source-type doc \
  --source-uri https://example.com/source \
  --owner-principal-id danielgoldberg \
  --visibility private \
  --release-state sealed \
  --source-title "Example Source" \
  --input-file ./notes/source.txt \
  --json --markdown
```

## TNF CLI Shortcut

```bash
pnpm run tnf:intel:ingest -- \
  --source-id src-001 \
  --source-type doc \
  --source-uri https://example.com \
  --owner-principal-id danielgoldberg \
  --visibility private \
  --release-state sealed \
  --input-file ./notes/source.txt \
  --json
```

## Output

By default artifacts are written to:

- `data/intelligence-artifacts/<artifact_id>.json`
- `data/intelligence-artifacts/<artifact_id>.md` (when `--markdown` is used)

## Governance Notes

- Attribution Cornerstone enforcement is hard-required: missing source pointer
  fields abort ingestion.
- Ownership Wall enforcement is hard-required: all artifacts are owner-associated,
  default visibility is private, and collective/public visibility is blocked
  unless explicitly released.
- Artifacts default to `[CLASS:INTEL] [STATUS:PENDING]` and should be promoted
  after human/agent vetting.
- **Archiving & Decay:** When an intelligence artifact is superseded or reaches terminal decay, its status MUST be updated to `[STATUS:ARCHIVED]`. The artifact is then moved to `data/intelligence-artifacts/_archive/`. The `source_pointer` MUST be preserved indefinitely to maintain the Attribution Overrule.
- This pipeline is a staging layer and does not bypass TNF adoption gates.
