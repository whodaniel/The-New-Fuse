import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  // Implementation needed
}
  private readonly logger = new Logger(RedisService.name);
  private _client: Redis;
  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
  // Implementation needed
}
    this._client = new Redis({
  // Implementation needed
}
      host: this.configService.get('REDIS_HOST', 'localhost'),
      port: this.configService.get('REDIS_PORT', 6379),
      password: this.configService.get('REDIS_PASSWORD'),
      db: this.configService.get('REDIS_DB', 0),
      keyPrefix: 'fuse:',
    });
    this._client.on('error', (error) => {
  // Implementation needed
}
      this.logger.error('Redis connection error:', error);
    });
    this._client.on('connect', () => {
  // Implementation needed
}
      this.logger.log('Connected to Redis');
    });
  }

  async onModuleDestroy() {
  // Implementation needed
}
    if (this._client) {
  // Implementation needed
}
      await this._client.quit();
    }
  }

  get client(): Redis {
  // Implementation needed
}
    return this._client;
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
  // Implementation needed
}
    if (ttl) {
  // Implementation needed
}
      await this._client.set(key, value, 'EX', ttl);
    } else {
  // Implementation needed
}
      await this._client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
  // Implementation needed
}
    return await this._client.get(key);
  }

  async del(key: string): Promise<number> {
  // Implementation needed
}
    return await this._client.del(key);
  }

  async exists(key: string): Promise<number> {
  // Implementation needed
}
    return await this._client.exists(key);
  }
}