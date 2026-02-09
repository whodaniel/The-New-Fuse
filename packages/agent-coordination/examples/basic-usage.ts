import { RedisCoordinator, SerializationFormat } from '../src';
import { UnifiedRedisService } from '@the-new-fuse/infrastructure';
import { AgentStatus, A2APriority } from '@the-new-fuse/a2a-core';

/**
 * Basic usage example for Agent Coordination System
 */
async function main() {
  // Initialize Redis service (in a real app, this would be injected)
  const redisService = new UnifiedRedisService({} as any);
  
  // Create coordinator instance
  const coordinator = new RedisCoordinator(redisService, {
    keyPrefix: 'example:',
    heartbeatInterval: 30000,
    heartbeatTimeout: 90000,
    serializationFormat: SerializationFormat.JSON,
  });

  // Initialize coordinator
  await coordinator.onModuleInit();

  // Register agents and perform operations
  console.log('Agent Coordination System - Basic Usage Example');
  
  // See README.md for complete examples
}

main().catch(console.error);
