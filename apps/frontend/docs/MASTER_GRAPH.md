# Living master graph

The native `/visualizations/master-graph` route and `/graph-demo` alias share
the same viewer and service with the dynamic knowledge graph and legacy graph
component. The visualization hub and terminal graph link to this surface.

## Data and authority

`shared/master-graph.ts` owns the versioned `tnf.master-graph/v1` response
contract, runtime validation, bounded traversal, and freshness calculations.
Both the React view and the Pages API use these exact functions.
`shared/master-graph-api.ts` composes sources; it does not introduce a new
runtime registry or persist tenant data.

`scripts/build-master-graph.mjs` reads the existing master framework graph and
explicit absolute JSX route declarations. It writes
`dist/data/master-graph.json` after Vite's legacy visualization cleanup, on
every frontend production build. Build revision and source timestamps travel
with the graph. The historical graph's March 9 timestamp is preserved; source
presence and declared routes are not assertions of completed implementation or
deployment health. Dynamic route templates and old unverified routes do not
become clickable destinations. New route nodes connect to the existing frontend
app node. Four historical missing-endpoint edges are excluded from traversal and
retained in `issues`.

The API fetches actual `/api/system/master-clock` and `/api/terminals/graph`
payloads. Terminal requests retain caller Authorization/Cookie headers, request
redacted commands, and rely on the existing backend tenant authorization. No
query parameter can override that tenant. The response is private/no-store,
never cached globally. Anonymous requests skip terminal inventory. Source
failures remain explicit and do not fabricate runtime data. The client aborts
requests and clears its graph when account or tenant changes, and refreshes
every 30 seconds without overlapping polls.

Clock processes attach their own status and observation timestamp. Contract
fallback processes are labeled projected. Inventory freshness uses its mirror
timestamp, not the response generation time. Freshness continues to expire in
the UI during an outage. `metadata.graphNodeId` (clock) or `data.graphNodeId`
(terminal nodes) can explicitly link a producer observation to an existing
structural node. Missing IDs remain unresolved. The existing terminal
`matchedAgentId` is a heuristic candidate, shown as a dashed relationship and
excluded from traversal by default. None of these observations overwrite
structural implementation evidence.

## Agent traversal

GET `/api/master-graph` returns the validated graph, source diagnostics, and
`query` result. Use `live=false&scope=source` for source-only traversal without
upstream calls, or explicitly choose `scope=all` to audit legacy claims.

- `scope=source&mode=all&q=frontend&kind=app`: case-insensitive name/ID search
  and exact kind filter.
- `scope=source&mode=neighbors&node=app:frontend&direction=out&depth=1`:
  outgoing relationships.
- `scope=source&mode=dependents&node=app:frontend&depth=2`: reverse
  relationships / impact candidates.
- `scope=source&mode=path&from=app:frontend&to=route:/visualizations/master-graph`:
  shortest directed path.
- `direction=both`: explicitly ignore direction. Bidirectional source edges work
  both ways.
- `includeCandidates=true`: explicitly include unverified identity edges.
- `limit=2000` (maximum) bounds selected nodes; depth is 1–8. `truncated`
  distinguishes a bounded search from an exhaustive no-path result. Unknown
  selected nodes return 404; invalid queries return JSON 400; a missing/non-JSON
  artifact returns JSON 503.

Incoming relationships are impact candidates, not automatically executable
workflow dependencies. All-path search is bounded by graph size and the node
limit.

## Development and validation

Vite's `master-graph-api` plugin invokes the same Pages handler and builder
during local development. It uses the real hosted runtime endpoints; no
simulated source is used. The deployed Pages route is
`functions/api/master-graph.ts`.

Run `pnpm --filter @the-new-fuse/frontend-app test:master-graph`. Contract tests
cover the actual repository snapshot, directionality, caps, invalid inputs,
projections, authorization forwarding, partial-source failure and missing
endpoints. Component checks cover search, evidence links, errors and
account-change cancellation.

A production release also requires the frontend build, Pages Functions
compilation, HTTP read-back of `/api/master-graph?live=false` matching the
deployed commit, a clock observation freshness check, and anonymous terminal
denial. A 200 HTML app shell is not graph API proof.

## Evidence scopes and limits of verification

The default UI and API query scope is `runtime`: only fresh timestamped node and
edge observations participate. `scope=source` includes current source presence
and route declarations, but excludes historical edges even when both endpoints
still exist. `scope=all` explicitly includes legacy, stale, unknown and
projected records for audit. Identity candidates remain separately opt-in. The
API's `nodes` and `edges` are the complete evidence catalog; `query` is the
scoped traversal result. `assessment` reports evidence counts and
`functionalWiring: unverified`. Neither a path nor a resolved endpoint
establishes an executable integration. Source scope is inventory, not behavior
verification.

A reachable endpoint can report stale data. Source status now reports `stale` or
`unknown` when appropriate, and observation freshness governs traversal at query
time and as the UI clock advances. Clock entries are `reports_process`
relationships, not proof of scheduling or execution. No route-to-runtime wiring
is inferred from the existence of an API or app route. Producer-supplied
identity links remain observations rather than proof that an implementation
works.

The 2026-09-09 audit found 1,262 historical relationships and 35 stale clock
process observations from the reachable production endpoint. This is an audit
snapshot, not a fixed expected health count. The previous release's statement of
35 live processes was incorrect: it verified delivery, not freshness or
functional execution. Existing living-state documents are claims to reconcile
with attributable execution evidence, not an automatic verification source.
