# Build Order Analysis

## Current Dependency Graph

Based on the analysis of package.json files, here's the dependency hierarchy:

### Level 0 (No internal dependencies - build first)

- `@the-new-fuse/prompt-templating` (no internal deps)
- `@tnf/core-error-handling` (no internal deps)
- `@tnf/core-monitoring` (no internal deps)
- `@the-new-fuse/infrastructure` (no internal deps)
- `@the-new-fuse/database` (no internal deps)

### Level 1 (Depends only on Level 0)

- `@the-new-fuse/types` (depends on: prompt-templating)
- `@the-new-fuse/relay-core` (depends on: database)
- `@the-new-fuse/core` (depends on: database, infrastructure)

### Level 2 (Depends on Level 0-1)

- `@the-new-fuse/api-types` (depends on: types)
- `@the-new-fuse/utils` (no internal deps found - should be Level 0)
- `@the-new-fuse/deployment-core` (depends on: types, core)
- `@the-new-fuse/extension-system` (depends on: relay-core)
- `@the-new-fuse/workflow-engine` (depends on: relay-core)

### Level 3 (Depends on Level 0-2)

- `@the-new-fuse/api-client` (depends on: api-types, types)
- `@the-new-fuse/shared` (depends on: core, types, utils)
- `@the-new-fuse/backend` (depends on: core, database, types, utils)
- `@the-new-fuse/agent` (depends on: core, types, utils, infrastructure)
- `@the-new-fuse/feature-tracker` (depends on: core, types, utils)

### Level 4 (Depends on Level 0-3)

- `@the-new-fuse/hooks` (depends on: api-client, fairtable-core, types)
- `@the-new-fuse/feature-suggestions` (depends on: feature-tracker)
- `@the-new-fuse/testing` (depends on: types)

### Apps (Build after all packages)

- `apps/api` (depends on: many packages)
- `apps/backend` (depends on: core, database, types, utils)
- `apps/frontend` (depends on: various packages)
- `apps/electron-desktop` (depends on: types, ui-consolidated)

## Issues Found

1. **Missing packages in turbo.json dependencies**: Some packages like
   `@the-new-fuse/utils`, `@the-new-fuse/infrastructure`,
   `@the-new-fuse/database` are not explicitly handled in build dependencies.

2. **Circular or missing dependency handling**: The current turbo.json uses
   `^build` and `^db:generate` but doesn't specify the exact order for
   foundational packages.

3. **Frontend build issue**: The frontend app needs to be built before the dev
   server can serve it.

## Recommended Build Order

1. First: Infrastructure packages (database, infrastructure, prompt-templating,
   core-error-handling, core-monitoring)
2. Second: Types and core packages (types, core, utils)
3. Third: Relay and extension systems (relay-core, extension-system,
   workflow-engine)
4. Fourth: API and client packages (api-types, api-client, deployment-core)
5. Fifth: Application packages (shared, backend, agent, feature-tracker)
6. Sixth: UI and testing packages (hooks, feature-suggestions, testing)
7. Finally: Applications (api, backend, frontend, electron-desktop)
