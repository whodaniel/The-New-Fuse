# TNF Product Boundary — Public Runtime Projection

> Status: Active public product doctrine
>
> Purpose: Keep the TNF open-source runtime powerful and independently useful while exposing only the implementation detail required for interoperability and local operation.

## North Star

TNF is distributed as an open runtime plus optional compatible hosted services.

The open runtime is not a crippled client. Its quintessential component is the **TNF agent**: a locally operable protocol participant that can orient, classify, hydrate context, staff capabilities, act, verify, and hand off work through the public TNF logical rail.

Hosted TNF may add private optimization and server-side authority through public contracts, but the open runtime must remain coherent and useful without that private implementation.

## Boundary rule

> **Publish what another actor needs to speak and locally operate TNF. Keep private TNF-specific hosted decision procedures that are not required for interoperability.**

A public/private split is invalid if it removes the public agent's protocol reasoning core merely to hide an optimization implementation.

## Open runtime — MUST contain

- the TNF CLI agent and local orchestration/control surfaces;
- the public semantic kernel and lifecycle;
- Turn Zero / Turn End gateways;
- classification, authority, boundary, freshness, receipt, and handoff semantics;
- capability/provider discovery;
- public relay, message, context-reference, MCP/A2A and extension contracts;
- local tool execution subject to public permission/authority controls;
- local multi-agent coordination primitives;
- inspectable operator-configurable local policy extension points;
- safe deterministic fallbacks where semantics permit;
- public compatibility/conformance tests;
- explicit degraded behavior for capabilities that truly require a hosted service.

The open agent rail is defined by:

- `.agent/SYSTEM_PROMPT.md`
- `docs/protocols/TNF_INTEROPERABILITY_KERNEL.md`
- `docs/protocols/TNF_OPEN_AGENT_CORE.md`
- `docs/protocols/TURN_ZERO_MANDATE.md`
- `docs/core/FRONTLOAD_MANIFEST.md`
- `data/harness/open-agent-contract.json`

## Open runtime — MUST NOT contain

- secrets, operator-machine credentials, or private customer/tenant data;
- private-control-plane implementation merely because a public contract calls it;
- TNF-specific hosted optimization weights, learned policy parameters, or private decision heuristics not required for local compatibility;
- private graph/reachability/evidence/context/business reasoning implementations whose behavior can be exposed through a smaller public request/receipt contract;
- hosted billing/entitlement enforcement internals;
- server-only authority that would be unsafe to duplicate in a client;
- internal invention/disclosure records or other private corporate artifacts.

## Public contract vs private implementation

When a capability crosses the public/private boundary, prefer:

```text
public request/schema/identity/context/receipt contract
                    ↓
        optional local implementation
                    OR
        optional hosted implementation
```

The public side must know enough to invoke, inspect, verify, or replace the capability. It does not automatically receive the hosted implementation's optimization logic.

## Local autonomy rule

Missing hosted TNF must not mean "agent disabled."

For an operation that can be performed safely under local authority, the open agent may use:

- explicit operator choice;
- transparent local policy;
- user-supplied weights/preferences;
- deterministic local fallback;
- an independent compatible third-party policy provider.

For an operation that genuinely requires unavailable hosted authority, the agent should defer/deny that **specific operation**, not abandon the entire TNF lifecycle.

See `docs/protocols/TNF_LOCAL_POLICY_EXTENSION.md`.

## Default classification

| Classification | Public disposition |
| --- | --- |
| OSS runtime mechanism | Include when required for local TNF operation |
| Public interoperability contract | Include when an independent implementation/client needs it |
| Local transparent policy mechanism | Include when operator-owned/configurable and not a disguised TNF hosted secret |
| Private hosted decision implementation | Exclude; expose a contract/receipt if public integration needs it |
| Private/tenant/personal source data | Exclude |
| Satellite/optional product | Keep in its appropriate separate lane |

When uncertain, choose the **smallest public contract that still leaves the open agent genuinely functional**, plus a private implementation behind it where appropriate.

## Repository roles

`whodaniel/The-New-Fuse` is the official public runtime source/distribution repository and a legitimate source tree for open-source users.

TNF's internal release process may publish into it from a separate private development source. That internal topology does not turn the public runtime into a read-only shell or make private-source access a prerequisite for OSS operation.

## Public change gate

Before adding or removing an orchestration-related public artifact, answer both questions:

1. **IP boundary:** does this reveal a TNF-specific private hosted decision procedure that a contract/local extension could replace?
2. **Open-agent capability:** would removing it break the public logical rail, local autonomy, multi-agent coordination, or the ability to complete the TNF lifecycle?

A change is acceptable only when both sides pass.

Minimum checks:

```bash
node scripts/protocols/open-agent-rail-gate.cjs --no-write
node --test scripts/protocols/open-agent-rail-gate.test.cjs
node scripts/verify-repo-frontload.cjs
```

The canonical release process should additionally run its public/private export and leakage gates before publication.
