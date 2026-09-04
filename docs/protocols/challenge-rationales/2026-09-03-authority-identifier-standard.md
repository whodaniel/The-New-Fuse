# Authority identifier standard and the residency axis — 2026-09-03

`[CLASS:PRIME] [STATUS:PROPOSED] [DOC_TYPE:CHALLENGE_RATIONALE] [VISIBILITY:COLLECTIVE]`

- file: scripts/lib/tnf-identity.cjs
- file: docs/protocols/TNF_AUTHORITY_IDENTIFIER_STANDARD.md (new)
- file: scripts/protocols/role-coherence-gate.cjs
- file: packages/tnf-cli/src/cli.ts
- authority_tier: TIER 3 (TACTICAL) per D26 — scripts and new protocol docs.
  Operator delegated the judgment explicitly in session on 2026-09-03.

## Assumption challenged

**1. That an authority grant needs no traceable identity.** `roles.json` was
keyed on a bare string. TNF carries nine identifier systems and the only one
that authorizes matched none of them, so a grant could not be traced to an
entity, a tenant, or a residency.

**2. That residency belongs in the role name.** `local-director`,
`local-subdirector`, `subdirector`, and `director` + `director_tier: sub` are
four spellings of one fact. The literal comparison the code actually performed
matched none of what provisioning wrote, so the elevation depending on it was
dead on every machine provisioned that way.

**3. That the trust boundary is "declared vs. registry".** This was my own error
on 2026-09-03, corrected here. Requiring a registry grant before autonomy would
have withheld autonomy from every open-source install on first run. On a user's
own machine the owner IS the authority; there is no second party to protect them
from. The boundary is single-tenant local vs. multi-tenant cloud.

**4. That the NFT path might still be authoritative.** It is not.
`set_director_identity` and `broadcast_super_director_prompt` were disabled
fail-closed as a P0 on 2026-08-25 because `nft-authorized:${nft_id}` was a
template literal, not a signature.

## Replacement behavior

- `did:tnf:<scope>:<category>:<provider>:<name>:<instance>` — the
  `canonicalEntityId` expressed as a DID, because `CapabilityGrant.iss`/`aud`
  and `ElevationRequest.requesterDid` already require DIDs. Not a tenth
  namespace; `didToCanonicalEntityId()` converts losslessly.
- The canonical builder's long-unused SCOPE segment carries residency and
  tenancy: `local`, `cloud`, `cloud_<tenantId>`.
- `VALID_ROLES` gains `super-admin`, so the operator's own tier is
  representable. `canRequestElevation` accepts it.
- Autonomy is residency-aware: `local` keeps working with no grant; `cloud`
  defers to the registry and fails closed to `worker`.
- Gate check C7 asserts grants are traceable. C1 fails if the gate's vocabulary
  and `tnf-identity.cjs` diverge — which is how the gate caught its own list
  trailing the `super-admin` addition during this change.
- Key filenames encode `:` as `~`, illegal in a DID segment and absent from
  legacy ids, so no existing key file moves.

## Safety invariants retained

- No LOCKED document body was modified. The D23 correction is recorded here and
  in the new standard, not by editing DIRECTIVES.md.
- `saveRoleRegistry()` still refuses to write when `TNF_AGENT_ID` is set. No
  role was granted by an agent process during this work.
- Legacy bare-string grants keep resolving; C7 reports them as warnings.
  Erroring would revoke live authority.
- `residencyOf()` returns `unknown` for a bare string rather than guessing.
  Inferring residency from a substring would repeat the `dacc_role` mistake.
- `idNumber` and NFT ids are documented as never-authorizing.

## Correction to the record

D23 states `local-director` "was invented in the 2026-07-23 session and has been
removed". `TNF_FEDERATED_DIRECTOR_ORCHESTRATION_RUNBOOK_2026-03-18.md` §2.1 names
"Local Director (`tnf-agent` / `tnf-cli-agent`)" four months earlier. The term
was original vocabulary, correctly retired for the wrong stated reason. D23's
sentence should be amended at TIER 2; the stale copy of the same claim in
`tnf-identity.cjs` is corrected here.

## Authority basis

Operator instruction in session, 2026-09-03: map the ID standards, codify
authority roles with traceable ID numbering fitting the overarching schema, and
"use your best judgment with all of the context that you now have".
