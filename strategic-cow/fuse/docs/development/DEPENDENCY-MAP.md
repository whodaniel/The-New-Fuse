# The New Fuse - Complete Dependency Map

This document provides a visual reference of all package dependencies in the
monorepo.

## Legend

- 🎯 **App** - Application package
- 📦 **Package** - Internal package
- ⭐ **High Impact** - 5+ dependents
- 🔧 **Foundation** - Core infrastructure package
- 🎨 **UI** - Frontend/UI package
- 🔌 **API** - Backend/API package

---

## Dependency Hierarchy (Build Order)

### Layer 0: Foundation (No Dependencies)

These packages have no internal dependencies and must be built first:

```
🔧 @the-new-fuse/prompt-templating
🔧 @tnf/core-monitoring
🔧 @tnf/core-error-handling
```

### Layer 1: Core Types & Infrastructure

Depends only on Layer 0:

```
⭐🔧 @the-new-fuse/types (18 dependents)
   └── @the-new-fuse/prompt-templating

🔧 @the-new-fuse/infrastructure (5 dependents)
   (no internal dependencies)
```

### Layer 2: Database & Utilities

Depends on Layer 0-1:

```
⭐🔧 @the-new-fuse/database (8 dependents)
   └── @the-new-fuse/types

⭐🔧 @the-new-fuse/utils (9 dependents)
   (no internal dependencies)

🔌 @the-new-fuse/relay-core (4 dependents)
   └── @the-new-fuse/database

📦 @the-new-fuse/api-types (3 dependents)
   └── @the-new-fuse/types
```

### Layer 3: Core Services

Depends on Layer 0-2:

```
⭐🔧 @the-new-fuse/core (10 dependents)
   ├── @the-new-fuse/database
   └── @the-new-fuse/infrastructure

🔌 @the-new-fuse/security
   ├── @the-new-fuse/database
   └── @the-new-fuse/core

🔌 @the-new-fuse/ap2-protocol
   (no internal dependencies)
```

### Layer 4: Extended Services

Depends on Layer 0-3:

```
🔌 @the-new-fuse/a2a-core (3 dependents)
   ├── @the-new-fuse/ap2-protocol
   └── @the-new-fuse/infrastructure

📦 @the-new-fuse/shared
   ├── @the-new-fuse/core
   ├── @the-new-fuse/types
   └── @the-new-fuse/utils

🔌 @the-new-fuse/sync-core
   ├── @the-new-fuse/database
   ├── @the-new-fuse/infrastructure
   ├── @the-new-fuse/prompt-templating
   ├── @tnf/core-error-handling
   └── @tnf/core-monitoring

🔌 @the-new-fuse/web-scraping
   ├── @the-new-fuse/mcp-core
   └── @the-new-fuse/ap2-protocol
```

### Layer 5: Frontend & UI

Depends on Layer 0-4:

```
🎨 @the-new-fuse/api-client
   ├── @the-new-fuse/api-types
   └── @the-new-fuse/types

🎨 @the-new-fuse/a2a-react
   └── @the-new-fuse/a2a-core

🎨 @the-new-fuse/fairtable-core
   (no internal dependencies)

🎨 @the-new-fuse/hooks
   ├── @the-new-fuse/api-client
   ├── @the-new-fuse/fairtable-core
   └── @the-new-fuse/types

🎨 @the-new-fuse/feature-tracker
   ├── @the-new-fuse/core
   ├── @the-new-fuse/types
   └── @the-new-fuse/utils

🎨 @the-new-fuse/feature-suggestions
   └── @the-new-fuse/feature-tracker

🎨 @the-new-fuse/ui-consolidated
   ├── @the-new-fuse/api-client
   ├── @the-new-fuse/hooks
   ├── @the-new-fuse/types
   └── @the-new-fuse/utils
```

### Layer 6: Applications

Final layer - depends on everything needed:

```
🎯 @the-new-fuse/api-gateway
   ├── @the-new-fuse/core
   └── @the-new-fuse/types

🎯 @the-new-fuse/backend-app
   ├── @the-new-fuse/core
   ├── @the-new-fuse/database
   ├── @the-new-fuse/types
   └── @the-new-fuse/utils

🎯 @the-new-fuse/api-server
   ├── @the-new-fuse/a2a-core
   ├── @the-new-fuse/api-types
   ├── @the-new-fuse/core
   ├── @the-new-fuse/database
   ├── @the-new-fuse/port-management
   ├── @the-new-fuse/security
   ├── @the-new-fuse/shared
   ├── @the-new-fuse/types
   ├── @the-new-fuse/utils
   └── @the-new-fuse/relay-core

🎯 @the-new-fuse/frontend-app
   ├── @the-new-fuse/a2a-core
   ├── @the-new-fuse/a2a-react
   ├── @the-new-fuse/core
   ├── @the-new-fuse/feature-suggestions
   ├── @the-new-fuse/port-management
   ├── @the-new-fuse/prompt-templating
   ├── @the-new-fuse/types
   └── @the-new-fuse/ui-consolidated
```

