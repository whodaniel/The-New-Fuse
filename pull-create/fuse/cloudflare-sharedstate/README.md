# Cloudflare SharedState (TNF Canonical Control Plane)

This Worker is the cloud home for the TNF SharedState protocol.

It provides:

- append-only receipts
- taskboard projections
- per-runtime context manifests
- deposit/withdraw/mirror APIs

It is the cloud-native successor to `~/.tnf_sharedstate`.

## Storage

Planned bindings:

- R2: receipts + artifacts + mirrors
- D1: indexes/materialized views (task state, latest context pointers)
- Durable Object (optional): canonical receipt sequencer (ordering + hash chain)

## Security

- Protect endpoints behind Cloudflare Access
- Secrets via Wrangler secrets store
- Strict redaction policy on mirror endpoints
