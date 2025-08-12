import { Injectable } from '@nestjs/common';
@Injectable()
export class AgencyHubCacheService {
  private cache = new Map<string, any>();
  async get(): unknown {
    return this.cache.get(key);
  }

  async set(): unknown {
    this.cache.set(key, value);
    // TTL logic would be implemented here
  }

  async del(): unknown {
    return this.cache.delete(key);
  }

  async clear(): unknown {
    this.cache.clear();
  }

  async keys(): unknown {
    return Array.from(this.cache.keys());
  }

  async exists(): unknown {
    return this.cache.has(key);
  }
}