---

## Complete Package List with Dependencies

### Core Packages

#### @the-new-fuse/types ⭐ (18 dependents)

**Category:** Foundation **Dependencies:**

- @the-new-fuse/prompt-templating

**Used by:** Nearly every package in the monorepo

---

#### @the-new-fuse/core ⭐ (10 dependents)

**Category:** Foundation **Dependencies:**

- @the-new-fuse/database
- @the-new-fuse/infrastructure

**Used by:** api-server, backend-app, feature-tracker, security, shared, and 5
more

---

#### @the-new-fuse/utils ⭐ (9 dependents)

**Category:** Foundation **Dependencies:** None (pure utilities)

**Used by:** api-server, backend-app, feature-tracker, port-management, shared,
ui-consolidated, and 3 more

---

#### @the-new-fuse/database ⭐ (8 dependents)

**Category:** Foundation **Dependencies:**

- @the-new-fuse/types

**Used by:** api, api-server, backend, backend-app, core, relay-core, security,
sync-core

---

#### @the-new-fuse/infrastructure (5 dependents)

**Category:** Infrastructure **Dependencies:** None

**Used by:** a2a-core, agent, api, core, sync-core

---

### API & Communication Packages

#### @the-new-fuse/a2a-core (3 dependents)

**Category:** Communication **Dependencies:**

- @the-new-fuse/ap2-protocol
- @the-new-fuse/infrastructure

**Used by:** a2a-react, api-server, frontend-app

---

#### @the-new-fuse/a2a-react

**Category:** Communication **Dependencies:**

- @the-new-fuse/a2a-core

**Used by:** frontend-app

---

#### @the-new-fuse/api-types (3 dependents)

**Category:** API **Dependencies:**

- @the-new-fuse/types

**Used by:** agent, api-client, api-server

---

#### @the-new-fuse/api-client

**Category:** API **Dependencies:**

- @the-new-fuse/api-types
- @the-new-fuse/types

**Used by:** hooks, ui-consolidated

---

#### @the-new-fuse/relay-core (4 dependents)

**Category:** Infrastructure **Dependencies:**

- @the-new-fuse/database

**Used by:** api-server, extension-system, integration-tests, workflow-engine

---

### Frontend/UI Packages

#### @the-new-fuse/ui-consolidated

**Category:** UI **Dependencies:**

- @the-new-fuse/api-client
- @the-new-fuse/hooks
- @the-new-fuse/types
- @the-new-fuse/utils

**Used by:** frontend-app

---

#### @the-new-fuse/hooks

**Category:** UI **Dependencies:**

- @the-new-fuse/api-client
- @the-new-fuse/fairtable-core
- @the-new-fuse/types

**Used by:** ui-consolidated

---

#### @the-new-fuse/prompt-templating (3 dependents)

**Category:** UI **Dependencies:** None

**Used by:** sync-core, types, frontend-app

---

#### @the-new-fuse/feature-suggestions

**Category:** UI **Dependencies:**

- @the-new-fuse/feature-tracker

**Used by:** frontend-app

---

#### @the-new-fuse/feature-tracker

**Category:** UI **Dependencies:**

- @the-new-fuse/core
- @the-new-fuse/types
- @the-new-fuse/utils

**Used by:** feature-suggestions

---

### Build & Tooling Packages

#### @tnf/build-optimization

**Category:** Build **Dependencies:**

- @tnf/core-monitoring
- @tnf/core-error-handling

**Used by:** Root build scripts

---

#### @tnf/core-monitoring (3 dependents)

**Category:** Infrastructure **Dependencies:** None

**Used by:** build-optimization, mcp-core, sync-core

---

#### @tnf/core-error-handling (3 dependents)

**Category:** Infrastructure **Dependencies:** None

**Used by:** build-optimization, mcp-core, sync-core

---

### Fairtable Packages

#### @the-new-fuse/fairtable-core

**Category:** Domain **Dependencies:** None

**Used by:** fairtable-adapters, fairtable-components, hooks

---

#### @the-new-fuse/fairtable-components

**Category:** Domain **Dependencies:**

- @the-new-fuse/fairtable-core
- @the-new-fuse/fairtable-utils

**Used by:** fairtable-adapters

---

#### @the-new-fuse/fairtable-adapters

**Category:** Domain **Dependencies:**

- @the-new-fuse/fairtable-components
- @the-new-fuse/fairtable-core
- @the-new-fuse/fairtable-utils

---

#### @the-new-fuse/fairtable-utils

**Category:** Domain **Dependencies:** None

**Used by:** fairtable-adapters, fairtable-components

---

### Other Packages

#### @the-new-fuse/security

**Category:** Security **Dependencies:**

- @the-new-fuse/database
- @the-new-fuse/core

**Used by:** api-server

---

#### @the-new-fuse/port-management

**Category:** Infrastructure **Dependencies:**

