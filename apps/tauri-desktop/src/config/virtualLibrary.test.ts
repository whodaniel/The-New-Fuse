import { beforeEach, describe, expect, it } from 'vitest';
import { safeStorage } from '../lib/safeStorage';
import {
  buildVirtualLibraryEmbedUrl,
  DEFAULT_VIRTUAL_LIBRARY_URL,
  getVirtualLibraryBaseUrl,
  LIBRARY_KWS_BASE_URL,
  setVirtualLibraryBaseUrl,
  STORY_ARCHITECT_RELAY_URL,
  VIRTUAL_LIBRARY_URL_KEY,
} from './virtualLibrary';

describe('virtualLibrary config', () => {
  beforeEach(() => {
    (safeStorage as { __clear?: () => void }).__clear?.();
    safeStorage.removeItem(VIRTUAL_LIBRARY_URL_KEY);
  });

  it('defaults to docker-compose host port', () => {
    expect(getVirtualLibraryBaseUrl()).toBe(DEFAULT_VIRTUAL_LIBRARY_URL);
  });

  it('persists a custom base URL', () => {
    setVirtualLibraryBaseUrl('http://127.0.0.1:3000');
    expect(getVirtualLibraryBaseUrl()).toBe('http://127.0.0.1:3000');
  });

  it('pins desktop embed to local Story Architect + KWS audio path', () => {
    const url = buildVirtualLibraryEmbedUrl('http://127.0.0.1:5173');
    expect(url).toContain('tnf_desktop=1');
    expect(url).toContain('tnf_story_architect_local=1');
    expect(url).toContain(`tnf_ai_relay=${encodeURIComponent(STORY_ARCHITECT_RELAY_URL)}`);
    expect(url).toContain(`tnf_kws_base=${encodeURIComponent(LIBRARY_KWS_BASE_URL)}`);
    expect(url.startsWith('http://127.0.0.1:5173')).toBe(true);
  });
});
