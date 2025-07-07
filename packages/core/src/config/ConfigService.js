var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';
let ConfigService = class ConfigService extends NestConfigService {
    getPort() {
        return this.getOrThrow('PORT', 3000);
    }
    getDatabaseUrl() {
        return this.getOrThrow('DATABASE_URL');
    }
    getRedisUrl() {
        return this.getOrThrow('REDIS_URL');
    }
    getJwtSecret() {
        return this.getOrThrow('JWT_SECRET');
    }
    getEnvironment() {
        return this.get('NODE_ENV') || 'development';
    }
    isDevelopment() {
        return this.getEnvironment() === 'development';
    }
    isProduction() {
        return this.getEnvironment() === 'production';
    }
    isTest() {
        return this.getEnvironment() === 'test';
    }
    // WebSocket Configuration
    getWebSocketPort() {
        return this.get('WS_PORT', 8080);
    }
    // Redis Configuration
    getRedisHost() {
        return this.get('REDIS_HOST', 'localhost');
    }
    getRedisPort() {
        return this.get('REDIS_PORT', 6379);
    }
    getRedisPassword() {
        return this.get('REDIS_PASSWORD');
    }
    getRedisDb() {
        return this.get('REDIS_DB', 0);
    }
    // Database Configuration
    getDatabaseHost() {
        return this.get('DB_HOST', 'localhost');
    }
    getDatabasePort() {
        return this.get('DB_PORT', 5432);
    }
    getDatabaseName() {
        return this.getOrThrow('DB_NAME');
    }
    getDatabaseUsername() {
        return this.getOrThrow('DB_USERNAME');
    }
    getDatabasePassword() {
        return this.getOrThrow('DB_PASSWORD');
    }
    // Security Configuration
    getCorsOrigins() {
        const origins = this.get('CORS_ORIGINS', '*');
        return origins === '*' ? ['*'] : origins.split(',');
    }
    getJwtExpiresIn() {
        return this.get('JWT_EXPIRES_IN', '1h');
    }
    // API Configuration
    getApiPrefix() {
        return this.get('API_PREFIX', 'api');
    }
    getApiVersion() {
        return this.get('API_VERSION', 'v1');
    }
    // Logging Configuration
    getLogLevel() {
        return this.get('LOG_LEVEL', 'info');
    }
    // Feature Flags
    isSwaggerEnabled() {
        return this.get('SWAGGER_ENABLED', !this.isProduction());
    }
    isMetricsEnabled() {
        return this.get('METRICS_ENABLED', true);
    }
    // External Services
    getOpenAIApiKey() {
        return this.get('OPENAI_API_KEY');
    }
    getCloudflareApiKey() {
        return this.get('CLOUDFLARE_API_KEY');
    }
    getFirebaseConfigPath() {
        return this.get('FIREBASE_CONFIG_PATH');
    }
    // Agent Configuration
    getMaxAgentConcurrency() {
        return this.get('MAX_AGENT_CONCURRENCY', 10);
    }
    getAgentTimeout() {
        return this.get('AGENT_TIMEOUT', 30000);
    }
    // Qdrant Configuration
    getQdrantUrl() {
        return this.get('QDRANT_URL', 'http://localhost:6333');
    }
    getQdrantApiKey() {
        return this.get('QDRANT_API_KEY');
    }
    // Memory Configuration
    getMemoryRetentionDays() {
        return this.get('MEMORY_RETENTION_DAYS', 30);
    }
    getMemoryCapacity() {
        return this.get('MEMORY_CAPACITY', 10000);
    }
    // Enhanced Memory Configuration
    getMemoryShortTermCapacity() {
        return this.get('memory.shortTermCapacity', 1000);
    }
    getMemoryWorkingCapacity() {
        return this.get('memory.workingMemoryCapacity', 100);
    }
    getMemoryLongTermRetentionDays() {
        return this.get('memory.longTermRetentionDays', 30);
    }
    getMemoryCompressionThreshold() {
        return this.get('memory.compressionThreshold', 0.8);
    }
    getMemoryEmbeddingDimension() {
        return this.get('memory.embeddingDimension', 1536);
    }
    isMemoryClusteringEnabled() {
        return this.get('memory.clusteringEnabled', true);
    }
    isMemoryAutoOptimizeEnabled() {
        return this.get('memory.autoOptimize', true);
    }
    // Document Chunking Configuration
    getChunkingMaxChunkSize() {
        return this.get('chunking.maxChunkSize', 1000);
    }
    getChunkingOverlap() {
        return this.get('chunking.overlap', 100);
    }
    getChunkingProvider() {
        return this.get('chunking.provider', 'local');
    }
    getChunkingSimilarityThreshold() {
        return this.get('chunking.similarityThreshold', 0.7);
    }
    getChunkingMinChunkSize() {
        return this.get('chunking.minChunkSize', 100);
    }
    // Agent and LLM Configuration
    getCascadeApiKey() {
        return this.get('CASCADE_API_KEY');
    }
    getClineApiKey() {
        return this.get('CLINE_API_KEY');
    }
    getCascadeModel() {
        return this.get('CASCADE_MODEL', 'anthropic/claude-2');
    }
    getClineModel() {
        return this.get('CLINE_MODEL', 'anthropic/claude-2');
    }
    getMaxMemoryMessages() {
        return this.get('MAX_MEMORY_MESSAGES', 20);
    }
    // Service Integration Configuration
    getServiceDiscoveryEnabled() {
        return this.get('SERVICE_DISCOVERY_ENABLED', true);
    }
    getMessageQueueEnabled() {
        return this.get('MESSAGE_QUEUE_ENABLED', true);
    }
    getHealthCheckInterval() {
        return this.get('HEALTH_CHECK_INTERVAL', 30000);
    }
};
ConfigService = __decorate([
    Injectable()
], ConfigService);
export { ConfigService };
