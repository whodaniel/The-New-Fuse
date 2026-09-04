# OS-Keystore Trust-Root Signing — Feasibility Brief

> Status: scoped, not implemented. This brief prices the work so it can be
> staffed deliberately (likely after the authority-lane merge — see §Collision).
> Authored 2026-09-04 from a source-verified audit; no code was changed in
> producing it.

## The gap, precisely

`osKeystoreProvider` (`scripts/lib/tnf-trust-root.cjs:431-450`) implements
`probe()` only, via `detectedOnly()`. It honestly reports
`available: false, implemented: false` with the reason "`os-keystore` detected
but signing is not implemented yet — implement sign() to use it"
(`tnf-trust-root.cjs:191`). `getPublicKey()` and `sign()` are absent.

The provider contract
(`packages/control-plane-contracts/src/authority.ts: :135-142`) requires all
three methods, under the no-silent-downgrade rule (:131-133): an unavailable
root must report unavailable; downgrading is the operator's explicit, visible
decision.

## What it is worth (honest security assessment)

The provider's own declared guarantee is the correct frame:

| Property                  | Value   |
| ------------------------- | ------- |
| `keyReadableBySameUid`    | `true`  |
| `hardwareBound`           | `false` |
| `requiresHumanPresence`   | `true`  |
| `survivesAgentCompromise` | `false` |

So an implemented os-keystore root is **not** extraction-resistant and must
never be described as one. Its genuine advantages over the current `file` root
(plain 0600 PEM):

1. **Human-presence gating** — signing can trigger a Keychain approval prompt,
   turning unattended automated signing into an operator-visible event.
2. Key material is not sitting in a file any same-uid process reads passively;
   driving the keystore is an observable act.

On this operator's hardware the stronger roots are unavailable (Secure Enclave
requires T2/Apple Silicon; this is pre-T2 Intel; no TPM; fido2 absent), so
os-keystore is the **best available upgrade** — a strict increment, never a
replacement for judgement.

## Implementation constraints (the part that makes this non-trivial)

- **macOS:** the `security` CLI **cannot** create or use non-exportable Ed25519
  keys for signing; `security import` only handles exportable keys. _(Verified
  2026-09-04 via `security -h`: no `sign` subcommand exists in the CLI; only
  keychain import/find/query surfaces. This brief has stated this correctly
  since authorship — an earlier session note claimed a correction here; none was
  needed or made.)_ A real implementation needs Security.framework:
  `SecKeyCreateRandomKey` (permanent, login keychain) + `SecKeyCreateSignature`.
  Ed25519 support exists on macOS 10.15+; ECDSA P-256 is the maximally-safe
  curve choice if Ed25519 paths prove flaky. Practical shape: a small Swift
  helper binary compiled at install time and invoked via the existing
  `execFileSync` pattern (timeout + piped stdio, already in this file at
  :83-92).
- **Linux:** `secret-tool` stores/retrieves secrets; it is not a signing oracle.
  An honest Linux `os-keystore` implementation is file-with-passphrase semantics
  — better than plain file, weaker than the macOS path. The provider must keep
  reporting that truthfully.
- **TrustRootPublicKey contract:** expects Ed25519/ES256 + PEM. An ECDSA P-256
  keystore key fits `ES256` natively; an Ed25519 keystore key fits `Ed25519`.
  Either path works without changing the contract — unlike the wallet/EVM case
  (see `AUTHORITY_GRANTS_WIRING_BRIEF` §wallet), **no interface extension is
  required here.**

## Reference implementation to follow

`fileProvider` in the same file (:105-140): `ensureOperatorKey()` →
`getPublicKey()` returns `{ did, publicKeyPem, algorithm }`;
`sign(payload, context)` returns base64 signature + `rootDid` + context purpose.
Mirror that shape exactly; only the key storage/operation backend changes.

## Test gap (independent of this lane)

`scripts/lib/tnf-trust-root.test.cjs` **does not exist**. Any work here should
land with the first test suite for the whole trust-root module — probe honesty,
no-silent-downgrade, and (where CI runners allow) a keystore sign/verify
round-trip.

## Collision warning (why this is post-merge)

`tnf-trust-root.cjs` exists in the authority-lane worktree
(`.tnf/worktrees/authority-lane-task0`) as well as the main checkout, and the
main checkout already carries an **uncommitted** `wallet` addition to
`TrustRootKind`/`TRUST_ROOT_PREFERENCE` that the worktree does not have. Do not
start this lane until the authority lane merges and that edit is reconciled —
otherwise we mint a third divergent copy of the trust-root surface.

## Recommended staffing

One focused pass: Swift helper + `osKeystoreProvider.{getPublicKey,sign}` + the
module's first test file. Estimated small-to-medium; the hard part is the helper
build story (install-time compilation vs checked-in binary), which needs one
packaging decision from the operator.
