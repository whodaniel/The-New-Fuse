# Workflow Builder package boundary

`@the-new-fuse/workflow-builder` is the canonical TNF workflow builder. Every
surface renders the same builder; only data access differs, and it differs only
through one explicit contract.

## Why the package exists

The monorepo carried at least seven workflow-builder implementations, several of
them unrouted orphans, while a complete 12-node library sat in
`apps/frontend/src/components/workflow/nodes` with no importer but a README. It
was unusable anywhere else because it imported that app's private UI kit
(`@/components/ui`) and its hooks and services directly. So `apps/tauri-desktop`
shipped four crude inline node types instead, and the two surfaces drifted.

Consolidating means the desktop app does not *match* the SaaS builder — it runs
the same one.

## What is inside

| Path | Contents |
| --- | --- |
| `src/nodes/` | The 12-node library over a shared `BaseNode`, plus `nodeTypes` |
| `src/canvas/` | `WorkflowCanvas` — the ReactFlow surface |
| `src/context/` | `WorkflowProvider` / `useWorkflow` — graph state, save, load |
| `src/panels/` | `NodeProperties` — the per-node property editor |
| `src/validation/` | The zod workflow schema and its validators |
| `src/host/` | The host contract: `WorkflowHost`, `WorkflowHostProvider`, `useWorkflowHost` |

## The boundary rule

**The package never imports from an app.** It has exactly three runtime
dependencies on the outside world:

1. `react` / `reactflow` (peer dependencies)
2. `@the-new-fuse/ui-consolidated` for every UI primitive
3. `zod`, for the schema

Anything host-specific — how to reach agents, MCP servers, persistence, or
execution — is declared as a port in `src/host/types.ts` and supplied by the
host. A `grep "from '@/"` over `packages/workflow-builder/src` returns nothing,
and that is the invariant to keep.

### The host contract

```ts
interface WorkflowHost {
  useAgentsWorkflow(): AgentsWorkflowState;   // agent palette
  useMcpTools(): McpToolsState;               // MCP servers + tools
  workflowDatabase: WorkflowDatabasePort;     // list/read saved workflows
  workflowExecution: WorkflowExecutionPort;   // run a workflow
  workflowApi: WorkflowApiPort;               // save/load the current graph
}
```

Port method names deliberately mirror the SaaS singletons, so its adapter is a
pass-through rather than a translation layer that could drift on its own.

`useWorkflowHost()` **throws** when no provider is present. It does not degrade.
Silent degradation is what let the previous builders look alive while doing
nothing — an inert palette that renders is worse than an error that names the
missing wiring.

### Adapters

| Surface | Adapter |
| --- | --- |
| SaaS frontend | `apps/frontend/src/workflow/saas-workflow-host.ts` |
| Tauri desktop | `apps/tauri-desktop/src/workflow/tauri-workflow-host.ts` |

Adapters never import each other. A previous parallel attempt had the Tauri
adapter spread the SaaS adapter's object, which reintroduces exactly the coupling
the package removes: the desktop app would then depend on the web app's private
module graph.

### Host responsibilities

Hosts must:

- wrap the builder in `<WorkflowHostProvider host={...}>`, outside
  `ReactFlowProvider` and `WorkflowProvider`
- import `reactflow/dist/style.css` once in the app shell — the package does not
  import CSS, because a shared package must not pull stylesheets into whatever
  bundler (or non-bundler) a surface happens to use

## Adding a surface

Implement `WorkflowHost`, wrap the builder in the provider, and pass
`nodeTypes` to `<ReactFlow>`. Nothing else. If a new surface needs data the
contract does not cover, add a port — do not reach into another app.

## Node type keys are a storage contract

The keys of `nodeTypes` (`agent`, `mcpTool`, `input`, `output`, `condition`,
`transform`, `notification`, `a2a`, `loop`, `subworkflow`, `prompt`, `default`)
are the persisted `node.type` values. Renaming one silently breaks every saved
workflow that referenced it.

This is why the Tauri page has **not** yet swapped its inline node map for the
shared one: the desktop app persists a `flowControl` type the shared library
does not define, and maps `input` to ReactFlow's built-in node for its start
node, where the shared library defines a full `InputNode`. Swapping the map
without migrating persisted graphs would change how existing desktop workflows
render. The desktop adapter and dependency are in place; the node-map migration
is a separate change that needs a data migration and a visual check.

## Known gaps

- **`workflowExecution` on the SaaS host is unimplemented.** `subworkflow-node`
  calls `executeWorkflow` and `getExecutionHistory`, but the frontend's
  `WorkflowExecutionService` is a WebSocket subscription client and has never
  implemented either. This predates the extraction — the node threw a
  `TypeError` before it too. The adapter now throws a message that names the
  missing method instead.
