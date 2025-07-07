import { Injectable } from '@nestjs/common';
import { ConfigService as NestConfigService } from '@nestjs/config';

@Injectable()
export class ConfigService extends NestConfigService {
  getPort(): number {
    return this.getOrThrow<number>('PORT', 3000);
  }

  getDatabaseUrl(): string {
    return this.getOrThrow<string>('DATABASE_URL');
  }

  getRedisUrl(): string {
    return this.getOrThrow<string>('REDIS_URL');
  }

  getJwtSecret(): string {
    return this.getOrThrow<string>('JWT_SECRET');
  }

  getEnvironment(): string {
    return this.get<string>('NODE_ENV') || 'development';
  }

  isDevelopment(): boolean {
    return this.getEnvironment() === 'development';
  }

  isProduction(): boolean {
    return this.getEnvironment() === 'production';
  }

  isTest(): boolean {
    return this.getEnvironment() === 'test';
  }

  // WebSocket Configuration
  getWebSocketPort(): number {
    return this.get<number>('WS_PORT', 8080);
  }

  // Redis Configuration
  getRedisHost(): string {
    return this.get<string>('REDIS_HOST', 'localhost');
  }

  getRedisPort(): number {
    return this.get<number>('REDIS_PORT', 6379);
  }

  getRedisPassword(): string | undefined {
    return this.get<string>('REDIS_PASSWORD');
  }

  getRedisDb(): number {
    return this.get<number>('REDIS_DB', 0);
  }

  // Database Configuration
  getDatabaseHost(): string {
    return this.get<string>('DB_HOST', 'localhost');
  }

  getDatabasePort(): number {
    return this.get<number>('DB_PORT', 5432);
  }

  getDatabaseName(): string {
    return this.getOrThrow<string>('DB_NAME');
  }

  getDatabaseUsername(): string {
    return this.getOrThrow<string>('DB_USERNAME');
  }

  getDatabasePassword(): string {
    return this.getOrThrow<string>('DB_PASSWORD');
  }

  // Security Configuration
  getCorsOrigins(): string[] {
    const origins = this.get<string>('CORS_ORIGINS', '*');
    return origins === '*' ? ['*'] : origins.split(',');
  }

  getJwtExpiresIn(): string {
    return this.get<string>('JWT_EXPIRES_IN', '1h');
  }

  // API Configuration
  getApiPrefix(): string {
    return this.get<string>('API_PREFIX', 'api');
  }

  getApiVersion(): string {
    return this.get<string>('API_VERSION', 'v1');
  }

  // Logging Configuration
  getLogLevel(): string {
    return this.get<string>('LOG_LEVEL', 'info');
  }

  // Feature Flags
  isSwaggerEnabled(): boolean {
    return this.get<boolean>('SWAGGER_ENABLED', !this.isProduction());
  }

  isMetricsEnabled(): boolean {
    return this.get<boolean>('METRICS_ENABLED', true);
  }

  // External Services
  getOpenAIApiKey(): string | undefined {
    return this.get<string>('OPENAI_API_KEY');
  }

  getCloudflareApiKey(): string | undefined {
    return this.get<string>('CLOUDFLARE_API_KEY');
  }

  getFirebaseConfigPath(): string | undefined {
    return this.get<string>('FIREBASE_CONFIG_PATH');
  }

  // Agent Configuration
  getMaxAgentConcurrency(): number {
    return this.get<number>('MAX_AGENT_CONCURRENCY', 10);
  }

  getAgentTimeout(): number {
    return this.get<number>('AGENT_TIMEOUT', 30000);
  }

  // Qdrant Configuration
  getQdrantUrl(): string {
    return this.get<string>('QDRANT_URL', 'http://localhost:6333');
  }

  getQdrantApiKey(): string | undefined {
    return this.get<string>('QDRANT_API_KEY');
  }

  // Memory Configuration
  getMemoryRetentionDays(): number {
    return this.get<number>('MEMORY_RETENTION_DAYS', 30);
  }

  getMemoryCapacity(): number {
    return this.get<number>('MEMORY_CAPACITY', 10000);
  }

  // Enhanced Memory Configuration
  getMemoryShortTermCapacity(): number {
    return this.get<number>('memory.shortTermCapacity', 1000);
  }

  getMemoryWorkingCapacity(): number {
    return this.get<number>('memory.workingMemoryCapacity', 100);
  }

  getMemoryLongTermRetentionDays(): number {
    return this.get<number>('memory.longTermRetentionDays', 30);
  }

  getMemoryCompressionThreshold(): number {
    return this.get<number>('memory.compressionThreshold', 0.8);
  }

  getMemoryEmbeddingDimension(): number {
    return this.get<number>('memory.embeddingDimension', 1536);
  }

  isMemoryClusteringEnabled(): boolean {
    return this.get<boolean>('memory.clusteringEnabled', true);
  }

  isMemoryAutoOptimizeEnabled(): boolean {
    return this.get<boolean>('memory.autoOptimize', true);
  }

  // Document Chunking Configuration
  getChunkingMaxChunkSize(): number {
    return this.get<number>('chunking.maxChunkSize', 1000);
  }

  getChunkingOverlap(): number {
    return this.get<number>('chunking.overlap', 100);
  }

  getChunkingProvider(): 'openai' | 'anthropic' | 'local' {
    return this.get<'openai' | 'anthropic' | 'local'>('chunking.provider', 'local');
  }

  getChunkingSimilarityThreshold(): number {
    return this.get<number>('chunking.similarityThreshold', 0.7);
  }

  getChunkingMinChunkSize(): number {
    return this.get<number>('chunking.minChunkSize', 100);
  }

  // Agent and LLM Configuration
  getCascadeApiKey(): string | undefined {
    return this.get<string>('CASCADE_API_KEY');
  }

  getClineApiKey(): string | undefined {
    return this.get<string>('CLINE_API_KEY');
  }

  getCascadeModel(): string {
    return this.get<string>('CASCADE_MODEL', 'anthropic/claude-2');
  }

  getClineModel(): string {
    return this.get<string>('CLINE_MODEL', 'anthropic/claude-2');
  }

  getMaxMemoryMessages(): number {
    return this.get<number>('MAX_MEMORY_MESSAGES', 20);
  }

  // Service Integration Configuration
  getServiceDiscoveryEnabled(): boolean {
    return this.get<boolean>('SERVICE_DISCOVERY_ENABLED', true);
  }

  getMessageQueueEnabled(): boolean {
    return this.get<boolean>('MESSAGE_QUEUE_ENABLED', true);
  }

  getHealthCheckInterval(): number {
    return this.get<number>('HEALTH_CHECK_INTERVAL', 30000);
  }
}