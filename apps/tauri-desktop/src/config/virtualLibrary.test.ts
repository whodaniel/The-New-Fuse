import { beforeEach, describe, expect, it } from 'vitest';
import {
  buildVirtualLibraryEmbedUrl,
  DEFAULT_VIRTUAL_LIBRARY_URL,
  getVirtualLibraryBaseUrl,
  setVirtualLibraryBaseUrl,
  VIRTUAL_LIBRARY_URL_KEY,
} from './virtualLibrary';
import { safeStorage } from '../lib/safeStorage';

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

  it('adds desktop embed query param', () => {
    const url = buildVirtualLibraryEmbedUrl('http://127.0.0.1:5173');
    expect(url).toContain('tnf_desktop=1');
    expect(url.startsWith('http://127.0.0.1:5173')).toBe(true);
  });
});
