// Storage Service
// Centralized storage management with sync and local storage

class StorageService {
  constructor() {
    this.local = chrome.storage.local;
    this.sync = chrome.storage.sync;
  }

  // Get items from storage
  async get(keys, useSync = false) {
    const storage = useSync ? this.sync : this.local;

    if (typeof keys === 'string') {
      const data = await storage.get(keys);
      return data[keys];
    }

    return await storage.get(keys);
  }

  // Set items in storage
  async set(items, useSync = false) {
    const storage = useSync ? this.sync : this.local;
    await storage.set(items);
    return true;
  }

  // Remove items from storage
  async remove(keys, useSync = false) {
    const storage = useSync ? this.sync : this.local;
    await storage.remove(keys);
    return true;
  }

  // Clear all storage
  async clear(useSync = false) {
    const storage = useSync ? this.sync : this.local;
    await storage.clear();
    return true;
  }

  // Get all items
  async getAll(useSync = false) {
    const storage = useSync ? this.sync : this.local;
    return await storage.get(null);
  }

  // Check if key exists
  async has(key, useSync = false) {
    const data = await this.get(key, useSync);
    return data !== undefined;
  }

  // Get storage usage
  async getUsage() {
    const localUsage = await this.local.getBytesInUse();
    const syncUsage = await this.sync.getBytesInUse();

    return {
      local: localUsage,
      sync: syncUsage,
      total: localUsage + syncUsage,
      localLimit: chrome.storage.local.QUOTA_BYTES,
      syncLimit: chrome.storage.sync.QUOTA_BYTES,
    };
  }
}

const storageService = new StorageService();
export default storageService;
