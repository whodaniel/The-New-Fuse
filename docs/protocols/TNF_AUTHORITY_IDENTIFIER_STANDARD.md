# TNF Authority Identifier Standard

`[CLASS:PRIME] [STATUS:ACTIVE] [DOC_TYPE:PROTOCOL_STANDARD] [VISIBILITY:COLLECTIVE] [OWNER:TNF]`

**Protocol ID:** `TNF_AUTHORITY_ID_V1`
**Supersedes:** nothing. Codifies what D23 already requires.

## The gap this closes

TNF carries nine identifier systems. The only one that authorizes anything — the
key of `~/.tnf/authority/roles.json` — was a bare ad-hoc string
(`"tnf-local-subdirector"`), carrying no tenant, no residency, no instance, and
matching none of the federated namespaces. A grant could not be traced to an
entity, and `scripts/lib/tnf-identity.cjs` contained the word "canonical" exactly
once, in a comment.

| Identifier | Shape | Purpose | Authorizes? |
| --- | --- | --- | --- |
| `canonicalEntityId` | `TNF:[SCOPE:]CATEGORY:PROVIDER:NAME:INSTANCE` | hierarchical entity name | no |
| `idNumber` | `ID#:<Base58>` (Redis INCR) | reputation sequence | **never** — symmetric HMAC, forgeable |
| `mcid` | `tnf/mcid/0.1` | lineage envelope; requires `scope.tenant_id` | no |
| `federationId` | varchar on `users` | user-federation membership | no |
| `twid` | terminal-bound | terminal identity | no |
| NFT id | env `LOCAL_SUBDIRECTOR_NFT_ID` | — | **no; disabled 2026-08-25** |
| `agentId` (roles.json key) | **this document** | authorization | **yes** |
| Ed25519 key id | keyed by the above | proves the above | yes |
| `federation.scopes` | `dacc-orchestrator`/`dacc-worker` | classification | no |

## The identifier

```
did:tnf:<scope>:<category>:<provider>:<name>:<instance>
```

A DID, because a DID is what TNF's authority contracts already require:
`CapabilityGrant.iss`/`aud` are DIDs (`packages/control-plane-contracts/src/authority.ts`)
and `tnf-elevation-broker.cjs` rejects a `requesterDid` that does not begin
`did:`. It is the `canonicalEntityId` expressed as a DID — not a tenth namespace.
`didToCanonicalEntityId()` converts losslessly for cross-subsystem joins.

Segments are `[a-z0-9_]`. `<instance>` is zero-padded to three digits.

### The scope segment carries residency and tenancy

The canonical builder has always accepted an optional `scope` segment and
nothing ever populated it. It now carries the axis TNF was missing:

| Scope | Meaning |
| --- | --- |
| `local` | the user's own machine — desktop, VPS, anywhere they installed the harness |
| `cloud` | TNF's own control plane |
| `cloud_<tenantId>` | a server-side entity belonging to one tenant |

```
did:tnf:cloud:user:tnf:daniel_goldberg:001         super-admin (owner)
did:tnf:cloud:system:tnfcore:super_director:001    the SaaS orchestration agent
did:tnf:cloud_acme:agent:tnfcore:reviewer:001      a tenant's server-side agent
did:tnf:local:agent:tnfcli:mbp_2015:001            an installed harness
```

## Roles are not residency

```
worker | sub-director | super-director | super-admin
```

- **`super-admin`** — the human operator/owner. Added 2026-09-03; it was absent,
  so the operator's own rank was unrepresentable, though `SUPER_ADMIN` has
  governed cron scope since the 2026-03-18 federated runbook.
- **`super-director`** — the singular cloud orchestration agent that makes
  app.thenewfuse.com agentic (`TNF_AUTHORITATIVE_CHAIN_OF_COMMAND.md` §2.1).
- **`sub-director`** — a director-tier agent. **The installed harness and a
  user's server-side agent are both sub-directors.** They differ by the scope
  segment of their identifier, never by role name.
- **`worker`** — everything else. The fail-closed default.

> Encoding residency into role strings is what produced `local-director`,
> `local-subdirector`, `subdirector`, and `director` + `director_tier: sub` —
> four spellings of one fact, none of which the code reliably matched.

**Correction to D23.** D23 states `local-director` "was invented in the
2026-07-23 session". It was not: `TNF_FEDERATED_DIRECTOR_ORCHESTRATION_RUNBOOK_2026-03-18.md`
§2.1 names "Local Director (`tnf-agent` / `tnf-cli-agent`)" four months earlier,
as original vocabulary. Retiring the term was right; recording it as a
hallucination was not.

