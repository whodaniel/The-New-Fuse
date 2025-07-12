// Core exports for The New Fuse framework

// Core modules
export * from './app.module';
export * from './app.service';

// Modules
export * from './modules/agency-hub.module';
export * from './modules/A2AModule';
export * from './modules/ProtocolModule';

// Agent system
export * from './agents/types';
export * from './agents/AgentSystem';
export * from './agents/AgentManager';
export * from './agents/AgentCommunicationManager';
export * from './agents/AgentCommunicationBridge';
export * from './agents/agent-orchestrator';
export * from './agents/shared-memory';

// Configuration
export * from './config/ConfigService';
export * from './config/ConfigModule';
export * from './config/database.config';
export * from './config/redis.config';
export * from './config/security.config';

// Database
export * from './database/database_service';

// WebSocket
export * from './websocket/WebSocketService';
export * from './websocket/WebSocketManager';
export * from './websocket/WebSocketModule';

// Services
export * from './services/AgentLLMService';
export * from './services/PromptService';
export * from './services/LoggingService';
export * from './services/LocalAIDetectionService';
export * from './services/enhanced-agency.service';
export * from './services/agent-swarm-orchestration.service';
export * from './services/service-category-router.service';
export * from './services/agency.service';
export * from './services/MonitoringService';
export * from './services/TaskService';
export * from './services/UserService';
export * from './services/MetricsService';
export * from './services/youtube.service';

// Monitoring
export * from './monitoring/unified-monitor.service';
export * from './services/monitoring/SystemMonitor';
export * from './services/monitoring/MessageProcessor';
export * from './services/monitoring/MessageQueue';

// Memory
export * from './memory';

// Redis
export * from './redis/redis.service';

// Message Handler
export * from './message_handler';

// Types and interfaces
export * from './types/interfaces';

// Dependency Injection
export * from './di/types';

// YouTube integration
export * from './youtube_integrator';

// Utilities (if they exist)
export * from './utils/logger';