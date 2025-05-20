# Project Document Inventory

## Core Architecture Documents
- **COMPONENT-FEATURE-TRACKING.md**: Tracks component-feature relationships and standardization status
- **FILESYSTEM-INVENTORY.md**: Documents project directory structure and key file categories
- **FEATURES-CONSOLIDATION-PLAN.md**: Outlines component standardization roadmap
- **docs/architecture/components.md**: Component standardization implementation details

## Improvement Proposals
- **improvements/ux.md**: User experience enhancement plans
- **improvements/integrations.md**: API/webhook integration strategies
- **improvements/security.md**: Security hardening requirements
- **docs/sections/advanced-features.md**: Performance optimization strategies

## Technical Specifications
- **FeatureControls.tsx**: Feature toggle implementation details
- **features.ts**: Live sync architecture and experimental features
- **feature-tracking.prisma**: Database schema definitions for feature tracking
- **docs/reference/database.md**: Database schema enhancements and relationships

## Process Documentation
- **CLEANUP-*.md**: Component modernization trackers (6 files)
- **MCP-*.md**: Command processor specifications (3 files)
- **project-restructure.md**: Filesystem reorganization plan
- **docs/workflow/current/ARCHITECTURE.md**: System architecture with security and performance enhancements

## Compliance & Standards
- **TYPESCRIPT-FIX.md**: TypeScript migration guidelines
- **advanced-features.md**: Security implementation requirements
- **docs/architecture/protocol-integration-proposal.md**: Integration capabilities framework

_Last updated: 2025-03-21_

## Document Relationships
| Planning Document | Technical Implementation | Related Specs |
|--------------------|--------------------------|----------------|
| FEATURES-CONSOLIDATION-PLAN | FeatureControls.tsx | feature-tracking.prisma |
| improvements/security.md | advanced-features.md | Security components |
| docs/sections/advanced-features.md | docs/workflow/current/ARCHITECTURE.md | Performance optimization components |
| improvements/integrations.md | docs/architecture/protocol-integration-proposal.md | Integration components |
| improvements/ux.md | docs/architecture/components.md | User experience components |