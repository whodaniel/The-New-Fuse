# The New Fuse - Comprehensive Documentation Map

**Total Documentation Files:** 1,200+ **Last Updated:** 2026-02-18

This document provides a complete map of all documentation in The New Fuse
project, showing categorization, relationships, and recommended navigation
paths.

**See [README.md](./README.md) for the full codebase architecture overview.**

---

## Progressive Ideas Map (Living)

Rule (Daniel): **Every progressive original idea goes here immediately.** No
orphan ideas.

### 2026-02-09 — TNF x OpenClaw x Cloudflare

1. **TNF SharedState as canonical truth layer** (receipts + permissions +
   projections + deterministic withdraw/deposit)
2. **Cloud OpenClaw Gateway runtime** integrated with TNF (Telegram-first ->
   full tool/browse)
3. **Gates of Truth enforcement** (proof refs required; anti-fake-progress)
4. **Universal Taskboard + Loose Ends with automations** (staleness checks,
   receipts per state change)
5. **Stall-defense + long-running engagement as protocol primitive** (keepalive,
   rediscovery, quota handoff)
6. **Context Pack standard** across runtimes (OpenClaw/Claude/Gemini/Jules/TNF)
7. **Security-by-default redaction + permission scopes** for any mirror/export
8. **TNF Protocol Harness SDK** (TS/Python client libs for
   deposit/withdraw/mirror)
9. **Browser automation at scale** (Cloudflare Browser Rendering + replayable
   traces)
10. **Public reference deployment** (one-click "child of two protocols")

## Quick Navigation

