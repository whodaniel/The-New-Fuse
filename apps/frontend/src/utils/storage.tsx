export type StorageType = 'local' | 'session';

export interface StorageOptions {
  type?: StorageType;
  expires?: number; // Time in milliseconds
}

interface StorageItem<T> {
  value: T;
  expires?: number;
}

export function getStorage(type: StorageType = 'local'): Storage {
  return type === 'local' ? localStorage : sessionStorage;
}

export function setItem<T>(
  key: string,
  value: T,
  options: StorageOptions = {}
): void {
  const { type = 'local', expires } = options;
  const storage = getStorage(type);

  const item: StorageItem<T> = {
    value,
    ...(expires && { expires: Date.now() + expires }),
  };

  try {
    storage.setItem(key, JSON.stringify(item));
  } catch (error) {
    console.error('Error saving to storage:', error);
    // Attempt to clear expired items if storage is full
    if (error instanceof Error && error.name === 'QuotaExceededError') {
      clearExpired(type);
      try {
        storage.setItem(key, JSON.stringify(item));
      } catch (retryError) {
        console.error('Storage still full after clearing expired items:', retryError);
      }
    }
  }
}

export function getItem<T>(
  key: string,
  options: StorageOptions = {}
): T | null {
  const { type = 'local' } = options;
  const storage = getStorage(type);

  const item = storage.getItem(key);
  if (!item) return null;

  try {
    const parsed = JSON.parse(item) as StorageItem<T>;
    
    if (parsed.expires && Date.now() > parsed.expires) {
      storage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    // If parsing fails, assume it's an old format and return as is
    return item as unknown as T;
  }
}

export function removeItem(
  key: string,
  options: StorageOptions = {}
): void {
  const { type = 'local' } = options;
  const storage = getStorage(type);
  storage.removeItem(key);
}

export function clear(type: StorageType = 'local'): void {
  const storage = getStorage(type);
  storage.clear();
}

export function clearExpired(type: StorageType = 'local'): void {
  const storage = getStorage(type);
  const now = Date.now();

  Object.keys(storage).forEach(key => {
    const item = storage.getItem(key);
    if (item) {
      try {
        const parsed = JSON.parse(item) as StorageItem<unknown>;
        if (parsed.expires && now > parsed.expires) {
          storage.removeItem(key);
        }
      } catch {
        // Skip if item can't be parsed
      }
    }
  });
}

export function getSize(type: StorageType = 'local'): number {
  const storage = getStorage(type);
  return Object.keys(storage).reduce((size, key) => {
    const item = storage.getItem(key);
    return size + (item ? item.length : 0);
  }, 0);
}

export function hasSupport(type: StorageType = 'local'): boolean {
  try {
    const storage = getStorage(type);
    const testKey = '__storage_test__';
    storage.setItem(testKey, '');
    storage.removeItem(testKey);
    return true;
  } catch {
    return false;
  }
}

export function subscribe(
  key: string,
  callback: (value: any) => void,
  options: StorageOptions = {}
): () => void {
  const { type = 'local' } = options;

  const handleStorage = (event: StorageEvent): any => {
    if (event.key === key && event.storageArea === getStorage(type)) {
      const newValue = event.newValue ? JSON.parse(event.newValue).value : null;
      callback(newValue);
    }
  };

  window.addEventListener('storage', handleStorage);
  return () => window.removeEventListener('storage', handleStorage);
}