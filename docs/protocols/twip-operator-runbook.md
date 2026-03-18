# TWIP Operator Runbook (v0.1)

Status: Draft Audience: TNF operators, platform engineers, and agent-runtime
maintainers

## Purpose

Standardize secure TWIP operations so terminal identity workflows are
consistent, transferable, and safe across local, CI, and production
environments.

## 1) Runtime Controls

Relay TWIP security controls:

1. `TWIP_REQUIRE_SIGNATURE` Meaning: Require signed envelopes for
   publish/resolve security checks. Default: `false`

2. `TWIP_SIGNING_KEY` Meaning: Shared HMAC key used for envelope signature
   verification. Default: empty (no signature verification possible)

3. `TWIP_MAX_CLOCK_SKEW_SECONDS` Meaning: Acceptable future timestamp skew
   tolerance. Default: `300` Bounds: `30..3600`

4. `TWIP_MAX_REPLAY_AGE_SECONDS` Meaning: Maximum envelope age accepted before
   expiry/replay denial. Default: `3600` Bounds: effectively clamped by
   implementation

## 2) Required Security Baseline

For production-like operation:

1. Set `TWIP_REQUIRE_SIGNATURE=true`.
2. Set non-empty `TWIP_SIGNING_KEY` from secret manager.
3. Keep `TWIP_MAX_CLOCK_SKEW_SECONDS` as low as practical (`60..300`).
4. Keep `TWIP_MAX_REPLAY_AGE_SECONDS` aligned with envelope TTL policy.
5. Ensure all clients send `id`, `sent_at`, `trace.correlation_id`,
   `trace.causation_id`.

## 3) Relay Start Example

```bash
TWIP_REQUIRE_SIGNATURE=true \
TWIP_SIGNING_KEY='replace-with-secret' \
TWIP_MAX_CLOCK_SKEW_SECONDS=120 \
TWIP_MAX_REPLAY_AGE_SECONDS=900 \
node apps/relay-server/src/mcp-server.js
```

## 4) Envelope Signing Utility

Use the built-in utility to sign or verify TWIP envelopes:

```bash
# Sign fixture -> writes signed envelope file
node scripts/protocols/twip-sign-envelope.cjs \
  --in docs/protocols/schemas/fixtures/twip/envelope.publish.valid.json \
  --out /tmp/twip-envelope.signed.json \
  --key 'replace-with-secret'

# Verify signed file
node scripts/protocols/twip-sign-envelope.cjs \
  --verify \
  --in /tmp/twip-envelope.signed.json \
  --key 'replace-with-secret'
```

Notes:

1. Signature format is `hmac-sha256:<hex>`.
2. The utility canonicalizes JSON key order and ignores `sig` during signing.

## 5) Inventory Mirroring Contract

Terminal inventory path:

1. Relay resource: `tnf://twip/inventory`
2. Snapshot file: `data/protocols/twip-inventory.snapshot.json`
3. Backend mirror resource: `fuse://twip/inventory`

Operational sequence:

1. Trigger `twip_scan_terminals` on relay MCP.
2. Relay writes snapshot.
3. Backend MCP serves mirrored snapshot for downstream agent access.

## 6) Deny Reasons You Should Expect

Policy:

1. `missing_tenant_scope`
2. `ttl_out_of_bounds`
3. `remote_propagation_not_allowed`

Security:

1. `signature_required`
2. `signing_key_unavailable`
3. `signature_invalid`
4. `replay_detected`
5. `envelope_expired`
6. `sent_at_in_future`

## 7) CI/Conformance Commands

```bash
node scripts/validate-protocol-schemas.cjs
node scripts/protocols/twip-conformance.cjs
```

## 8) Troubleshooting

1. Symptom: inventory returns zero terminals on macOS. Action: verify relay
   includes `sess` fallback in `ps` parsing (already implemented).

2. Symptom: every signed request denied. Action: verify producer and relay use
   same `TWIP_SIGNING_KEY`.

3. Symptom: replay denials in clustered systems. Action: check envelope `id`
   uniqueness and clock synchronization.

4. Symptom: unsigned requests fail in dev unexpectedly. Action: check
   `TWIP_REQUIRE_SIGNATURE` environment setting.
