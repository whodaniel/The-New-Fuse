# Product Experience Architecture (March 3, 2026)

## Purpose

Define a holistic product model for The New Fuse that aligns:

1. current routed surfaces,
2. intended framework capabilities (orchestrator + heartbeat + message broker),
3. real user/operator workflows.

This is a system-architecture document, not a page-redesign brief.

## Evidence Base

Inputs used for this architecture pass:

1. `apps/frontend/src/ComprehensiveRouter.tsx` (157 routes)
2. `apps/frontend/src/components/SmartNavigation.tsx` (primary top navigation)
3. `apps/frontend/src/config/routeCatalog.ts` (158 catalog entries)
4. `apps/frontend/docs/audits/navigation-route-audit.md` (generated 2026-03-03)
5. `docs/TNF_AGENT_THREE_PILLARS.md` (orchestrator/heartbeat/broker intent)
6. `docs/TNF_UNIFIED_AI_SYSTEM.md` (system coherence and ops model intent)

## Core Finding

The app has broad capability coverage, but product coherence is reduced by:

1. route sprawl and alias drift,
2. duplicated entry points for the same jobs-to-be-done,
3. visual/interaction inconsistency across operational surfaces,
4. insufficient lifecycle signaling (production vs prototype vs internal/admin),
5. page-first navigation instead of workflow-first navigation.

## Target Product Model

The New Fuse should be organized around six capability domains:

1. `Operate`: Dashboard, agents, tasks, execution control.
2. `Automate`: Workflow design, runs, templates, execution console.
3. `Collaborate`: Workspace members, chat, suggestions, timeline.
4. `Observe`: Analytics, observability, health, live view.
5. `Govern`: Admin, audit, security, settings, controls.
6. `Ecosystem`: Hub, MCP, marketplace/platform, documentation, integration.

## Canonical Operator Journeys

1. `Detect -> Triage -> Execute`
2. `Design -> Simulate -> Deploy -> Monitor`
3. `Task Intake -> Assignment -> Completion -> Review`
4. `Incident -> Root Cause -> Mitigation -> Verification`
5. `Onboard -> Configure -> Govern -> Audit`

## IA Rules (Non-Negotiable)

1. Every major route must map to exactly one primary domain.
2. Each domain must expose a canonical landing route (single source of truth).
3. Alias routes remain supported, but flagged as aliases in catalog metadata.
4. Prototype/internal routes (`/html/*`, `/package/*`, debug) are not
   first-class nav.
5. Top navigation reflects workflows and domains, not implementation artifacts.

## Surface Lifecycle Labels

Every route should carry one of:

1. `production`
2. `beta`
3. `internal`
4. `deprecated`

This metadata drives:

1. visibility in nav,
2. visibility in `/all-pages`,
3. release gating and QA scope.

## Architecture Backlog (Phased)

## Phase 1: Product Metadata Foundation

1. Add machine-readable domain model for canonical surfaces.
2. Enforce route-to-domain mapping completeness in CI.
3. Add lifecycle state and ownership metadata to route catalog.

## Phase 2: Navigation and Entry-Point Convergence

1. Refactor `SmartNavigation` to be config-driven by domain.
2. Add operator-centric shortcuts (Do Next, Incidents, Running Workflows).
3. Demote non-production/prototype routes from primary navigation.

## Phase 3: Workflow-Level UX Convergence

1. Apply shared header/action/status patterns to all domain landing pages.
2. Standardize cross-surface state language (status, priority, health).
3. Add actionable "focus items" everywhere critical signals are shown.

## Phase 4: System Integrity

1. Route audit in CI (catalog/router/nav parity).
2. UX consistency checks for shell components.
3. Domain-based telemetry dashboards (adoption, drop-off, completion).

## Specialized Subagent Lanes (Execution Model)

Use these lanes in parallel for future iterations:

1. `Codebase Pathway Tracer`: route/component/dataflow map.
2. `Information Retrieval`: reconcile framework docs, ADRs, capability intent.
3. `Agent Relationship Grapher`: map domain dependencies and handoff points.
4. `Frontend Debugger`: runtime regression and interaction integrity.
5. `Task Agent Router`: enforce best-fit delegation of refactor subtasks.

## Definition of Done (Holistic Refactor)

A refactor is complete only when:

1. all major domains have canonical entry points,
2. navigation, catalog, and router are aligned,
3. workflows (not pages) are the primary organizing principle,
4. lifecycle labels prevent prototype bleed into production UX,
5. operators can complete end-to-end journeys without route hunting.
