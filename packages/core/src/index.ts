// Core exports for The New Fuse framework

// Core modules
export * from './app.module';
export * from './app.service';

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

// WebSocket
export * from './websocket/WebSocketService';
export * from './websocket/WebSocketManager';
export * from './websocket/WebSocketModule';

// Services
export * from './services/AgentLLMService';
export * from './services/PromptService';
export * from './services/LoggingService';
export * from './services/youtube.service';

// Monitoring
export * from './monitoring/unified-monitor.service';

// Memory
export * from './memory';

// Redis
export * from './redis/redis.service';

// Message Handler
export * from './message_handler';

// Types and interfaces
export * from './types/interfaces';

// YouTube integration
export * from './youtube_integrator';

// Utilities (if they exist)
export * from './utils/logger';