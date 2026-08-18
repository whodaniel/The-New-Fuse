type ExtensionRuntime = typeof chrome.runtime;

declare global {
  interface Window {
    browser?: {
      runtime?: ExtensionRuntime;
    };
  }
}

export function getExtensionRuntime(): ExtensionRuntime | null {
  if (typeof globalThis === 'undefined') return null;

  const chromeRuntime = globalThis.chrome?.runtime;
  if (chromeRuntime?.onMessage) return chromeRuntime;

  const browserRuntime = globalThis.browser?.runtime;
  if (browserRuntime?.onMessage) return browserRuntime;

  return null;
}

export function isExtensionRuntimeAvailable(): boolean {
  const runtime = getExtensionRuntime();
  return Boolean(runtime?.id);
}

export function getExtensionStorage(): typeof chrome.storage | null {
  if (typeof globalThis === 'undefined') return null;
  return globalThis.chrome?.storage || globalThis.browser?.storage || null;
}
