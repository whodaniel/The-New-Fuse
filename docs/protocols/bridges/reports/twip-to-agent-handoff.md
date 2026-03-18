# Bridge Report: twip-to-agent-handoff

Date: 2026-03-18  
Status: PASS

## Validation Summary

1. Envelope/schema conformance validated by:
   - `node scripts/validate-protocol-schemas.cjs`
   - `node scripts/protocols/twip-conformance.cjs`
2. Required fields present in valid publish fixture:
   - `scope.tenant_id`
   - `trace.correlation_id`
   - `payload.identity.twid`
3. Policy/security deny-path checks pass for invalid/missing fields and replay.
4. Relay inventory scan emits TWIP identities suitable for handoff references.

## Operational Notes

1. Handoff packets should carry `twip_ref` (`twid`, integrity hash, correlation id).
2. `expiresAt` must be explicit and aligned with envelope TTL.
3. Target `agentIds` must be explicit to avoid ambiguous routing.