| Category                                                   | Files | Priority |
| ---------------------------------------------------------- | ----- | -------- |
| [Getting Started](#getting-started)                        | 131   | ⭐⭐⭐   |
| [Architecture & Design](#architecture--design)             | 32    | ⭐⭐⭐   |
| [Backend & API](#backend--api)                             | 23    | ⭐⭐⭐   |
| [Frontend & UI](#frontend--ui)                             | 41    | ⭐⭐     |
| [Agent System](#agent-system)                              | 161   | ⭐⭐⭐   |
| [Workflows & Automation](#workflows--automation)           | 24    | ⭐⭐     |
| [Deployment & Infrastructure](#deployment--infrastructure) | 66    | ⭐⭐⭐   |
| [Build System](#build-system)                              | 23    | ⭐⭐     |
| [Testing & Quality](#testing--quality)                     | 21    | ⭐⭐     |
| [Performance](#performance)                                | 20    | ⭐⭐     |
| [Security](#security)                                      | 23    | ⭐⭐⭐   |
| [Chrome Extension](#chrome-extension)                      | 13    | ⭐       |
| [MCP Integration](#mcp-integration)                        | 18    | ⭐⭐     |
| [Database & Drizzle ORM](#database--drizzle-orm)           | 8     | ⭐⭐     |
| [Project Management](#project-management)                  | 61    | ⭐⭐     |

---

## Documentation Navigation Paths

### Path 1: New Developer Onboarding

1. **Start**: [README.md](./README.md)
2. **Setup**: [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md)
3. **Architecture**:
   [docs/architecture/ARCHITECTURE_STANDARDS.md](./docs/architecture/ARCHITECTURE_STANDARDS.md)
4. **Development**:
   [docs/development/GETTING_STARTED.md](./docs/development/GETTING_STARTED.md)
5. **Build**:
   [docs/development/BUILD_GUIDE.md](./docs/development/BUILD_GUIDE.md)

### Path 2: Production Deployment

1. **Status Check**: [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md)
2. **Deployment Guide**:
   [docs/deployment/DEPLOYMENT_GUIDE.md](./docs/deployment/DEPLOYMENT_GUIDE.md)
3. **Railway Specific**:
   [docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md](./docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md)
4. **Docker Setup**:
   [docs/guides/docker-setup.md](./docs/guides/docker-setup.md)
5. **Monitoring**:
   [docs/deployment/MONITORING.md](./docs/deployment/MONITORING.md)

### Path 3: Agent Development

1. **Overview**:
   [docs/agents/COMPLETE-AGENT-GUIDE.md](./docs/agents/COMPLETE-AGENT-GUIDE.md)
2. **Communication**:
   [docs/AGENT_COMMUNICATION_PROTOCOL.md](./docs/AGENT_COMMUNICATION_PROTOCOL.md)
3. **Development**:
   [docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE.md](./docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE.md)
4. **Registry**:
   [apps/backend/src/modules/agent-registry/README.md](./apps/backend/src/modules/agent-registry/README.md)
5. **Examples**: [.claude/agents/](/.claude/agents/)

### Path 4: Frontend Development

1. **Overview**: [apps/frontend/README.md](./apps/frontend/README.md)
2. **Quick Start**:
   [apps/frontend/QUICK_START.md](./apps/frontend/QUICK_START.md)
3. **Design System**:
   [docs/DESIGN_SYSTEM_DOCUMENTATION.md](./docs/DESIGN_SYSTEM_DOCUMENTATION.md)
4. **Components**:
   [apps/frontend/src/components/layout/README.md](./apps/frontend/src/components/layout/README.md)
5. **UX Guidelines**:
   [docs/ui-ux/UX_AUDIT_SUMMARY.md](./docs/ui-ux/UX_AUDIT_SUMMARY.md)

### Path 5: Backend/API Development

1. **Overview**: [apps/backend/README.md](./apps/backend/README.md)
2. **API Examples**:
   [apps/backend/API_EXAMPLES.md](./apps/backend/API_EXAMPLES.md)
3. **GraphQL**:
   [apps/api/src/graphql/README.md](./apps/api/src/graphql/README.md)
4. **WebSocket**:
   [apps/backend/WEBSOCKET_INTEGRATION_GUIDE.md](./apps/backend/WEBSOCKET_INTEGRATION_GUIDE.md)
5. **Performance**:
   [apps/backend/PERFORMANCE_OPTIMIZATION.md](./apps/backend/PERFORMANCE_OPTIMIZATION.md)

### Path 6: Testing & Quality

1. **Setup**:
   [docs/testing/TESTING_SETUP_COMPLETE.md](./docs/testing/TESTING_SETUP_COMPLETE.md)
2. **E2E Testing**:
   [docs/testing/E2E_TEST_SUMMARY.md](./docs/testing/E2E_TEST_SUMMARY.md)
3. **Best Practices**:
   [docs/testing/BEST_PRACTICES.md](./docs/testing/BEST_PRACTICES.md)
4. **Code Quality**:
   [docs/development/CODE_QUALITY_SETUP_COMPLETE.md](./docs/development/CODE_QUALITY_SETUP_COMPLETE.md)

---

## Getting Started

**Primary Documents:**

- [README.md](./README.md) - Project overview, installation, quick start
- [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - Fast development setup (7-day
  launch path)
- [DOCUMENTATION_INDEX.md](./DOCUMENTATION_INDEX.md) - Master index of all docs
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Current production
  status

**Application-Specific READMEs:**

- [apps/backend/README.md](./apps/backend/README.md)
- [apps/frontend/README.md](./apps/frontend/README.md)
- [apps/chrome-extension/README.md](./apps/chrome-extension/README.md)
- [apps/vscode-extension/README.md](./apps/vscode-extension/README.md)
- [apps/tauri-desktop/README.md](./apps/tauri-desktop/README.md)

**Package Documentation:**

- 35+ package-specific READMEs in `packages/*/README.md`

---

## Architecture & Design

**Core Architecture:**

- [docs/architecture/ARCHITECTURE_STANDARDS.md](./docs/architecture/ARCHITECTURE_STANDARDS.md)
- [docs/architecture/MONOREPO_ARCHITECTURE.md](./docs/architecture/MONOREPO_ARCHITECTURE.md)
- [docs/architecture/ARCHITECTURE_ANALYSIS_SUMMARY.md](./docs/architecture/ARCHITECTURE_ANALYSIS_SUMMARY.md)

**Design System:**

- [docs/DESIGN_SYSTEM_DOCUMENTATION.md](./docs/DESIGN_SYSTEM_DOCUMENTATION.md)
- [docs/DESIGN_SYSTEM_IMPLEMENTATION_PLAN.md](./docs/DESIGN_SYSTEM_IMPLEMENTATION_PLAN.md)
- [docs/DESIGN_SYSTEM_STATUS_REPORT.md](./docs/DESIGN_SYSTEM_STATUS_REPORT.md)

**Code Quality:**

- [docs/architecture/CODE_DUPLICATION_REPORT.md](./docs/architecture/CODE_DUPLICATION_REPORT.md)
- [docs/architecture/REFACTORING_OPPORTUNITIES.md](./docs/architecture/REFACTORING_OPPORTUNITIES.md)

**Related:** See also [Build System](#build-system),
[Testing & Quality](#testing--quality)

---

## Backend & API

**Main Documentation:**

- [apps/backend/README.md](./apps/backend/README.md) - Backend overview
- [apps/backend/API_EXAMPLES.md](./apps/backend/API_EXAMPLES.md) - API usage
  examples
- [docs/API_USAGE_GUIDE.md](./docs/API_USAGE_GUIDE.md) - Comprehensive API guide

**GraphQL:**

- [apps/api/src/graphql/README.md](./apps/api/src/graphql/README.md)
- [apps/api/src/graphql/GRAPHQL_EXAMPLES.md](./apps/api/src/graphql/GRAPHQL_EXAMPLES.md)
- [docs/integrations/GRAPHQL_IMPLEMENTATION_SUMMARY.md](./docs/integrations/GRAPHQL_IMPLEMENTATION_SUMMARY.md)

**WebSocket:**

- [apps/backend/WEBSOCKET_INTEGRATION_GUIDE.md](./apps/backend/WEBSOCKET_INTEGRATION_GUIDE.md)
- [docs/websocket/WEBSOCKET_INFRASTRUCTURE_SUMMARY.md](./docs/websocket/WEBSOCKET_INFRASTRUCTURE_SUMMARY.md)
- [docs/websocket/WEBSOCKET_ARCHITECTURE.md](./docs/websocket/WEBSOCKET_ARCHITECTURE.md)

**Caching & Performance:**

- [apps/backend/CACHING_IMPLEMENTATION_SUMMARY.md](./apps/backend/CACHING_IMPLEMENTATION_SUMMARY.md)
- [apps/backend/CACHE_QUICK_START.md](./apps/backend/CACHE_QUICK_START.md)
- [apps/backend/PERFORMANCE_OPTIMIZATION.md](./apps/backend/PERFORMANCE_OPTIMIZATION.md)

**Modules:**

- [apps/backend/src/modules/agent-registry/](./apps/backend/src/modules/agent-registry/)
  - [README.md](./apps/backend/src/modules/agent-registry/README.md)
  - [API_DOCUMENTATION.md](./apps/backend/src/modules/agent-registry/API_DOCUMENTATION.md)
- [apps/backend/src/modules/chat-rooms/](./apps/backend/src/modules/chat-rooms/)
  - [README.md](./apps/backend/src/modules/chat-rooms/README.md)
  - [DEMO_SCENARIOS.md](./apps/backend/src/modules/chat-rooms/DEMO_SCENARIOS.md)
- [apps/backend/src/modules/mcp/](./apps/backend/src/modules/mcp/)
  - [README.md](./apps/backend/src/modules/mcp/README.md)
  - [QUICKSTART.md](./apps/backend/src/modules/mcp/QUICKSTART.md)

**Related:** See also [Performance](#performance),
[MCP Integration](#mcp-integration), [Agent System](#agent-system)

---

## Frontend & UI

**Main Documentation:**

- [apps/frontend/README.md](./apps/frontend/README.md) - Frontend overview
- [apps/frontend/QUICK_START.md](./apps/frontend/QUICK_START.md) - Quick setup
  guide
- [apps/frontend/PRODUCTION_CHECKLIST.md](./apps/frontend/PRODUCTION_CHECKLIST.md)

**Design & UX:**

- [docs/DESIGN_SYSTEM_DOCUMENTATION.md](./docs/DESIGN_SYSTEM_DOCUMENTATION.md)
- [docs/ui-ux/UX_AUDIT_SUMMARY.md](./docs/ui-ux/UX_AUDIT_SUMMARY.md)
- [docs/ui-ux/UI_UX_TRANSFORMATION_ROADMAP.md](./docs/ui-ux/UI_UX_TRANSFORMATION_ROADMAP.md)
- [docs/ui-ux/UX_VISUAL_INSPECTION_CHECKLIST.md](./docs/ui-ux/UX_VISUAL_INSPECTION_CHECKLIST.md)

**Chakra Migration:**

- [apps/frontend/CHAKRA_MIGRATION_FINAL_SUMMARY.md](./apps/frontend/CHAKRA_MIGRATION_FINAL_SUMMARY.md)
- [docs/CHAKRA_MIGRATION_GUIDE.md](./docs/CHAKRA_MIGRATION_GUIDE.md)
- [docs/CHAKRA_VS_CUSTOM_DESIGN_SYSTEM.md](./docs/CHAKRA_VS_CUSTOM_DESIGN_SYSTEM.md)

**Responsive Design:**

- [apps/frontend/MOBILE_RESPONSIVE_SUMMARY.md](./apps/frontend/MOBILE_RESPONSIVE_SUMMARY.md)
- [apps/frontend/RESPONSIVE_QUICK_REFERENCE.md](./apps/frontend/RESPONSIVE_QUICK_REFERENCE.md)
- [docs/ui-ux/RESPONSIVE_LANDING_PAGE_COMPLETE.md](./docs/ui-ux/RESPONSIVE_LANDING_PAGE_COMPLETE.md)

**Components:**

- [apps/frontend/src/components/layout/README.md](./apps/frontend/src/components/layout/README.md)
- [apps/frontend/src/components/landing/README.md](./apps/frontend/src/components/landing/README.md)
- [apps/frontend/src/components/WorkflowEditor/README.md](./apps/frontend/src/components/WorkflowEditor/README.md)

**Performance:**

- [apps/frontend/PERFORMANCE_OPTIMIZATION.md](./apps/frontend/PERFORMANCE_OPTIMIZATION.md)
- [apps/frontend/PRODUCTION_OPTIMIZATIONS.md](./apps/frontend/PRODUCTION_OPTIMIZATIONS.md)

**Related:** See also [Design System](#architecture--design),
[Performance](#performance)

---

## Agent System

**Core Agent Documentation:**

- [docs/agents/COMPLETE-AGENT-GUIDE.md](./docs/agents/COMPLETE-AGENT-GUIDE.md) -
  Comprehensive guide
- [docs/AGENT_COMMUNICATION_PROTOCOL.md](./docs/AGENT_COMMUNICATION_PROTOCOL.md) -
  Communication spec
- [docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE.md](./docs/agents-and-protocols/AGENT_DEVELOPMENT_GUIDE.md)
- [docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md](./docs/agents-and-protocols/AGENT_FRAMEWORK_PROTOCOLS.md)

**Agent Registry:**

- [apps/backend/src/modules/agent-registry/README.md](./apps/backend/src/modules/agent-registry/README.md)
- [apps/backend/src/modules/agent-registry/API_DOCUMENTATION.md](./apps/backend/src/modules/agent-registry/API_DOCUMENTATION.md)
- [docs/AVAILABLE_AGENTS_REGISTRY.md](./docs/AVAILABLE_AGENTS_REGISTRY.md)

**Agent Communication:**

- [docs/AGENT-COMMUNICATION-GUIDE.md](./docs/AGENT-COMMUNICATION-GUIDE.md)
- [docs/AGENT_REDIS_COMMUNICATION.md](./docs/AGENT_REDIS_COMMUNICATION.md)
- [docs/agents-and-protocols/AGENT_COMMUNICATION_ARCHITECTURE.md](./docs/agents-and-protocols/AGENT_COMMUNICATION_ARCHITECTURE.md)
- [packages/tnf-cli/README.md](./packages/tnf-cli/README.md) - TNF CLI Agent
  System

**Agent Discovery:**

- [docs/agents/AGENT_DISCOVERY_SUMMARY.md](./docs/agents/AGENT_DISCOVERY_SUMMARY.md)
- [docs/agent-discovery-system.md](./docs/agent-discovery-system.md)
- [.claude/commands/agent-discover.md](./.claude/commands/agent-discover.md)

**Agent Swarms:**

- [docs/agents/AGENT_SWARM_SUMMARY.md](./docs/agents/AGENT_SWARM_SUMMARY.md)
- [docs/BROWSER_HUB_SWARM.md](./docs/BROWSER_HUB_SWARM.md)

**Agent Definitions:** (127+ specialized agents in `.claude/agents/`)

- Content Creation Agents (podcast, video, social media)
- Marketing & SEO Agents
- Business & Monetization Agents
- Technical & Infrastructure Agents
- See [.claude/agents/](./.claude/agents/) for complete list

**Slash Commands:** (17 commands in `.claude/commands/`)

- [.claude/commands/agent-register.md](./.claude/commands/agent-register.md)
- [.claude/commands/agent-discover.md](./.claude/commands/agent-discover.md)
- [.claude/commands/agent-status.md](./.claude/commands/agent-status.md)
- See [.claude/commands/README.md](./.claude/commands/README.md) for all
  commands

**Related:** See also [Backend & API](#backend--api),
[Workflows & Automation](#workflows--automation)

---

## Workflows & Automation

**Main Documentation:**

- [docs/workflows/WORKFLOW_QUICKSTART.md](./docs/workflows/WORKFLOW_QUICKSTART.md)
- [docs/workflows/WORKFLOW_BUILDER_ENHANCEMENTS.md](./docs/workflows/WORKFLOW_BUILDER_ENHANCEMENTS.md)
- [docs/WORKFLOW_BUILDER_GUIDE.md](./docs/WORKFLOW_BUILDER_GUIDE.md)

**n8n Integration:**

- [WORKFLOW_N8N_COMPLETE.md](./WORKFLOW_N8N_COMPLETE.md)
- [docs/N8N_WORKFLOWS.md](./docs/N8N_WORKFLOWS.md)
- [.claude/commands/n8n-workflow-search.md](./.claude/commands/n8n-workflow-search.md)
- [.claude/commands/n8n-workflow-sync.md](./.claude/commands/n8n-workflow-sync.md)

**Workflow Development:**

- [docs/concepts/workflow/current/DEVELOPMENT.md](./docs/concepts/workflow/current/DEVELOPMENT.md)
- [docs/concepts/workflow/current/ADVANCED_FEATURES.md](./docs/concepts/workflow/current/ADVANCED_FEATURES.md)
- [docs/concepts/workflow/current/COMMUNICATION.md](./docs/concepts/workflow/current/COMMUNICATION.md)

**Workflow Builder:**

- [apps/frontend/src/components/WorkflowEditor/README.md](./apps/frontend/src/components/WorkflowEditor/README.md)
- [docs/development/WORKFLOW_BUILDER_INTEGRATION.md](./docs/development/WORKFLOW_BUILDER_INTEGRATION.md)

**Related:** See also [Agent System](#agent-system),
[Backend & API](#backend--api)

---

## Deployment & Infrastructure

**Main Deployment Guides:**

- [docs/deployment/DEPLOYMENT_GUIDE.md](./docs/deployment/DEPLOYMENT_GUIDE.md) -
  Master deployment guide
- [docs/deployment/DEPLOY_NOW.md](./docs/deployment/DEPLOY_NOW.md) - Quick
  deployment
- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Production status

**Railway Deployment:**

- [docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md](./docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md)
- [docs/RAILWAY-DEPLOYMENT-GUIDE.md](./docs/RAILWAY-DEPLOYMENT-GUIDE.md)
- [docs/deployment/RAILWAY_FAILURE_ANALYSIS.md](./docs/deployment/RAILWAY_FAILURE_ANALYSIS.md)
- [docs/deployment/RAILWAY_BUILD_FIX_SUMMARY.md](./docs/deployment/RAILWAY_BUILD_FIX_SUMMARY.md)

**Docker:**

- [docs/DOCKER.md](./docs/DOCKER.md) - Docker overview
- [docs/DOCKER_BEST_PRACTICES.md](./docs/DOCKER_BEST_PRACTICES.md)
- [docs/DOCKER_OPTIMIZATION.md](./docs/DOCKER_OPTIMIZATION.md)
- [docs/guides/docker-setup.md](./docs/guides/docker-setup.md)
- [docs/deployment/DOCKER_OPTIMIZATION_SUMMARY.md](./docs/deployment/DOCKER_OPTIMIZATION_SUMMARY.md)

**CI/CD:**

- [docs/CICD_STRATEGY.md](./docs/CICD_STRATEGY.md)
- [docs/ci-cd/CI_CD_SETUP_COMPLETE.md](./docs/ci-cd/CI_CD_SETUP_COMPLETE.md)
- [docs/ci-cd/deployment.md](./docs/ci-cd/deployment.md)

**Monitoring & Operations:**

- [docs/deployment/MONITORING.md](./docs/deployment/MONITORING.md)
- [docs/deployment/SCALING.md](./docs/deployment/SCALING.md)
- [docs/deployment/TROUBLESHOOTING.md](./docs/deployment/TROUBLESHOOTING.md)

**Emergency Procedures:**

- [docs/deployment/EMERGENCY_PROCEDURES.md](./docs/deployment/EMERGENCY_PROCEDURES.md)
- [docs/deployment/ROLLBACK_PROCEDURES.md](./docs/deployment/ROLLBACK_PROCEDURES.md)

**Related:** See also [Build System](#build-system), [Docker](#docker),
[Security](#security)

---

## Build System

**Main Build Documentation:**

- [docs/development/BUILD_GUIDE.md](./docs/development/BUILD_GUIDE.md) -
  Comprehensive guide
- [docs/development/BUILD_SYSTEM.md](./docs/development/BUILD_SYSTEM.md) - Build
  system overview
- [docs/development/BUILD_STATUS.md](./docs/development/BUILD_STATUS.md) -
  Current status

**Build Hardening:**

- [.gemini/BUILD_PROCESS_HARDENING.md](./.gemini/BUILD_PROCESS_HARDENING.md)
- [.gemini/BUILD_PROCESS_HARDENING_SUMMARY.md](./.gemini/BUILD_PROCESS_HARDENING_SUMMARY.md)
- [docs/BUILD_OPTIMIZATION.md](./docs/BUILD_OPTIMIZATION.md)

**Dependencies:**

- [docs/development/DEPENDENCY-MAP.md](./docs/development/DEPENDENCY-MAP.md)
- [docs/development/DEPENDENCY_SECURITY_REPORT.md](./docs/development/DEPENDENCY_SECURITY_REPORT.md)

**Analysis:**

- [analysis/typescript_build_analysis.md](./analysis/typescript_build_analysis.md)

**Related:** See also [Deployment](#deployment--infrastructure),
[Development](#getting-started)

---

## Testing & Quality

**Main Testing Documentation:**

- [docs/testing/TESTING_SETUP_COMPLETE.md](./docs/testing/TESTING_SETUP_COMPLETE.md)
- [docs/testing/BEST_PRACTICES.md](./docs/testing/BEST_PRACTICES.md)
- [docs/TESTING_GUIDE.md](./docs/TESTING_GUIDE.md)

**E2E Testing:**

- [docs/testing/E2E_TEST_SUMMARY.md](./docs/testing/E2E_TEST_SUMMARY.md)
- [contracts/E2E_TESTING_GUIDE.md](./contracts/E2E_TESTING_GUIDE.md)
- [packages/testing/docs/E2E_TESTING.md](./packages/testing/docs/E2E_TESTING.md)

**Performance Testing:**

- [packages/testing/docs/PERFORMANCE_TESTING.md](./packages/testing/docs/PERFORMANCE_TESTING.md)

**Code Quality:**

- [docs/CODE_QUALITY.md](./docs/CODE_QUALITY.md)
- [docs/development/CODE_QUALITY_SETUP_COMPLETE.md](./docs/development/CODE_QUALITY_SETUP_COMPLETE.md)

**Chrome Extension Testing:**

- [apps/chrome-extension/TESTING_GUIDE.md](./apps/chrome-extension/TESTING_GUIDE.md)
- [apps/chrome-extension/EXTENSION_TEST_PLAN.md](./apps/chrome-extension/EXTENSION_TEST_PLAN.md)

**Related:** See also [Performance](#performance),
[Development](#getting-started)

---

## Performance

**Main Performance Documentation:**

- [docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md](./docs/performance/PERFORMANCE_OPTIMIZATION_REPORT.md)
- [docs/performance/PERFORMANCE_IMPLEMENTATION_GUIDE.md](./docs/performance/PERFORMANCE_IMPLEMENTATION_GUIDE.md)
- [docs/performance/PERFORMANCE_QUICK_START.md](./docs/performance/PERFORMANCE_QUICK_START.md)

**Backend Performance:**

- [docs/performance/BACKEND_PERFORMANCE_OPTIMIZATION_SUMMARY.md](./docs/performance/BACKEND_PERFORMANCE_OPTIMIZATION_SUMMARY.md)
- [apps/backend/PERFORMANCE_OPTIMIZATION.md](./apps/backend/PERFORMANCE_OPTIMIZATION.md)
- [apps/backend/PERFORMANCE_SETUP.md](./apps/backend/PERFORMANCE_SETUP.md)

**Frontend Performance:**

- [apps/frontend/PERFORMANCE_OPTIMIZATION.md](./apps/frontend/PERFORMANCE_OPTIMIZATION.md)
- [apps/frontend/PRODUCTION_OPTIMIZATIONS.md](./apps/frontend/PRODUCTION_OPTIMIZATIONS.md)

**Monitoring:**

- [docs/performance/PERFORMANCE_MONITORING_SUMMARY.md](./docs/performance/PERFORMANCE_MONITORING_SUMMARY.md)
- [docs/performance/PERFORMANCE_MONITORING_SETUP.md](./docs/performance/PERFORMANCE_MONITORING_SETUP.md)

**Caching:**

- [apps/backend/CACHING_IMPLEMENTATION_SUMMARY.md](./apps/backend/CACHING_IMPLEMENTATION_SUMMARY.md)
- [apps/backend/CACHE_QUICK_START.md](./apps/backend/CACHE_QUICK_START.md)
- [packages/api-optimization/docs/CACHING_POLICY.md](./packages/api-optimization/docs/CACHING_POLICY.md)

**Related:** See also [Backend & API](#backend--api),
[Frontend & UI](#frontend--ui)

---

## Security

**Main Security Documentation:**

- [docs/security/SECURITY_AUDIT_REPORT.md](./docs/security/SECURITY_AUDIT_REPORT.md)
- [docs/security/SECURITY_BEST_PRACTICES.md](./docs/security/SECURITY_BEST_PRACTICES.md)
- [docs/security/DEVELOPER_SECURITY_CHECKLIST.md](./docs/security/DEVELOPER_SECURITY_CHECKLIST.md)

**Security Fixes:**

- [docs/security/SECURITY_FIXES.md](./docs/security/SECURITY_FIXES.md)
- [docs/security/SECURITY_VULNERABILITIES_FIXED.md](./docs/security/SECURITY_VULNERABILITIES_FIXED.md)
- [docs/security/SECURITY-FIXES-SUMMARY.md](./docs/security/SECURITY-FIXES-SUMMARY.md)

**Authentication:**

- [docs/security/AUTHENTICATION_SECURITY_FIX.md](./docs/security/AUTHENTICATION_SECURITY_FIX.md)
- [jwt-security-fixes/IMPLEMENTATION_GUIDE.md](./jwt-security-fixes/IMPLEMENTATION_GUIDE.md)

**Incident Response:**

- [docs/security/SECURITY_INCIDENT_RESPONSE.md](./docs/security/SECURITY_INCIDENT_RESPONSE.md)
- [docs/security/INCIDENT_RESPONSE_PLAN.md](./docs/security/INCIDENT_RESPONSE_PLAN.md)
- [docs/security/VULNERABILITY_DISCLOSURE_POLICY.md](./docs/security/VULNERABILITY_DISCLOSURE_POLICY.md)

**Remediation:**

- [docs/security/REMEDIATION_ROADMAP.md](./docs/security/REMEDIATION_ROADMAP.md)
- [docs/security/HARDCODED_SECRETS_REMOVAL_REPORT.md](./docs/security/HARDCODED_SECRETS_REMOVAL_REPORT.md)

**Related:** See also [Deployment](#deployment--infrastructure),
[Build System](#build-system)

---

## Chrome Extension

**Main Documentation:**

- [apps/chrome-extension/README.md](./apps/chrome-extension/README.md)
- [apps/chrome-extension/docs/user-guide.md](./apps/chrome-extension/docs/user-guide.md)
- [apps/chrome-extension/docs/developer-guide.md](./apps/chrome-extension/docs/developer-guide.md)

**Integration:**

- [apps/chrome-extension/WORKSPACE_INTEGRATION.md](./apps/chrome-extension/WORKSPACE_INTEGRATION.md)
- [apps/chrome-extension/docs/BROWSER_CONTROL_INTEGRATION.md](./apps/chrome-extension/docs/BROWSER_CONTROL_INTEGRATION.md)
- [docs/chrome-extension/RELAY_INTEGRATION_GUIDE.md](./docs/chrome-extension/RELAY_INTEGRATION_GUIDE.md)

**Testing & Troubleshooting:**

- [apps/chrome-extension/TESTING_GUIDE.md](./apps/chrome-extension/TESTING_GUIDE.md)
- [apps/chrome-extension/TROUBLESHOOTING.md](./apps/chrome-extension/TROUBLESHOOTING.md)
- [apps/chrome-extension/POPUP-TROUBLESHOOTING.md](./apps/chrome-extension/POPUP-TROUBLESHOOTING.md)

**Related:** See also [Browser Automation](#browser-automation),
[Testing](#testing--quality)

---

## MCP Integration

**Main MCP Documentation:**

- [apps/backend/src/modules/mcp/README.md](./apps/backend/src/modules/mcp/README.md)
- [apps/backend/src/modules/mcp/QUICKSTART.md](./apps/backend/src/modules/mcp/QUICKSTART.md)
- [docs/guides/mcp_config.README.md](./docs/guides/mcp_config.README.md)

**VS Code MCP:**

- [apps/vscode-extension/docs/MCP_GUIDE.md](./apps/vscode-extension/docs/MCP_GUIDE.md)

**MCP Testing:**

- [apps/backend/src/modules/mcp/MCP-TESTING-SUMMARY.md](./apps/backend/src/modules/mcp/MCP-TESTING-SUMMARY.md)
- [apps/backend/src/modules/mcp/tests/README.md](./apps/backend/src/modules/mcp/tests/README.md)

**MCP Servers:**

- [apps/mcp-servers/devops-bridge/README.md](./apps/mcp-servers/devops-bridge/README.md)
- [.claude/commands/skill-mcp-builder.md](./.claude/commands/skill-mcp-builder.md)

**Related:** See also [Backend & API](#backend--api),
[Agent System](#agent-system)

---

## Database & Drizzle ORM

**Main Documentation:**

- [packages/database/README.md](./packages/database/README.md)
- [docs/database/README.md](./docs/database/README.md)

**Sync Core:**

- [packages/sync-core/README.md](./packages/sync-core/README.md)
- [packages/sync-core/ARCHITECTURE.md](./packages/sync-core/ARCHITECTURE.md)
- [packages/sync-core/docs/PERFORMANCE_OPTIMIZATION.md](./packages/sync-core/docs/PERFORMANCE_OPTIMIZATION.md)

**Deployment:**

- [packages/sync-core/deployment/DEPLOYMENT.md](./packages/sync-core/deployment/DEPLOYMENT.md)

**Related:** See also [Backend & API](#backend--api),
[Performance](#performance)

---

## Project Management

**Roadmaps & Planning:**

- [PRODUCTION_READINESS.md](./PRODUCTION_READINESS.md) - Current status
- [QUICK_START_GUIDE.md](./QUICK_START_GUIDE.md) - 7-day launch path
- [docs/project-management/PUBLIC_LAUNCH_ROADMAP.md](./docs/project-management/PUBLIC_LAUNCH_ROADMAP.md)

**Session Handoffs:**

- [.agent/SESSION_SUMMARY_2025-12-20.md](./.agent/SESSION_SUMMARY_2025-12-20.md)
- [.agent/HANDOFF_PROMPT.md](./.agent/HANDOFF_PROMPT.md)
- [docs/project-management/HANDOFF_NEXT_SESSION.md](./docs/project-management/HANDOFF_NEXT_SESSION.md)

**Audits & Reports:**

- [docs/audits/CODEBASE_AUDIT_RESULTS.md](./docs/audits/CODEBASE_AUDIT_RESULTS.md)
- [docs/audits/SELF_IMPROVEMENT_REPORT.md](./docs/audits/SELF_IMPROVEMENT_REPORT.md)
- [analysis/repository_architecture_analysis.md](./analysis/repository_architecture_analysis.md)

**Related:** See all categories for specific implementation documentation

---

## Key Document Relationships

### Documentation Hierarchy

```
README.md (Root Entry Point — full codebase architecture overview)
├── QUICK_START_GUIDE.md (Fast Setup)
├── PRODUCTION_READINESS.md (Current Status)
├── DOCUMENTATION_MAP.md (This file — navigation guide)
│
├── Architecture & Design
│   ├── docs/architecture/ARCHITECTURE_STANDARDS.md
│   ├── docs/PREMIUM_THEME_MANIFEST.md (Design System)
│   └── docs/architecture/MONOREPO_ARCHITECTURE.md
│
├── Core Services
│   ├── apps/api/ (NestJS API — port 3001)
│   ├── apps/api-gateway/ (NestJS Gateway — port 3005)
│   ├── apps/frontend/ (React + Vite — port 3000)
│   ├── apps/backend/ (Secondary NestJS — port 3004)
│   └── apps/relay-server/ (WebSocket relay hub)
│
├── Agent System & Protocols
│   ├── docs/agents/COMPLETE-AGENT-GUIDE.md
│   ├── docs/AGENT_COMMUNICATION_PROTOCOL.md
│   ├── packages/relay-core/ (TNF Envelope, protocol translators)
│   ├── packages/a2a-core/ (A2A v0.3.0)
│   ├── packages/mcp-core/ (MCP client/server/broker)
│   └── .agent/ (16 agent personas, 15+ skills)
│
├── Client Extensions
│   ├── apps/chrome-extension/ (V7 — Claude/Gemini/ChatGPT/Perplexity)
│   ├── apps/vscode-extension/ (v9.1.0 — multi-LLM, A2A, MCP)
│   └── apps/electron-desktop/ (Electron desktop app)
│
├── AI Infrastructure
│   ├── apps/picoclaw-overseer/ (Go — edge AI agents)
│   ├── OpenClaw Mesh (3 Railway cloud instances — Claude Pro OAuth)
│   └── apps/mcp-servers/ (MCP tool servers)
│
├── Database (Drizzle ORM + PostgreSQL)
│   └── packages/database/ (~15 schema tables)
│
├── Deployment
│   ├── docs/deployment/DEPLOYMENT_GUIDE.md
│   ├── docs/deployment/RAILWAY_DEPLOYMENT_GUIDE.md
│   └── railway.toml (15+ Railway services)
│
└── Testing & Quality
    ├── docs/testing/TESTING_SETUP_COMPLETE.md
    ├── docs/testing/E2E_TEST_SUMMARY.md
    └── docs/CODE_QUALITY.md
```

---

## Cross-References by Topic

### Multi-Agent Systems

- Agent System Documentation
- packages/relay-core (TNF Envelope, Master Agent Registry)
- packages/a2a-core (A2A v0.3.0)
- packages/workflow-engine (distributed execution)
- MCP Integration

### Real-time Communication

- packages/relay-core (WebSocket relay, Redis pub/sub)
- Agent Communication Protocol (TNF Envelope)
- Chat Rooms Module
- Relay Server (apps/relay-server)
- Chrome Extension (WebSocket to relay)

### Protocol Translation

- packages/relay-core/src/protocol/ (ProtocolTranslator)
- A2A, AG-UI, OpenAI, Anthropic XML, LangChain, CrewAI adapters
- packages/mcp-core (MCP client/server)

### Browser Automation

- Chrome Extension (V7 — Claude/Gemini/ChatGPT/Perplexity injection)
- Cloud Sandbox (Playwright)
- OpenClaw Mesh (cloud AI endpoints)

### Data Management

- packages/database (Drizzle ORM + PostgreSQL)
- packages/core-vector-db (Qdrant + ChromaDB)
- Redis (caching, pub/sub, job queues)

### User Interface

- apps/frontend (React + Vite + Premium UI)
- apps/visualization-hub (D3.js agent network)
- apps/vscode-extension (VS Code panels)
- apps/electron-desktop (Electron + Chakra UI)

---

## Recommended Documentation Cleanup

Many documentation files are outdated summaries or completion reports from
specific implementation sessions. Consider:

1. **Archive** - Move to `docs/archive/` or `docs/_archives/`:
   - Session summaries older than 3 months
   - Completion reports for finished features
   - Migration documentation for completed migrations
   - Duplicate or superseded guides

2. **Consolidate** - Merge related documents:
   - Multiple deployment guides → Single comprehensive guide
   - Various security summaries → Updated security documentation
   - Testing summaries → Master testing guide

3. **Update** - Refresh core documents:
   - README.md (keep current)
   - QUICK_START_GUIDE.md (reflect actual quick start)
   - PRODUCTION_READINESS.md (continuous updates)
   - Architecture standards (as system evolves)

---

## Navigation Tips

1. **For New Developers**: Start with
   [Getting Started Path](#path-1-new-developer-onboarding)
2. **For Deployment**: Follow
   [Production Deployment Path](#path-2-production-deployment)
3. **For Agent Work**: Use [Agent Development Path](#path-3-agent-development)
4. **For UI Work**: Follow
   [Frontend Development Path](#path-4-frontend-development)
5. **For API Work**: Use
   [Backend/API Development Path](#path-5-backendapi-development)
6. **For Testing**: Follow [Testing & Quality Path](#path-6-testing--quality)

---

## Document Maintenance

**Primary Documents** (keep always updated):

- README.md
- QUICK_START_GUIDE.md
- PRODUCTION_READINESS.md
- DOCUMENTATION_INDEX.md
- This file (DOCUMENTATION_MAP.md)

**Secondary Documents** (update quarterly):

- Architecture standards
- API documentation
- Deployment guides
- Testing guides

**Tertiary Documents** (archive after completion):

- Implementation summaries
- Session handoffs
- Migration reports
- Audit reports

---

**Last Updated:** 2026-02-18 **Maintained By:** Development Team **Next
Review:** 2026-03-18
