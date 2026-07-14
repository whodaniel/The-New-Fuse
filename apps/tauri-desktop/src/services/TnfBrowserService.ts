import { invoke } from '@tauri-apps/api/core';
import { isTauriRuntime } from '../lib/isTauri';
import { EventEmitter } from './EventEmitter';

export type TnfBrowserEvent = 'connected' | 'disconnected' | 'status' | 'error' | 'runtime';

export interface TnfBrowserStatus {
  listening: boolean;
  hasToken: boolean;
  connected: boolean;
  runtimeConnected: boolean;
  lastError: string | null;
  port: number;
  tokenPath: string;
}

export interface TnfDiscoveredElement {
  handleId?: string;
  tag?: string;
  id?: string;
  cls?: string;
  text?: string;
  label?: string;
  role?: string;
  type?: string;
  href?: string;
  [key: string]: unknown;
}

export interface TnfBrowserTab {
  id: number;
  url: string;
  title: string;
  active?: boolean;
  windowId?: number;
  index?: number;
}

type TauriStatus = {
  listening: boolean;
  has_token: boolean;
  connected: boolean;
  runtime_connected: boolean;
  last_error?: string | null;
  port: number;
  token_path: string;
};

const DEV_BASE = '/__tnf-browser';

async function fetchJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${DEV_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const data = (await response.json()) as T & { error?: string };
  if (!response.ok) {
    throw new Error(data.error || `TNF Browser bridge error (${response.status})`);
  }
  return data;
}

function normalizeStatus(raw: Record<string, unknown> | TauriStatus): TnfBrowserStatus {
  if ('has_token' in raw) {
    const t = raw as TauriStatus;
    return {
      listening: t.listening,
      hasToken: t.has_token,
      connected: t.connected,
      runtimeConnected: t.runtime_connected,
      lastError: t.last_error ?? null,
      port: t.port,
      tokenPath: t.token_path,
    };
  }
  const d = raw as Record<string, unknown>;
  return {
    listening: Boolean(d.listening),
    hasToken: Boolean(d.hasToken),
    connected: Boolean(d.connected),
    runtimeConnected: Boolean(d.runtimeConnected),
    lastError: (d.lastError as string | null) ?? null,
    port: Number(d.port || 7331),
    tokenPath: String(d.tokenPath || ''),
  };
}

class TnfBrowserServiceClass extends EventEmitter<TnfBrowserEvent> {
  private lastStatus: TnfBrowserStatus | null = null;

  getStatusSnapshot(): TnfBrowserStatus | null {
    return this.lastStatus;
  }

  async status(): Promise<TnfBrowserStatus> {
    try {
      if (isTauriRuntime()) {
        const raw = await invoke<TauriStatus>('tnf_browser_status');
        this.lastStatus = normalizeStatus(raw);
      } else {
        const raw = await fetchJson<Record<string, unknown>>('/status');
        this.lastStatus = normalizeStatus(raw);
      }
      this.emit('status', this.lastStatus);
      return this.lastStatus;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit('error', message);
      throw error;
    }
  }

  async connect(): Promise<boolean> {
    try {
      if (isTauriRuntime()) {
        await invoke('tnf_browser_connect');
      } else {
        await fetchJson('/connect', { method: 'POST', body: '{}' });
      }
      const status = await this.status();
      this.emit('connected', status);
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.emit('error', message);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (isTauriRuntime()) {
      await invoke('tnf_browser_disconnect');
    } else {
      await fetchJson('/disconnect', { method: 'POST', body: '{}' });
    }
    this.emit('disconnected');
    await this.status().catch(() => undefined);
  }

  async startRuntime(): Promise<{ ok: boolean; message: string }> {
    if (isTauriRuntime()) {
      // Spawn via shell through existing execute_command when Tauri is available.
      const { open } = await import('@tauri-apps/plugin-shell');
      // Prefer documenting CLI when shell-open of a node process is unsafe.
      void open;
      return {
        ok: false,
        message: 'Start TNF Browser from a terminal: node packages/tnf-browser/bin/cli.js start',
      };
    }
    return fetchJson<{ ok: boolean; message: string }>('/start', {
      method: 'POST',
      body: '{}',
    });
  }

  async command<T = unknown>(
    action: string,
    params: Record<string, unknown> = {},
    tabId?: number | null
  ): Promise<T> {
    if (isTauriRuntime()) {
      return invoke<T>('tnf_browser_command', {
        action,
        params,
        tabId: tabId ?? null,
      });
    }
    const data = await fetchJson<{ ok: boolean; result: T }>('/command', {
      method: 'POST',
      body: JSON.stringify({ action, params, tabId: tabId ?? null }),
    });
    return data.result;
  }

  async navigate(url: string, tabId?: number | null) {
    return this.command('tabs.navigate', { url }, tabId);
  }

  async listTabs(): Promise<TnfBrowserTab[]> {
    const tabs = await this.command<TnfBrowserTab[]>('tabs.list', {});
    return Array.isArray(tabs) ? tabs : [];
  }

  async reload(tabId?: number | null) {
    return this.command('tabs.reload', {}, tabId);
  }

  async screenshot(fullPage = false, tabId?: number | null) {
    return this.command<{ dataUrl?: string }>('tabs.screenshot', { fullPage }, tabId);
  }

  async discover(tabId?: number | null) {
    return this.command<{
      elements?: TnfDiscoveredElement[];
      cursor?: unknown;
      viewport?: unknown;
      scrollY?: number;
    }>('dom.discoverElements', {}, tabId);
  }

  async getHtml(tabId?: number | null) {
    return this.command<{ html?: string; title?: string; url?: string }>('dom.getHTML', {}, tabId);
  }

  async click(selectorOrHandle: string, tabId?: number | null) {
    const params = selectorOrHandle.startsWith('el_')
      ? { handleId: selectorOrHandle }
      : { selector: selectorOrHandle };
    return this.command('dom.click', params, tabId);
  }

  async type(text: string, selectorOrHandle?: string, tabId?: number | null) {
    const params: Record<string, unknown> = { text };
    if (selectorOrHandle) {
      if (selectorOrHandle.startsWith('el_')) params.handleId = selectorOrHandle;
      else params.selector = selectorOrHandle;
    }
    return this.command('dom.type', params, tabId);
  }
}

const TnfBrowserService = new TnfBrowserServiceClass();
export default TnfBrowserService;
