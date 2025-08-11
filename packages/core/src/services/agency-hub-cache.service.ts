import { Injectable } from '@nestjs/common';
@Injectable()
export class AgencyHubCacheService {
  // Implementation needed
}
  private cache = new Map<string, any>();
  async get(key: string): Promise<any> {
  // Implementation needed
}
    return this.cache.get(key);
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
  // Implementation needed
}
    this.cache.set(key, value);
    // TTL logic would be implemented here
  }

  async del(key: string): Promise<boolean> {
  // Implementation needed
}
    return this.cache.delete(key);
  }

  async clear(): Promise<void> {
  // Implementation needed
}
    this.cache.clear();
  }

  async keys(pattern?: string): Promise<string[]> {
  // Implementation needed
}
    return Array.from(this.cache.keys());
  }

  async exists(key: string): Promise<boolean> {
  // Implementation needed
}
    return this.cache.has(key);
  }
}