## Residency decides which rule applies

| Residency | Trust model | Autonomy |
| --- | --- | --- |
| `local` | single-tenant: the machine owner **is** the authority | the harness is a sub-director by default; no grant required |
| `cloud` / `cloud_<tenant>` | multi-tenant: other tenants share the plane | the operator-owned registry decides; unknown fails closed to `worker` |

This is the trust boundary. It is not "declared vs. registry" — on your own
machine there is no second party to protect you from, and requiring a grant there
would break the open-source harness on first run for no security gain. In the
cloud a declared role is an escalation, because other tenants exist.

Resolution order: a `did:tnf` states its own scope; else `TNF_RESIDENCY`, set by
a cloud deployment; else `local`. The default is `local` deliberately — the
common case is a user's own machine, and TNF's control plane is a managed
environment where setting one variable is trivial and auditable.

## The operator exception: crossing the residency boundary

Residency is a trust boundary, not a label. A `local` subject is trusted because
its machine owner is the authority there, and that reasoning does not extend to a
plane other tenants share. So a delegated grant **may not cross residency**.

There is one legitimate exception. The developer/owner needs their own local
harness to drive server-side agents, and their server-side agents to drive each
other. The first of those crosses the boundary.

That exception is real, and it is a real weakening — so it is explicit rather
than implicit:

- A grant carries `crossResidency`, and only an issuing grant that carries it may
  reach a subject on the other plane.
- `crossResidency` is inside the **signed material**, so it cannot be switched on
  by writing to the row.
- **A bridge may not mint bridges.** A cross-residency grant may not delegate
  cross-residency authority onward. One deliberate bridge is an exception; a
  bridge that mints bridges is a hole.
- Bridges are **enumerable** (`crossResidencyGrants()`, plus an index on the
  column), because the justification for allowing the crossing is that it stays
  visible and bounded. "Which machines currently hold authority in the cloud
  plane, and until when" must be answerable in one query.
- The bridged subject keeps its **local** DID. It is not re-issued a cloud
  identity, because that would launder the fact that cloud authority is being
  exercised from a laptop.

Two consequences worth stating plainly. That laptop's key custody becomes
cloud-critical, which argues for a hardware trust root (`secure-enclave` /
`fido2`) for exactly that key rather than a file. And the grant should be
short-lived — expiry is the revocation mechanism, and a standing bridge is a
standing risk.

## Subscription is not authority

Whether the Super Director will orchestrate a fleet is an **entitlement** keyed
on the tenant in the scope segment (`packages/database/src/drizzle/schema/entitlements.ts`).
A free user's harness is a full local sub-director; what an unpaid tenant lacks
is cloud orchestration membership, not authority over their own machine. Never
model this as a role.

## What does not authorize as implemented — and what each would need

An earlier revision of this section was a flat prohibition. That framing was
wrong. None of these identifiers is unsound as a *concept*; each is unsound in
its *current implementation*, and each has a job it is genuinely good at. The
rule that survives all three is narrower and absolute:

> **Ownership is proven, never asserted.** An identifier in a request body, an
> environment variable, or a local file is a claim. What may change is whether
> TNF has a way to check it.

### `idNumber` — an alias, once it stops being evidence

`ID#:<Base58>` is sequential and verified by a symmetric HMAC, so any party able
to verify it can forge it. That only bites while it is treated as *evidence*.

**Reintegration:** make it an index, not a credential — `idNumber → did:tnf`,
resolved through the operator registry. It then behaves like an account number:
quotable, stable across key rotation, good for AI Wiki attribution and reputation
continuity, and granting nothing on its own. The HMAC weakness becomes irrelevant
because nothing trusts the token; it trusts the lookup.

An Ed25519-signed `idNumber` claim is the alternative, but it creates a second
authority key for one fact. Prefer the alias.

### `dacc_role` — classification with a trustworthy source

The defect is the derivation, not the concept: `deriveDaccRole()` is a filename
substring match (`n.includes('director')`), so `mv x.md x-director.md` would be a
privilege escalation. D23 is explicit that the question it answers — "what kind
of agent is this" — is legitimate.

**Reintegration:** assign it in the registry or agent frontmatter instead of
deriving it from a filename. It is then trustworthy for capability discovery,
routing and agent matching — the lane where loose matching is correct and
expected (see the routing/authorization split above).

Keep it as classification. Once its source is the operator registry it *is* a
role grant, and two vocabularies for one fact is what produced five spellings of
sub-director.