- @the-new-fuse/types
- @the-new-fuse/utils

**Used by:** api-server, frontend-app

---

#### @the-new-fuse/workflow-engine

**Category:** Domain **Dependencies:**

- @the-new-fuse/relay-core

---

#### @the-new-fuse/web-scraping

**Category:** Integration **Dependencies:**

- @the-new-fuse/mcp-core
- @the-new-fuse/ap2-protocol

---

## Package Categories

### 🔧 Foundation (6 packages)

Critical packages that most others depend on:

- @the-new-fuse/types (18 deps)
- @the-new-fuse/core (10 deps)
- @the-new-fuse/utils (9 deps)
- @the-new-fuse/database (8 deps)
- @the-new-fuse/infrastructure (5 deps)
- @the-new-fuse/shared (3 deps)

### 🔌 API & Backend (7 packages)

Communication and backend services:

- @the-new-fuse/api
- @the-new-fuse/api-client
- @the-new-fuse/api-types
- @the-new-fuse/a2a-core
- @the-new-fuse/a2a-react
- @the-new-fuse/ap2-protocol
- @the-new-fuse/relay-core

### 🎨 Frontend/UI (9 packages)

User interface components:

- @the-new-fuse/ui-consolidated
- @the-new-fuse/hooks
- @the-new-fuse/prompt-templating
- @the-new-fuse/feature-suggestions
- @the-new-fuse/feature-tracker
- @the-new-fuse/fairtable-core
- @the-new-fuse/fairtable-components
- @the-new-fuse/fairtable-adapters
- @the-new-fuse/fairtable-utils

### 🏗️ Infrastructure (5 packages)

Build and development tools:

- @tnf/build-optimization
- @tnf/core-monitoring
- @tnf/core-error-handling
- @the-new-fuse/deployment-core
- eslint-config-custom

### 🔐 Security & Services (7 packages)

Backend services:

- @the-new-fuse/backend
- @the-new-fuse/security
- @the-new-fuse/port-management
- @the-new-fuse/mcp-core
- @the-new-fuse/web-scraping
- @the-new-fuse/workflow-engine
- @the-new-fuse/sync-core

### 🧪 Testing (5 packages)

Test utilities:

- @the-new-fuse/testing
- @the-new-fuse/test-utils
- @the-new-fuse/integration-tests
- @the-new-fuse/client
- @the-new-fuse/agent

### ⚙️ Configuration (9 packages)

Utilities and config:

- @the-new-fuse/contracts
- @the-new-fuse/common
- @the-new-fuse/proto-definitions
- @the-new-fuse/extension-system
- @the-new-fuse/core-vector-db
- features
- integrations
- layout
- monitoring

---

## Impact Analysis

### If @the-new-fuse/types changes:

**Rebuild required:** 18 packages + 4 apps = 22 total

### If @the-new-fuse/core changes:

**Rebuild required:** 10 packages + 3 apps = 13 total

### If @the-new-fuse/database changes:

**Rebuild required:** 8 packages + 2 apps = 10 total

### If @the-new-fuse/utils changes:

**Rebuild required:** 9 packages + 2 apps = 11 total

---

## Build Time Optimization

To minimize build times when making changes:

1. **Changes to foundation packages** (types, core, database, utils)
   - Expect longer build times (many dependents)
   - Use `pnpm build --filter=...^` to build only affected packages

2. **Changes to UI packages** (ui-consolidated, hooks, etc.)
   - Only frontend-app needs rebuild
   - Faster iteration

3. **Changes to isolated packages** (fairtable-core, prompt-templating, etc.)
   - Minimal rebuild required
   - Fastest iteration

---

## Dependency Management Rules

### ✅ Good Practices

1. **Foundation packages should have minimal dependencies**
   - types, utils, infrastructure have few/no dependencies ✅

2. **Avoid deep dependency chains**
   - Longest chain is 5 levels (app → ui → api-client → api-types → types) ✅

3. **No circular dependencies**
   - Audit confirms zero circular dependencies ✅

4. **UI packages don't depend on backend packages**
   - Clear separation maintained ✅

### ⚠️ Watch Out For

1. **Adding dependencies to high-impact packages**
   - Changes to types, core, or database affect many packages

2. **Creating new circular dependencies**
   - Always check with: `pnpm dlx madge --circular packages/[name]/src`

3. **Bypassing abstraction layers**
   - Apps should use service layer, not database directly

---

## Quick Reference Commands

```bash
# Check dependencies for a package
node analyze-monorepo.js | grep -A 10 "@the-new-fuse/[package-name]"

# Build only a package and its dependencies
pnpm build --filter="@the-new-fuse/[package-name]..."

# Build only packages that depend on this package
pnpm build --filter="...@the-new-fuse/[package-name]"

# Check for circular dependencies
pnpm dlx madge --circular packages/[package-name]/src

# See what would rebuild if package changes
turbo run build --filter="...@the-new-fuse/[package-name]" --dry-run
```

---

Last updated: 2025-11-18
