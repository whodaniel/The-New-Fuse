interface StorageData {
  [key: string]: unknown;
}

interface StorageUsage {
  local: number;
  sync: number;
  total: number;
  localLimit: number;
  syncLimit: number;
}

class StorageService {
  private local: Chrome.storage.LocalStorageArea;
  private sync: Chrome.storage.SyncStorageArea;

  constructor() {
    this.local = chrome.storage.local;
    this.sync = chrome.storage.sync;
  }

  async get(keys: string | string[], useSync = false): Promise<unknown> {
    const storage = useSync ? this.sync : this.local;

    if (typeof keys === 'string') {
      const data = await storage.get(keys);
      return data[keys];
    }

    return await storage.get(keys);
  }

  async set(items: StorageData, useSync = false): Promise<boolean> {
    const storage = useSync ? this.sync : this.local;
    await storage.set(items);
    return true;
  }

  async remove(keys: string | string[], useSync = false): Promise<boolean> {
    const storage = useSync ? this.sync : this.local;
    await storage.remove(keys);
    return true;
  }

  async clear(useSync = false): Promise<boolean> {
    const storage = useSync ? this.sync : this.local;
    await storage.clear();
    return true;
  }

  async getAll(useSync = false): Promise<StorageData> {
    const storage = useSync ? this.sync : this.local;
    return (await storage.get(null)) as StorageData;
  }

  async has(key: string, useSync = false): Promise<boolean> {
    const data = await this.get(key, useSync);
    return data !== undefined;
  }

  async getUsage(): Promise<StorageUsage> {
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
