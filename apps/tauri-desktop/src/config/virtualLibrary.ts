import { safeStorage } from '../lib/safeStorage';

export const VIRTUAL_LIBRARY_URL_KEY = 'tnf.virtualLibrary.url';

/** Docker Compose maps virtual-library → host 5173 */
export const DEFAULT_VIRTUAL_LIBRARY_URL = 'http://127.0.0.1:5173';

/** Direct `pnpm dev` in apps/virtual-library-blueprints (vite.config port 3000) */
export const DIRECT_DEV_VIRTUAL_LIBRARY_URL = 'http://127.0.0.1:3000';

/** Story Architect local AI relay (apps/virtual-library-blueprints/ai-relay) */
export const STORY_ARCHITECT_RELAY_URL = 'http://127.0.0.1:43120';

/** Local KWS / audio-trigger ingest used by Library voice pipeline */
export const LIBRARY_KWS_BASE_URL = 'http://127.0.0.1:43110';

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

/**
 * Desktop embed URL for the Virtual Library.
 * Pins local Story Architect + KWS endpoints so the iframe does not fall back
 * to production `/api/ai` / `/api/kws` proxies when running inside Tauri.
 */
export function buildVirtualLibraryEmbedUrl(baseUrl = getVirtualLibraryBaseUrl()): string {
  const url = new URL(baseUrl);
  url.searchParams.set('tnf_desktop', '1');
  // Matches apps/virtual-library-blueprints/src/lib/runtimeEndpoints.ts
  url.searchParams.set('tnf_story_architect_local', '1');
  url.searchParams.set('tnf_ai_relay', STORY_ARCHITECT_RELAY_URL);
  url.searchParams.set('tnf_kws_base', LIBRARY_KWS_BASE_URL);
  return url.toString();
}

export type LibraryAudioDependency = {
  id: 'library' | 'storyArchitect' | 'kws';
  label: string;
  url: string;
  online: boolean | null;
};

export async function probeLibraryAudioDependencies(
  libraryBaseUrl = getVirtualLibraryBaseUrl()
): Promise<LibraryAudioDependency[]> {
  const targets: Array<Omit<LibraryAudioDependency, 'online'> & { healthPath?: string }> = [
    { id: 'library', label: 'Library UI', url: libraryBaseUrl },
    {
      id: 'storyArchitect',
      label: 'Story Architect relay',
      url: STORY_ARCHITECT_RELAY_URL,
      healthPath: '/v1/health',
    },
    {
      id: 'kws',
      label: 'KWS / audio triggers',
      url: LIBRARY_KWS_BASE_URL,
      healthPath: '/healthz',
    },
  ];

  return Promise.all(
    targets.map(async (target) => {
      try {
        if (target.healthPath) {
          const res = await fetch(`${target.url.replace(/\/$/, '')}${target.healthPath}`, {
            cache: 'no-store',
            signal: AbortSignal.timeout(2500),
          });
          return { ...target, online: res.ok };
        }
        await fetch(target.url, {
          mode: 'no-cors',
          cache: 'no-store',
          signal: AbortSignal.timeout(2500),
        });
        return { ...target, online: true };
      } catch {
        return { ...target, online: false };
      }
    })
  );
}
