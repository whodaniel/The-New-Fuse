import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service.ts';
import { LoggingService } from '../services/LoggingService.ts';
import { MetricsService } from '../services/MetricsService.ts';

export interface StateConfig {
  prefix?: string;
  ttl?: number;
}

export interface State {
  id: string;
  data: Record<string, unknown>;
  timestamp: number;
  ttl?: number;
}

@Injectable()
export class StateService implements OnModuleInit {
  private readonly logger: LoggingService;
  private readonly prefix: string;
  private readonly defaultTtl: number;

  constructor(
    private readonly redis: RedisService,
    private readonly config: ConfigService,
    private readonly metrics: MetricsService
  ) {
    this.logger = new LoggingService('StateService');
    const stateConfig = this.config.get<StateConfig>('state', {});
    this.prefix = stateConfig.prefix || 'state';
    this.defaultTtl = stateConfig.ttl || 3600;
  }

  async onModuleInit(): Promise<void> {
    try {
      this.logger.info('Initializing state service...');
      await this.redis.connect();
      this.logger.info('State service initialized');
    } catch (error) {
      this.logger.error('Failed to initialize state service', error);
      throw error;
    }
  }

  async saveState(id: string, data: Record<string, unknown>, ttl?: number): Promise<void> {
    try {
      const state: State = {
        id,
        data,
        timestamp: Date.now(),
        ttl: ttl || this.defaultTtl
      };

      const key = this.getStateKey(id);
      await this.redis.set(key, JSON.stringify(state), 'EX', state.ttl);
      this.metrics.trackCount('state_saved', { id });
    } catch (error) {
      this.metrics.trackCount('state_save_error', { id });
      this.logger.error('Failed to save state', { id, error });
      throw error;
    }
  }

  async loadState(id: string): Promise<Record<string, unknown> | null> {
    try {
      const key = this.getStateKey(id);
      const data = await this.redis.get(key);
      
      if (!data) {
        return null;
      }

      const state: State = JSON.parse(data);
      this.metrics.trackCount('state_loaded', { id });
      return state.data;
    } catch (error) {
      this.metrics.trackCount('state_load_error', { id });
      this.logger.error('Failed to load state', { id, error });
      throw error;
    }
  }

  async deleteState(id: string): Promise<void> {
    try {
      const key = this.getStateKey(id);
      await this.redis.del(key);
      this.metrics.trackCount('state_deleted', { id });
    } catch (error) {
      this.metrics.trackCount('state_delete_error', { id });
      this.logger.error('Failed to delete state', { id, error });
      throw error;
    }
  }

  async listStates(): Promise<string[]> {
    try {
      const pattern = this.getStateKey('*');
      const keys = await this.redis.keys(pattern);
      return keys.map(key => key.substring(this.prefix.length + 1));
    } catch (error) {
      this.metrics.trackCount('state_list_error');
      this.logger.error('Failed to list states', error);
      throw error;
    }
  }

  private getStateKey(id: string): string {
    return `${this.prefix}:${id}`;
  }
}