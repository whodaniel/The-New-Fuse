# Agent Registry Map

This document tracks the unified registry state for The New Fuse.

## Registry Components

- **Core Repository**:
  `packages/database/src/drizzle/repositories/agent.repository.ts`
- **Sync Service**: `apps/api/src/services/agent/RegistrySyncService.ts`
- **Pydantic Models**:
  `packages/extension-system/src/agents/pydantic/unified_registry.py`
- **Base Definitions**: `.agent/agents/shared/base_definitions.json`

## Consolidated Storage

- Registry Config: `.agent/agents/consolidated/registry.json`
- Skill Links: `.agent/skills/agent-registry-manager/SKILL.md`

## Status

- [x] Database Schema Implementation
- [x] Repository Layer Migration
- [x] Pydantic Model Unification
- [x] Base Definition Standardization
- [ ] Automated Sync Implementation
