# Comprehensive Document Inventory

> **IMPORTANT**: The information architecture and data exchange patterns from this document have been consolidated into the [Master Information Architecture](docs/MASTER_INFORMATION_ARCHITECTURE.md) document, which now serves as the single source of truth.

This document now serves as a historical comprehensive inventory only. For current:
- Information Architecture
- Data Exchange Patterns
- Integration Standards
- Cross-Environment Communication

Please refer to the [Master Information Architecture](docs/MASTER_INFORMATION_ARCHITECTURE.md).

The inventory below is maintained for historical reference:

## Overview

This document provides a detailed inventory of key documentation files in the project, organized by category. Each document is summarized with its purpose, content, and relationships to other documents to facilitate the consolidation process.

## Core Architecture Documents

### System Architecture
- **DOCUMENTATION.md**: Main documentation file providing a comprehensive overview of the system architecture, including the core engine, nodes, database layer, API usage tracking, frontend interface, and integration points. Contains detailed information about configuration, core components, UI components, workflow execution, and error handling.
- **docs/workflow/current/ARCHITECTURE.md**: Describes the workflow system architecture with security and performance enhancements. Includes detailed information about the tech stack, core components (agent system, communication system, AI integration), system features (message handling, task management, advanced features), development guidelines, and security implementation.
- **docs/architecture/components.md**: Documents the component architecture, including core components (agent system, communication bridge, state management), integration patterns, and component guidelines.
- **docs/architecture/security.md**: Details the security architecture, including authentication system, authorization, data protection, API security, WebSocket security, audit logging, security headers, and secure development practices.

### Component Standardization
- **COMPONENT-FEATURE-TRACKING.md**: Tracks component-feature relationships and standardization status.
- **FILESYSTEM-INVENTORY.md**: Documents project directory structure and key file categories.
- **FEATURES-CONSOLIDATION-PLAN.md**: Outlines component standardization roadmap.
- **docs/component-guidelines.md**: Provides guidelines for component development.
- **docs/component-standards.md**: Defines standards for component implementation.

### Project Structure
- **project-restructure.md**: Filesystem reorganization plan that outlines the proposed structure for apps, packages, scripts, docker, and configuration files.
- **PROJECT_STRUCTURE.md**: Project structure and organization documentation.
- **PROJECT_FILE_STRUCTURE.md**: Detailed inventory of project files with categorization.

## Improvement Proposals

### User Experience
- **improvements/ux.md**: User experience enhancement plans, including feature discovery tours, progressive feature rollout, user feedback collection, enhanced error handling, and improved loading states.

### Integrations
- **improvements/integrations.md**: API/webhook integration strategies.
- **docs/architecture/protocol-integration-proposal.md**: Protocol-based integration proposal that outlines the integration capabilities framework.
- **docs/INTEGRATION_GUIDE.md**: External system integration guide.
- **docs/MCP-INTEGRATION-GUIDE.md**: MCP integration guide.
- **docs/inter-extension-communication.md**: Extension communication documentation.

### Security
- **improvements/security.md**: Security hardening requirements.
- **docs/sections/advanced-features.md**: Performance optimization strategies and security implementation requirements.
- **docs/security/SECURITY_OVERVIEW.md**: Comprehensive security architecture overview.

## Technical Specifications

### Feature Management
- **FeatureControls.tsx**: Feature toggle implementation details.
- **features.ts**: Live sync architecture and experimental features.

### Database
- **feature-tracking.prisma**: Database schema definitions for feature tracking.
- **docs/reference/database.md**: Database schema enhancements and relationships.

## Process Documentation

### Cleanup and Modernization
- **CLEANUP-DASHBOARD.md**: Dashboard component cleanup tracking with overall progress, current sprint focus, recent activity, blocked items, next up tasks, issues found, wins, and final checklist status.
- **CLEANUP-EXECUTION.md**: Codebase cleanup execution plan.
- **CLEANUP-NEXT-STEPS.md**: Next steps after current cleanup tasks.
- **CLEANUP-PRIORITIZED.md**: Prioritized cleanup tasks.
- **FINAL-CLEANUP-PLAN.md**: Final plan for cleanup activities.

### Command Processor
- **MCP-COMMANDS-GUIDE.md**: Command processor specifications that explain how to properly use the Model Context Protocol (MCP) integration, including initialization, viewing available tools, testing specific tools, asking the AI agent, troubleshooting, and example workflows.
- **MCP-NEXT-STEPS.md**: MCP development next steps.
- **MCP-USAGE.md**: MCP usage patterns.

### TypeScript Migration
- **TYPESCRIPT-FIX.md**: TypeScript migration guidelines.
- **docs/TYPESCRIPT_FIX_GUIDE.md**: Detailed TypeScript fix implementation guide.

## User Guides

### Getting Started
- **GET-STARTED.md**: Quick start guide for new users.
- **QUICKSTART.md**: Condensed guide for experienced users.
- **README.md**: Project overview and basic setup.
- **HANDOVER.md**: Project transition documentation.

## Document Relationships

| Planning Document | Technical Implementation | Related Specs |
|--------------------|--------------------------|----------------|
| FEATURES-CONSOLIDATION-PLAN | FeatureControls.tsx | feature-tracking.prisma |
| improvements/security.md | docs/sections/advanced-features.md | docs/security/SECURITY_OVERVIEW.md |
| docs/sections/advanced-features.md | docs/workflow/current/ARCHITECTURE.md | Performance optimization components |
| improvements/integrations.md | docs/architecture/protocol-integration-proposal.md | docs/INTEGRATION_GUIDE.md |
| improvements/ux.md | docs/architecture/components.md | User experience components |
| project-restructure.md | PROJECT_STRUCTURE.md | PROJECT_FILE_STRUCTURE.md |
| CLEANUP-DASHBOARD.md | CLEANUP-EXECUTION.md | CLEANUP-PRIORITIZED.md |
| MCP-COMMANDS-GUIDE.md | MCP-USAGE.md | MCP-NEXT-STEPS.md |

## Redundancies and Consolidation Opportunities

1. **Architecture Documentation**: Multiple files describe the system architecture with overlapping information (DOCUMENTATION.md, docs/workflow/current/ARCHITECTURE.md). These should be consolidated into a single comprehensive architecture document with clear sections.

2. **Component Documentation**: Several files cover component guidelines and standards (docs/component-guidelines.md, docs/component-standards.md, docs/architecture/components.md). These should be merged into a unified component documentation.

3. **Security Documentation**: Security information is spread across multiple files (docs/architecture/security.md, improvements/security.md, docs/security/SECURITY_OVERVIEW.md). These should be consolidated into a comprehensive security documentation.

4. **Project Structure Documentation**: Multiple files describe the project structure (project-restructure.md, PROJECT_STRUCTURE.md, PROJECT_FILE_STRUCTURE.md). These should be merged into a single project structure document.

5. **MCP Documentation**: Three separate files cover MCP functionality (MCP-COMMANDS-GUIDE.md, MCP-NEXT-STEPS.md, MCP-USAGE.md). These should be consolidated into a single MCP documentation.

## Next Steps

1. **Consolidate Redundant Documentation**: Merge documents with significant overlap while preserving all unique information.
2. **Standardize Documentation Format**: Ensure consistent formatting and structure across all documentation.
3. **Update Cross-References**: Ensure all document references point to the correct consolidated documents.
4. **Remove Outdated Information**: Identify and remove outdated or superseded documentation.
5. **Create Documentation Index**: Develop a comprehensive index of all documentation with search capabilities.

_Last updated: 2025-03-23_