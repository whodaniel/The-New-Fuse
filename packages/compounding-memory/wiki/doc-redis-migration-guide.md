# Verified Doc: Redis Migration Guide

**Category:** verified-documentation **Agent:** AGENT-DOC-ASSIMILATOR
**Timestamp:** 1777319889.87454

## Content

# Redis Migration Guide - Complex Cases

Generated on: 2026-03-27T20:31:52.203Z

## Migration Summary

- **Total files with Redis usage**: 215
- **Simple imports migrated**: 20
- **Complex cases requiring manual migration**: 121
- **Application files**: 74
- **Legacy/backup files**: 0

This guide covers the 121 files that require manual migration.

## Migration Steps

1. **Update Imports**: Replace ioredis imports with UnifiedRedisService
2. **Update Constructor**: Use dependency injection instead of manual
   instantiation
3. **Update Methods**: Map old Redis methods to UnifiedRedisService methods
4. **Update Configuration**: Use UnifiedRedisService configuration pattern
5. **Test Integration**: Verify functionality after migration

## File-by-File Migration Tasks

### 1. `packages/a2a-core/src/a2a.module.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 2. `packages/a2a-core/src/a2a.service.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 3. `packages/a2a-core/src/redis-adapter.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 4. `packages/a2a-core/src/websocket-adapter.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 5. `packages/agent/src/bridges/adapters/RedisTransportAdapter.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Custom Redis service class conflicts with unified service
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 6. `packages/agent/src/bridges/index.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 7. `packages/agent/src/bridges/redis_bridge.ts`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 8. `packages/agent/src/bridges/universal_bridge.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 9. `packages/agent/src/context/manager.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 10. `packages/agent/src/core/BaseAgent.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 11. `packages/agent/src/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 12. `packages/agent/src/monitoring/metrics.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 13. `packages/agent/src/processors/CommandProcessor.tsx`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 14. `packages/agent/src/processors/TaskProcessor.tsx`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 15. `packages/agent/src/registry/redis-agent-registry.ts`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 16. `packages/agent/src/services/RedisService.tsx`

**Type**: service

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 17. `packages/agent-coordination/src/broadcast/broadcast-manager.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 18. `packages/agent-coordination/src/coordination/RecoveryManager.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 19. `packages/agent-coordination/src/coordination/shared-state-manager.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 20. `packages/agent-coordination/src/core/TaskQueue.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 21. `packages/agent-coordination/src/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 22. `packages/agent-coordination/src/monitoring/PersistentMetricsCollector.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 23. `packages/agent-coordination/src/orchestration/Coordinator.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 24. `packages/agent-coordination/src/presence/presence-tracker.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 25. `packages/agent-coordination/src/queues/task-queue-manager.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 26. `packages/agent-coordination/src/redis-coordinator.ts`

**Type**: service

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Custom Redis service class conflicts with unified service
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 27. `packages/agent-coordination/src/state/DistributedLock.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Connection management should be handled by UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 28. `packages/agent-coordination/src/state/SharedCache.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Connection management should be handled by UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 29. `packages/api/src/services/agent-discovery-registry.service.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Connection management should be handled by UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 30. `packages/api/src/services/index.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 31. `packages/api/src/services/redis.service.ts`

**Type**: service

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 32. `packages/api-optimization/src/api-optimization.module.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 33. `packages/api-optimization/src/caching/response-cache.service.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 34. `packages/api-optimization/src/monitoring/optimization-monitoring.service.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 35. `packages/api-optimization/src/quota/quota-management.service.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 36. `packages/api-optimization/src/rate-limiting/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 37. `packages/api-optimization/src/rate-limiting/rate-limit.guard.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 38. `packages/api-optimization/src/rate-limiting/rate-limit.middleware.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 39. `packages/api-optimization/src/rate-limiting/rate-limit.module.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 40. `packages/api-optimization/src/rate-limiting/redis-rate-limiter.service.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Custom Redis service class conflicts with unified service
- Injectable service needs to be refactored to use UnifiedRedisService
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 41. `packages/cache/src/CacheService.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 42. `packages/cache/src/redis-cache.service.ts`

**Type**: service

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 43. `packages/core/src/communication/MessagingService.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 44. `packages/core/src/communication/NotificationService.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 45. `packages/core/src/config/ConfigService.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 46. `packages/core/src/security/metricsCollector.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 47. `packages/core/src/security/monitoring.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 48. `packages/core/src/services/CommunicationTracker.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 49. `packages/core/src/services/bridge.ts`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 50. `packages/core/src/services/cascade_bridge.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 51. `packages/core/src/services/websocket/simple_client.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 52. `packages/core/src/task/AgentInbox.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 53. `packages/core/src/task/TaskExecutor.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 54. `packages/core/src/task/TaskQueue.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 55. `packages/core/src/utils/database.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 56. `packages/core/src/vectordb/provider-registry.ts`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 57. `packages/debugging/src/a2a-debugger.service.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 58. `packages/docs/src/api-doc-generator.service.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 59. `packages/infrastructure/src/index.ts`

**Type**: unified

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 60. `packages/job-queue/src/optimized-queue.service.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 61. `packages/jules-integration/__tests__/JulesWebhookHandler.test.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 62. `packages/jules-integration/src/JulesAgentAdapter.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 63. `packages/jules-integration/src/JulesWebhookHandler.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 64. `packages/mcp-cloud-redis-bridge/src/RedisClient.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 65. `packages/relay-core/src/broker-agent.ts`

