/**
 * RedisService mock implementation
 * Used as a placeholder when the actual database module is not available
 */

export class RedisService {
  private storage: Map<string, string> = new Map();

  /**
   * Get a value from Redis
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: string): Promise<string | null> {
    return this.storage.get(key) ?? null;
  }

  /**
   * Set a value in Redis
   * @param key The key to set
   * @param value The value to store
   * @param ttl Time to live in seconds (optional)
   */
  async set(key: string, value: string, ttl?: number): Promise<void> {
    this.storage.set(key, value);
    
    // If TTL is specified, set up a timeout to delete the key
    if (ttl) {
      setTimeout(() => {
        this.storage.delete(key);
      }, ttl * 1000);
    }
  }

  /**
   * Delete a key from Redis
   * @param key The key to delete
   */
  async del(key: string): Promise<void> {
    this.storage.delete(key);
  }
}
