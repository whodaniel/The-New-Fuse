import { Injectable } from '@nestjs/common';
import { Redis } from 'ioredis';
@Injectable()
export class CacheService {
  // Implementation needed
}
  private redis: Redis;
  constructor() {
  // Implementation needed
}
    this.redis = new Redis({
  // Implementation needed
}
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
    });
  }

  async get<T>(key: string): Promise<T | null> {
  // Implementation needed
}
    const value = await this.redis.get(key);
    return value ? JSON.parse(value) : null;
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
  // Implementation needed
}
    const serialized = JSON.stringify(value);
    if (ttl) {
  // Implementation needed
}
      await this.redis.setex(key, ttl, serialized);
    } else {
  // Implementation needed
}
      await this.redis.set(key, serialized);
    }
  }

  async del(key: string): Promise<void> {
  // Implementation needed
}
    await this.redis.del(key);
  }

  async exists(key: string): Promise<boolean> {
  // Implementation needed
}
    const result = await this.redis.exists(key);
    return result === 1;
  }

  async flush(): Promise<void> {
  // Implementation needed
}
    await this.redis.flushall();
  }
}