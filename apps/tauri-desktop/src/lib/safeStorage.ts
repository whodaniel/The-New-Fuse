/**
 * WebView-safe storage — Tauri/WKWebView can block localStorage (SecurityError).
 * Falls back to in-memory storage when persistence is unavailable.
 */

const memoryStore = new Map<string, string>();

let storageAvailable: boolean | null = null;

function canUseLocalStorage(): boolean {
  if (storageAvailable !== null) {
    return storageAvailable;
  }
  if (typeof window === 'undefined') {
    storageAvailable = false;
    return false;
  }
  try {
    const probe = '__tnf_storage_probe__';
    window.localStorage.setItem(probe, '1');
    window.localStorage.removeItem(probe);
    storageAvailable = true;
  } catch {
    storageAvailable = false;
  }
  return storageAvailable;
}

export const safeStorage = {
  getItem(key: string): string | null {
    try {
      if (canUseLocalStorage()) {
        return window.localStorage.getItem(key);
      }
    } catch {
      // fall through
    }
    return memoryStore.get(key) ?? null;
  },

  setItem(key: string, value: string): void {
    try {
      if (canUseLocalStorage()) {
        window.localStorage.setItem(key, value);
        return;
      }
    } catch {
      // fall through
    }
    memoryStore.set(key, value);
  },

  removeItem(key: string): void {
    try {
      if (canUseLocalStorage()) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // ignore
    }
    memoryStore.delete(key);
  },
};

export default safeStorage;
