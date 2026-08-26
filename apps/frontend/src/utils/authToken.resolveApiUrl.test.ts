/**
 * resolveApiUrl – unit tests
 *
 * Guards the production URL resolution contract in authFetch.
 * The resolver must rewrite relative /api/... paths to the canonical absolute
 * API_BASE in production while leaving them unchanged in development.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// We need to control what API_BASE resolves to per-test.
// Vitest's module mock system lets us do that.
vi.mock('@/config/api', () => ({
  API_BASE: '',
}));

// Import after mock so we can mutate the mock value per-test
import * as apiConfig from '@/config/api';
import { resolveApiUrl } from './authToken';

function setApiBase(value: string) {
  (apiConfig as any).API_BASE = value;
}

describe('resolveApiUrl', () => {
  afterEach(() => {
    vi.resetModules();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Development mode: API_BASE = '/api' (relative, Vite proxy handles it)
  // ─────────────────────────────────────────────────────────────────────────

  describe('development (API_BASE = "/api")', () => {
    beforeEach(() => setApiBase('/api'));

    it('leaves /api/foo unchanged', () => {
      expect(resolveApiUrl('/api/foo')).toBe('/api/foo');
    });

    it('leaves /api/billing/membership/me unchanged', () => {
      expect(resolveApiUrl('/api/billing/membership/me')).toBe('/api/billing/membership/me');
    });

    it('leaves /api alone', () => {
      expect(resolveApiUrl('/api')).toBe('/api');
    });

    it('leaves /api?q=1 with query string unchanged', () => {
      expect(resolveApiUrl('/api?q=1')).toBe('/api?q=1');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Production mode: API_BASE = absolute URL
  // ─────────────────────────────────────────────────────────────────────────

  describe('production (API_BASE = "https://api.thenewfuse.com/api")', () => {
    beforeEach(() => setApiBase('https://api.thenewfuse.com/api'));

    it('rewrites /api/billing/membership/me to absolute URL', () => {
      expect(resolveApiUrl('/api/billing/membership/me')).toBe(
        'https://api.thenewfuse.com/api/billing/membership/me'
      );
    });

    it('rewrites /api/auth/me to absolute URL', () => {
      expect(resolveApiUrl('/api/auth/me')).toBe('https://api.thenewfuse.com/api/auth/me');
    });

    it('rewrites /api alone to base URL', () => {
      expect(resolveApiUrl('/api')).toBe('https://api.thenewfuse.com/api');
    });

    it('rewrites /api?q=1 with query string', () => {
      expect(resolveApiUrl('/api?q=1')).toBe('https://api.thenewfuse.com/api?q=1');
    });

    it('does NOT rewrite already-absolute https:// URLs', () => {
      const abs = 'https://other-service.example.com/data';
      expect(resolveApiUrl(abs)).toBe(abs);
    });

    it('does NOT rewrite already-absolute http:// URLs', () => {
      const abs = 'http://localhost:3001/api/foo';
      expect(resolveApiUrl(abs)).toBe(abs);
    });

    it('does NOT rewrite non-/api paths like /auth/login', () => {
      expect(resolveApiUrl('/auth/login')).toBe('/auth/login');
    });

    it('does NOT rewrite paths starting with /apiary (guards prefix match)', () => {
      expect(resolveApiUrl('/apiary/hive')).toBe('/apiary/hive');
    });

    it('passes URL objects through unchanged', () => {
      const url = new URL('https://api.thenewfuse.com/api/foo');
      expect(resolveApiUrl(url)).toBe(url);
    });

    it('does NOT double-prefix an already-resolved absolute URL', () => {
      const already = 'https://api.thenewfuse.com/api/billing/membership/me';
      expect(resolveApiUrl(already)).toBe(already);
    });
  });
});
