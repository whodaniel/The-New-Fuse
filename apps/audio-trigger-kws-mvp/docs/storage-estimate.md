# Storage Estimate (Full Buildout)

This estimate assumes the architecture in this folder and a local `mini-omni` backend.

## Quick Answer

- Minimal production footprint: `~30-80 GB`
- Typical serious deployment: `~120-400 GB`
- High-scale with long retention/audio archives: `1+ TB`

## Breakdown by Component

### 1) Application code and build artifacts

- Source + configs + docs: `0.1-0.5 GB`
- Node modules + build output + logs: `3-12 GB`

Subtotal: `~3-12.5 GB`

### 2) Lexicon and matching artifacts

- 1,025,000 term master lexicon (compressed + metadata): `0.5-2 GB`
- Precompiled matcher artifacts (trie/WFST shards): `1-8 GB`

Subtotal: `~1.5-10 GB`

### 3) Vector database

Strongly dependent on how much event history you retain.

- Small (short retention, compressed embeddings): `10-40 GB`
- Medium (moderate retention): `40-200 GB`
- Large (long retention/high stream count): `200+ GB`

### 4) Knowledge graph store

- Entity and edge store with metadata: `10-80 GB`
- Can exceed `100+ GB` with long history and dense relationship capture.

### 5) Audio and observability retention (largest wildcard)

- Audio clips/snippets: `10 GB` to many `TB`
- Metrics, traces, and logs: `5-60 GB`

## mini-omni Storage Impact

- If model weights and runtime are already installed elsewhere, incremental storage here is low.
- Typical local model/runtime footprint ranges from `~8 GB` to `60+ GB` depending on quantization, checkpoints, and cache policy.

## Practical Capacity Recommendation

For a full first production rollout:

1. Start with `500 GB` provisioned disk.
2. Set retention limits for audio and raw events from day one.
3. Add lifecycle policies (hot/warm/cold storage tiers).

Without retention controls, storage growth is unbounded.
