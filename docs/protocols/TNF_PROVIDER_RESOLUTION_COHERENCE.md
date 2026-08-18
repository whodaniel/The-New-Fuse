# Provider Resolution Coherence

_Recorded 2026-08-12. Companion to `TNF_TRANSPORT_LANE_SPEC.md`: that document
maps how a message reaches a worker, this one maps how the worker then picks a
model._

## The question this answers

"Lane 2 should know more than llama.cpp-on-:8081 or OpenRouter. How did that
limitation get instantiated?"

It was never designed. It is a **duplication**: the sub-director resolver
re-implements a problem TNF already solves in three other places, and it is the
only one of the four that is not under version control.

## Four provider catalogs, none aware of the others

| Source                                             | Providers | Knows uniquely                                                           | Tracked?  |
| -------------------------------------------------- | --------- | ------------------------------------------------------------------------ | --------- |
| `packages/tnf-cli/src/services/provider-config.ts` | 7         | NVIDIA NIM                                                               | yes       |
| `scripts/swarm/llm-provider-tester.cjs`            | 9         | Ollama `:11434`, SambaNova, Moonshot                                     | yes       |
| `data/llm-provider-status.json`                    | live      | **role-aware allocations** (orchestrator / worker / reviewer / subagent) | generated |
| `~/.tnf/sub-director/model_resolver.py`            | 2         | —                                                                        | **NO**    |

The third is written by the `LLM-Provider-Tester` agent and already publishes an
allocation for the `worker` role — precisely the question the resolver exists to
answer. It was never read.

## The root cause: routing code stored as runtime state

`model_resolver.py` has **zero copies in the repository**. It lives only under
`~/.tnf/sub-director/`.

Consequences, all observed:

- No version history, review, rollback, or CI for the component that chooses the
  model for every autonomous worker.
- Invisible to repo-wide search, so the three tracked catalogs were maintained
  and improved while the fourth silently diverged.
- Core Tenet 5 (Anti-Lobotomy) correctly protects `.tnf/` as **state**. This
  file is **code**. Protecting it from deletion is not the same as governing it.

This is the structural defect. Widening the provider list without fixing it only
resets the clock on the next divergence.

## Defect found while mapping (fixed 2026-08-12)

`CODE_MODELS["cloud"]` already listed `nvidia/meta/llama-3.3-70b-instruct`, but
`_pick("cloud")` returned a hardcoded OpenRouter URL for **every** candidate. An
NVIDIA model id was therefore POSTed to OpenRouter. The registry understood
multi-provider; the plumbing did not.

Resolution is now data-driven, in order:

1. the model id's own vendor prefix (`nvidia/…`, `openai/…`) against a provider
   registry that is the union of the tracked catalogs;
2. TNF's live `allocations.worker` from `data/llm-provider-status.json`;
3. the legacy OpenRouter constant.

A provider whose API key is absent from the environment is skipped rather than
returned — an endpoint that cannot authenticate is not a usable plan.

Verified on this host:

```
nvidia/meta/llama-3.3-70b-instruct        -> integrate.api.nvidia.com  [NVIDIA_API_KEY]
openrouter/deepseek/deepseek-chat-v3-0324 -> openrouter.ai             [OPENROUTER_API_KEY]
openai/gpt-4o-mini                        -> api.openai.com            [OPENAI_API_KEY]
groq/llama3-8b-8192                       -> openrouter.ai (live worker allocation; no GROQ key)
```

**The policy gate was not touched.** `default_tier: local-only` +
`allow_cloud: false` still refuses to escalate. This change widens _which_
backends a permitted tier can reach, never _whether_ a tier is permitted.

## Escalation flags do not work as documented

`model-policy.yaml` states:

> To escalate an envelope to cloud, pass `{preferred_tier: "cloud-ok"}` **or**
> `{cloud_ok: true}` in the envelope payload, OR flip this file globally.

Measured: **neither flag works alone.** They gate different variables —
`cloud_ok` sets `allow_cloud`, `preferred_tier` sets `tier` — and cloud
selection requires both. Only the undocumented conjunction escalates:

```
cloud_ok: true                       -> tier=none  (tier stayed local-only)
preferred_tier: cloud-ok             -> tier=none  (allow_cloud stayed false)
preferred_tier: cloud-ok + cloud_ok  -> tier=cloud  ✅
```

Left unchanged deliberately: escalation semantics control spend, so which way
this reconciles (fix the code to match the docs, or fix the docs to match the
code) is the operator's decision, not a silent edit.

## Open

- **P0 (structural):** bring `model_resolver.py` under version control, with the
  worker cron materialising it from the repo rather than the reverse.
- **P1:** collapse the four catalogs to one source of truth that all lanes read.
- **P2:** reconcile the escalation-flag documentation with behaviour.
- Neither local backend is currently running (`:8081` llama.cpp, `:11434`
  Ollama), so local tiers refuse regardless of the above.
