import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { DataSource, QueryRunner, EntityManager } from 'typeorm';
import { Redis } from 'ioredis';
import { DatabaseConfig, DatabaseConfigSchema, toTypeOrmConfig } from './config.js';
import { MetricsService } from '../monitoring/MetricsService.js';
import { LoggerService } from '../logging/LoggerService.js';
import { EventEmitter2 } from '@nestjs/event-emitter';

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private dataSource: DataSource;
  private redis: Redis | null = null;
  private healthCheckInterval: NodeJS.Timeout;
  private readonly retryDelays: number[];

  constructor(
    private readonly config: DatabaseConfig,
    private readonly metrics: MetricsService,
    private readonly logger: LoggerService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    // Validate config at runtime
    DatabaseConfigSchema.parse(config);
    
    // Calculate exponential backoff delays
    this.retryDelays = Array.from({ length: config.maxRetries }, (_, i) => 
      Math.min(config.retryDelay * Math.pow(2, i), 5000)
    );
  }

  async onModuleInit() {
    await this.initializeConnections();
    this.startHealthChecks();
  }

  async onModuleDestroy() {
    await this.cleanup();
  }

  private async initializeConnections() {
    // Initialize PostgreSQL connection
    this.dataSource = new DataSource(toTypeOrmConfig(this.config));
    await this.connectWithRetry();

    // Initialize Redis if configured
    if (this.config.cache) {
      this.redis = new Redis({
        host: this.config.cache.host,
        port: this.config.cache.port,
        password: this.config.cache.password,
      });

      this.redis.on('error', (error) => {
        this.logger.error('Redis connection error:', error);
        this.metrics.increment('database.redis.errors');
      });
    }
  }

  private async connectWithRetry(attempt = 0): Promise<void> {
    try {
      await this.dataSource.initialize();
      this.logger.info('Database connection established successfully');
      this.metrics.increment('database.connections.successful');
    } catch (error) {
      this.metrics.increment('database.connections.failed');
      this.logger.error(`Database connection attempt ${attempt + 1} failed:`, error);

      if (attempt < this.config.maxRetries) {
        const delay = this.retryDelays[attempt];
        this.logger.info(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        return this.connectWithRetry(attempt + 1);
      }

      throw error;
    }
  }

  private startHealthChecks() {
    if (!this.config.metricsEnabled) return;

    this.healthCheckInterval = setInterval(async () => {
      const startTime = Date.now();
      try {
        await this.dataSource.query('SELECT 1');
        const duration = Date.now() - startTime;
        
        this.metrics.gauge('database.health.latency', duration);
        this.metrics.increment('database.health.success');
        
        this.eventEmitter.emit('database.health', { 
          status: 'healthy',
          latency: duration 
        });
      } catch (error) {
        this.metrics.increment('database.health.failure');
        this.logger.error('Database health check failed:', error);
        
        this.eventEmitter.emit('database.health', { 
          status: 'unhealthy',
          error: error.message 
        });
      }
    }, this.config.metricsInterval);
  }

  async withTransaction<T>(
    operation: (entityManager: EntityManager) => Promise<T>
  ): Promise<T> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const result = await operation(queryRunner.manager);
      await queryRunner.commitTransaction();
      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async executeQuery<T>(query: string, parameters: any[] = []): Promise<T> {
    const startTime = Date.now();
    try {
      const result = await this.dataSource.query(query, parameters);
      const duration = Date.now() - startTime;
      
      this.metrics.timing('database.query.duration', duration);
      this.metrics.increment('database.query.success');
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.metrics.timing('database.query.duration', duration);
      this.metrics.increment('database.query.error');
      
      this.logger.error('Query execution failed:', {
        query,
        parameters,
        error: error.message,
        duration
      });
      
      throw error;
    }
  }

  async getVectorNeighbors(
    table: string,
    column: string,
    vector: number[],
    limit: number = 10
  ): Promise<any[]> {
    if (!this.config.vector) {
      throw new Error('Vector search not configured');
    }

    const query = `
      SELECT *, (${column} <-> $1) as distance
      FROM ${table}
      ORDER BY ${column} <-> $1
      LIMIT $2
    `;

    return this.executeQuery(query, [vector, limit]);
  }

  async cleanup() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    if (this.dataSource?.isInitialized) {
      await this.dataSource.destroy();
    }

    if (this.redis) {
      await this.redis.quit();
    }
  }

  // Helper methods for common operations
  async count(table: string, conditions: Record<string, any> = {}): Promise<number> {
    const repository = this.dataSource.getRepository(table);
    return repository.count({ where: conditions });
  }

  async findOne(table: string, conditions: Record<string, any>): Promise<any> {
    const repository = this.dataSource.getRepository(table);
    return repository.findOne({ where: conditions });
  }

  async find(table: string, conditions: Record<string, any> = {}): Promise<any[]> {
    const repository = this.dataSource.getRepository(table);
    return repository.find({ where: conditions });
  }

  async create(table: string, data: Record<string, any>): Promise<any> {
    const repository = this.dataSource.getRepository(table);
    const entity = repository.create(data);
    return repository.save(entity);
  }

  async update(table: string, id: string | number, data: Record<string, any>): Promise<any> {
    const repository = this.dataSource.getRepository(table);
    await repository.update(id, data);
    return this.findOne(table, { id });
  }

  async delete(table: string, id: string | number): Promise<void> {
    const repository = this.dataSource.getRepository(table);
    await repository.delete(id);
  }
}