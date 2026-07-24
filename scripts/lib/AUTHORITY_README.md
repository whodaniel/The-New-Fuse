# TNF Authority Stack

A real, enforced agent-authority layer: agents prove who they are, hold scoped
expiring grants, request elevation from a human, and act on secrets they never
see. Built to replace a "protected override" request whose premises did not hold
(see `docs/protocols/CHALLENGE_RATIONALE_LOG.md`, D23 in `DIRECTIVES.md`).

**Security rests on key custody, not on secrecy of code.** All of it is
publishable; the public contracts live in
`packages/control-plane-contracts/src/authority.ts` so a proprietary hosted
implementation can satisfy the same interfaces.

## The modules

| Module | Role |
| --- | --- |
| `tnf-message-auth.cjs` | Signs/verifies bus messages. Ed25519 identity-bound (`kid: ed25519`) vs shared-secret (`kid: shared`, rejected in enforce). Phase 0. |
| `tnf-identity.cjs` | Per-agent Ed25519 keypairs + operator-owned role registry (`worker \| sub-director \| super-director`). `resolveRole(verifiedId)` is the ONLY authorization-role lookup. Phase 1. |
| `tnf-trust-root.cjs` | Probes the environment and selects the strongest *usable* root: `fido2 \| secure-enclave \| tpm2 \| pkcs11 \| separate-uid \| os-keystore \| file`. Reports honestly what it does/doesn't guarantee. Phase 2. |
| `tnf-capability-grant.cjs` | UCAN-shaped grants: attenuating, expiring, task-bound, single-use. A chain can only narrow. Phase 2. |
| `tnf-elevation-broker.cjs` | The approval channel. Agents `submit()`; `decide()` refuses from agent context. Phase 3. |
| `tnf-authority-console.cjs` | Interactive `tnf-authority review` — TTY-gated, no default action, double confirm, fences untrusted agent text. Phase 3. |
| `tnf-cred-broker.cjs` | Agents act on secrets without holding them. Read-only in 4a; a degraded root is refused more. Phase 4a. |
| `tnf-authority-client.cjs` | The agent-side API. `withElevation(p, fn)` runs `fn` only with a verified, operator-approved grant. First consumer. |
| `tnf-authority-workers.cjs` | Shared SUDO_UID-aware straggler scan (confirm-isolation + trust-root probe). |

CLI: `tnf authority …` (wired in `packages/tnf-cli`) or
`scripts/tnf-authority.cjs` directly
(`review \| status \| list \| show \| approve \| deny \| confirm-isolation \|
workers \| relaunch-workers \| provision-keys`).
Account setup: `tnf authority account` / `scripts/setup/tnf-agent-account.sh`.
Encryption rotate: `tnf authority encrypt-rotate --plan|--apply`.
Keypairs (message-auth identity): `tnf authority provision-keys <agentId…>`.
Launcher: `scripts/runtime/launch-agent-wrapper.sh` drops to `tnf-agent` when
that account exists (`TNF_RUN_AS_OPERATOR=1` opts out).

A2A bus: thin `scripts/lib/redis-agent-client.cjs` is a shim over the full
`RedisAgentClient` (signs outbound A2A envelopes; inbound hits auth + optional
authority gate). Broker-agent / redis-relay-bridge sign TNF envelopes via
`packages/relay-core/src/protocol/sign-bus-message.ts`.

**Never `sudo tnf authority …`.** Under sudo, `getuid()` is 0 and the straggler
scan historically false-passed. Run as your normal user; nested
`sudo -u tnf-agent` is fine.

## The one principle

Every layer states what it does NOT guarantee. The trust root won't call itself a
boundary until isolation is *proven*. The broker gets *more* restrictive on a
weak root. D23 says at each step what exists and what doesn't. An agent can never
cite an assurance that isn't real — that is the whole point, given this repo's
history of fabricated-authorization incidents.

## What makes it load-bearing (operator actions)

1. Provision `A2A_SECRET_KEY`, then `TNF_MESSAGE_AUTH_MODE=enforce` (only after
   every agent has a keypair and peers' public keys are imported).
2. `tnf authority account` (done — uid 442), then
   `tnf authority relaunch-workers` so wrappers run as `tnf-agent`, then
   `tnf authority confirm-isolation` **as the normal user** (not `sudo tnf`).
   Until workers are off uid 501, the root stays honestly weak even if a marker
   file exists. See `docs/protocols/AUTHORITY_TURNUP_RUNBOOK.md`.
3. Flip `TNF_AUTHORITY_CONSUMER=1` on one pilot after isolation is real.

## Not built

Phase 4b account **mutation** — deferred until the trust root is a real
boundary. Reconciling the server-side `agentApiGrants` service to the
`CredentialBroker` contract is the natural SaaS/open convergence point.

## Tests

132 across 9 `*.test.cjs` suites next to the modules. `node --test scripts/lib/tnf-*.test.cjs`.