### NFT / wallet — a trust root, not a competing identifier

The 2026-08-25 P0 was not a verdict on NFT identity. `set_director_identity`
accepted a caller-supplied `nft_id` as fact and `broadcast_super_director_prompt`
treated `nft-authorized:${nft_id}` — a template literal — as a signature, while
real signature recovery sat unused one package away.

The primitives already exist in
`packages/relay-core/src/services/shared/BlockchainService.ts`:
`verifyMessage(message, signature) → recoveredAddress` (instance and static) and
`getAgentNFTContract()`. What is missing is a challenge/nonce flow and an
`ownerOf(tokenId) === recoveredAddress` check.

Wallet-backed identity does not compete with `did:tnf`. A DID is a namespace with
methods, and wallet-backed methods (`did:pkh`, `did:ethr`) are standard — so an
NFT-owning wallet *anchors* a DID rather than replacing one. It brings a property
nothing else here has: **external verifiability and transferability, without TNF
being the trust root.** For federation across organizations, and for the agent
marketplace, that is the point.

**Reintegration:** add `wallet` to `TrustRootKind` beside `secure-enclave`,
`tpm2`, `fido2` and `pkcs11`, and implement `TrustRootProvider` over
`BlockchainService`:

| Member | Wallet implementation |
| --- | --- |
| `probe()` | RPC reachable, `AgentNFT` contract resolvable |
| `getPublicKey()` | the wallet-derived DID (`did:pkh` / `did:ethr`) |
| `sign()` | wallet signature over the payload |

Authentication becomes: issue a nonce → the wallet signs it → `verifyMessage`
recovers the address → `ownerOf(tokenId)` confirms that address holds the token →
**only then** resolve authority. `TrustRootGuarantee` already requires a provider
to state its weaknesses rather than omit them, which is exactly right: a hot
wallet is a weaker root than a secure enclave, and that must be visible rather
than assumed.

### Still absolute

- Any role asserted in a message body, `~/.tnf/agent.yaml`, or `AGENT_ROLE`.
  These are claims. No implementation change makes a self-asserted role a
  credential.

## The shape this settles into

| Identifier | Job | Proven by |
| --- | --- | --- |
| `did:tnf` | the authority key | Ed25519, operator registry |
| NFT / wallet | external trust root anchoring a DID | wallet signature + on-chain ownership |
| `idNumber` | human-facing alias, reputation | registry lookup → DID |
| `dacc_role` | capability discovery, routing | operator-assigned classification |

Each does the job it is actually good at. Nothing is discarded.

## Enforcement

```bash
node scripts/protocols/role-coherence-gate.cjs --strict
```

C1 fails if the gate and `tnf-identity.cjs` disagree on the vocabulary. C7 fails
if an authority grant is not traceable. Legacy bare-string grants are warnings,
not errors — they still resolve, and erroring would revoke live authority.

## Migration

1. Grant new roles as `did:tnf` from an operator shell.
2. Legacy bare-string grants keep working; `residencyOf()` reports `unknown` for
   them and the caller decides policy. Guessing residency from a substring would
   repeat the `dacc_role` mistake.
3. Key filenames encode `:` as `~` (`fsSafeAgentId()`), which is illegal in a DID
   segment and absent from legacy ids, so existing key files are untouched.

## Still open

- `super-director` has no registry entry in the **cloud** control plane; a
  laptop-local grant is not where the orchestration agent's identity belongs.
- The UCAN capability-grant chain in `control-plane-contracts/src/authority.ts`
  is built and tested but has no execution path. Wire the first consumer only
  against a broker someone is watching — a permission prompt into the void is
  worse than none. The autonomy-denial path is the natural first case.
- `TNF_MESSAGE_AUTH_MODE` is `warn` and no bus secret is provisioned, so messages
  are currently unauthenticated regardless of role. `tnf authority init` writes
  the secret; the audit log must go quiet before `enforce` is safe.
- **Wallet trust root** — add `wallet` to `TrustRootKind` and implement
  `TrustRootProvider` over `BlockchainService`, with a nonce challenge and an
  `ownerOf` ownership check. The signature primitives exist; the challenge flow
  and the ownership assertion do not. Same discipline as the UCAN path: wire it
  against something that is being watched.
- **`idNumber` alias table** — `idNumber → did:tnf` in the registry, so the
  sequence becomes a resolvable index rather than a claim.
- **`dacc_role` source change** — assign in the registry/frontmatter rather than
  `deriveDaccRole()`'s filename substring, so classification is trustworthy for
  routing and capability discovery.
