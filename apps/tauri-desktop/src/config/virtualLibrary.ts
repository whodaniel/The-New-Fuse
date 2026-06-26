import { safeStorage } from '../lib/safeStorage';

export const VIRTUAL_LIBRARY_URL_KEY = 'tnf.virtualLibrary.url';

/** Docker Compose maps virtual-library → host 5173 */
export const DEFAULT_VIRTUAL_LIBRARY_URL = 'http://127.0.0.1:5173';

/** Direct `pnpm dev` in apps/virtual-library-blueprints (vite.config port 3000) */
export const DIRECT_DEV_VIRTUAL_LIBRARY_URL = 'http://127.0.0.1:3000';

export function getVirtualLibraryBaseUrl(): string {
  const stored = safeStorage.getItem(VIRTUAL_LIBRARY_URL_KEY)?.trim();
  if (stored) return stored.replace(/\/$/, '');

  const fromEnv = String(import.meta.env.VITE_VIRTUAL_LIBRARY_URL || '').trim();
  if (fromEnv) return fromEnv.replace(/\/$/, '');

  return DEFAULT_VIRTUAL_LIBRARY_URL;
}

export function setVirtualLibraryBaseUrl(url: string): void {
  safeStorage.setItem(VIRTUAL_LIBRARY_URL_KEY, url.trim().replace(/\/$/, ''));
}

export function buildVirtualLibraryEmbedUrl(baseUrl = getVirtualLibraryBaseUrl()): string {
  const url = new URL(baseUrl);
  url.searchParams.set('tnf_desktop', '1');
  return url.toString();
}