**Type**: import

**Current Issues**:

- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 66. `packages/relay-core/src/director-agent.ts`

**Type**: import

**Current Issues**:

- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 67. `packages/relay-core/src/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 68. `packages/relay-core/src/master-clock.ts`

**Type**: import

**Current Issues**:

- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 69. `packages/relay-core/src/redis-relay-bridge.ts`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 70. `packages/relay-core/src/server/RelayServer.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 71. `packages/relay-core/src/services/HandoffStoreService.ts`

**Type**: import

**Current Issues**:

- Connection management should be handled by UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 72. `packages/relay-core/src/standalone-relay.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 73. `packages/relay-core/src/super-cycle-client.ts`

**Type**: import

**Current Issues**:

- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 74. `packages/relay-core/src/transports/RedisTransport.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 75. `packages/shared/src/utils/redis.ts`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 76. `packages/sync-core/src/cms/CMSIntegrationService.test.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 77. `packages/sync-core/src/cms/CMSIntegrationService.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 78. `packages/sync-core/src/cms/CollaborativeContentService.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 79. `packages/sync-core/src/cms/PrivateDataIsolationService.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 80. `packages/sync-core/src/cms/ProjectConfigurationSync.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 81. `packages/sync-core/src/config/SyncRedisConfig.test.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 82. `packages/sync-core/src/dashboard/SyncDashboard.example.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 83. `packages/sync-core/src/dashboard/SyncDashboardService.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 84. `packages/sync-core/src/error/SyncErrorHandler.example.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 85. `packages/sync-core/src/error/SyncErrorHandler.test.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 86. `packages/sync-core/src/error/SyncErrorHandler.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 87. `packages/sync-core/src/error/SyncFallbackProcessor.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 88. `packages/sync-core/src/error/SyncRetryManager.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 89. `packages/sync-core/src/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 90. `packages/sync-core/src/messaging/CommunicationHubFailover.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 91. `packages/sync-core/src/messaging/MessageQueueSynchronizer.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 92. `packages/sync-core/src/messaging/SyncAwareAgentWebSocketService.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 93. `packages/sync-core/src/messaging/SyncAwareMessaging.integration.test.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 94. `packages/sync-core/src/messaging/SyncAwareMessagingService.test.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 95. `packages/sync-core/src/messaging/SyncAwareMessagingService.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 96. `packages/sync-core/src/monitoring/SyncAwareMonitoring.integration.test.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 97. `packages/sync-core/src/monitoring/UnifiedSyncHealthReporting.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 98. `packages/sync-core/src/performance/PerformanceOptimization.example.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 99. `packages/sync-core/src/services/MasterClockService.example.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 100. `packages/sync-core/src/services/MasterClockService.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 101. `packages/sync-core/src/services/SyncOrchestrator.example.ts`

**Type**: service

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 102. `packages/sync-core/src/services/SyncOrchestrator.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 103. `packages/sync-core/src/tasks/TaskNotificationService.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 104. `packages/sync-core/src/tasks/TaskSynchronizationService.test.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 105. `packages/sync-core/src/tasks/TaskSynchronizationService.ts`

**Type**: service

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 106. `packages/sync-core/src/watchers/EnhancedFileSystemWatcher.example.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 107. `packages/sync-core/src/watchers/EnhancedFileSystemWatcher.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 108. `packages/testing/src/agent-workflow.test-suite.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Connection management should be handled by UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 109. `packages/tnf-cli/src/RedisAgentClient.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 110. `packages/tnf-cli/src/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 111. `packages/tnf-cli/src/orchestration.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 112. `packages/types/src/ioredis.ts`

**Type**: service

**Current Issues**:

- Custom Redis service class conflicts with unified service

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 113. `packages/utils/disabled_modules/redis/RedisClient.tsx`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 114. `packages/utils/disabled_modules/redis/index.tsx`

**Type**: import

**Current Issues**:

- Custom Redis service class conflicts with unified service
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 115. `packages/websocket/src/optimized-websocket.service.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 116. `packages/websocket-infrastructure/src/adapters/index.ts`

**Type**: unknown

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 117. `packages/websocket-infrastructure/src/adapters/redis-adapter.ts`

**Type**: injectable

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Custom Redis service class conflicts with unified service
- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 118. `packages/websocket-infrastructure/src/websocket.gateway.ts`

**Type**: injectable

**Current Issues**:

- Injectable service needs to be refactored to use UnifiedRedisService

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 119. `packages/websocket-infrastructure/src/websocket.module.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 120. `packages/workflow-engine/src/index.ts`

**Type**: import

**Current Issues**:

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

### 121. `packages/workflow-engine/src/orchestrator/tnf-router.ts`

**Type**: instantiation

**Current Issues**:

- Manual Redis instantiation needs to be replaced with dependency injection
- Connection management should be handled by UnifiedRedisService
- Event handling needs to be updated for unified service patterns

**Migration Steps**:

1. Replace imports: Change ioredis imports to UnifiedRedisService
2. Update constructor: Use @Inject(UnifiedRedisService)
3. Update method calls: Map to UnifiedRedisService API
4. Remove manual Redis instantiation
5. Test functionality

---

## Backlinks

- [[documentation-index]]
- [[sovereign-state]]
