# TypeScript Error Resolution Plan

## Background

This document outlines a step-by-step plan for resolving TypeScript errors in the project, specifically focused on the `@the-new-fuse/api` package. We've encountered a number of TypeScript errors, primarily related to imports, missing types, and incompatible interfaces.

## Current Status

- We've successfully built the package using a custom script that bypasses TypeScript errors
- The experimental decorators issue has been fixed by adding appropriate TypeScript configuration
- The `RegisteredEntity` model has been added to the Drizzle schema
- Some missing modules have been stubbed with declaration files

## Error Categories

1. **Missing Module Imports**:
   - `@the-new-fuse/database` (RedisService)
   - `@the-new-fuse/core` (ConversationExportService)
   - `@nestjs/terminus`
   - Various relative imports

2. **Type Definition Issues**:
   - Missing `Workflow` and `WorkflowExecution` types
   - Incompatible interfaces (Agent, CreateAgentDto)

3. **Drizzle Model Issues**:
   - Missing RegisteredEntity model (now fixed)

## Resolution Plan

### Phase 1: Module Imports (Highest Priority)

1. ✅ Create stub implementations for critical missing modules
2. Implement proper module exports in index.js files
3. Organize proper import paths for NestJS modules

### Phase 2: Type Definitions

1. ✅ Define missing types in typings.d.ts
2. Update interfaces to match expected structures
3. Fix class implementation issues

### Phase 3: Service Implementations

1. Fix entity.service.ts to work with the RegisteredEntity Drizzle model
2. Implement proper error handling with typed errors
3. Fix service method signatures and return types

### Phase 4: Controller Issues

1. Fix controller parameter types
2. Update serialization for Swagger
3. Fix authentication guard issues

### Phase 5: Testing & Validation

1. Create unit tests to validate fixes
2. Set up CI pipeline to catch future type errors
3. Document remaining issues if any

## Next Steps

1. Prioritize fixing the RedisService import issue
2. Fix the RegisteredEntity Drizzle model
3. Address critical controller issues

## Notes

- When developing new features, ensure proper TypeScript types are defined from the start
- Consider adding ESLint rules to catch type issues earlier
- Document any workarounds implemented
