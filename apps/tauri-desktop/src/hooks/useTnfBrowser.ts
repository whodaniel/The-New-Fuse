import { useCallback, useEffect, useRef, useState } from 'react';
import TnfBrowserService, {
  type TnfBrowserStartResult,
  type TnfBrowserStatus,
  type TnfBrowserTab,
  type TnfDiscoveredElement,
} from '../services/TnfBrowserService';

export interface TnfBrowserHookState {
  status: TnfBrowserStatus | null;
  connecting: boolean;
  busy: string | null;
  lastError: string | null;
  currentUrl: string;
  currentTitle: string;
  tabs: TnfBrowserTab[];
  discovered: TnfDiscoveredElement[];
  lastScreenshot: string | null;
  htmlPreview: string | null;
  /** True length of the last fetched HTML, which may exceed the preview. */
  htmlLength: number;
  activityLog: string[];
  starting: boolean;
  startResult: TnfBrowserStartResult | null;
}

const INITIAL: TnfBrowserHookState = {
  status: null,
  connecting: false,
  busy: null,
  lastError: null,
  currentUrl: '',
  currentTitle: '',
  tabs: [],
  discovered: [],
  lastScreenshot: null,
  htmlPreview: null,
  htmlLength: 0,
  activityLog: [],
  starting: false,
  startResult: null,
};

/** Debounce window for coalescing navigation bursts before refreshing tabs + preview. */
const SETTLE_MS = 400;

/** Characters of page HTML kept for display. `htmlLength` reports the true size. */
const HTML_PREVIEW_CHARS = 20000;

function pushLog(prev: string[], line: string): string[] {
  return [`[${new Date().toLocaleTimeString()}] ${line}`, ...prev].slice(0, 80);
}

export function useTnfBrowser() {
  const [state, setState] = useState<TnfBrowserHookState>(INITIAL);

  const appendLog = useCallback((line: string) => {
    setState((prev) => ({ ...prev, activityLog: pushLog(prev.activityLog, line) }));
  }, []);

  const refreshStatus = useCallback(async () => {
    try {
      const status = await TnfBrowserService.status();
      setState((prev) => ({
        ...prev,
        status,
        lastError: status.lastError,
      }));
      return status;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, lastError: message }));
      return null;
    }
  }, []);

  const refreshTabs = useCallback(async () => {
    if (!TnfBrowserService.getStatusSnapshot()?.connected) return [];
    try {
      const tabs = await TnfBrowserService.listTabs();
      const active = tabs.find((tab) => tab.active) || tabs[0];
      setState((prev) => ({
        ...prev,
        tabs,
        currentUrl: active?.url || prev.currentUrl,
        currentTitle: active?.title || prev.currentTitle,
      }));
      return tabs;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, lastError: message }));
      appendLog(`Tabs error: ${message}`);
      return [];
    }
  }, [appendLog]);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, lastError: null }));
    appendLog('Connecting to TNF Browser (:7331)...');
    try {
      await TnfBrowserService.connect();
      const status = await refreshStatus();
      setState((prev) => ({ ...prev, connecting: false, status }));
      appendLog('Connected to TNF Browser');
      await refreshTabs();
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, connecting: false, lastError: message }));
      appendLog(`Connect failed: ${message}`);
      return false;
    }
  }, [appendLog, refreshStatus, refreshTabs]);

  const disconnect = useCallback(async () => {
    await TnfBrowserService.disconnect();
    appendLog('Disconnected from TNF Browser');
    await refreshStatus();
  }, [appendLog, refreshStatus]);

  const startRuntime = useCallback(async () => {
    appendLog('Requesting TNF Browser start...');
    setState((prev) => ({ ...prev, starting: true, startResult: null }));
    try {
      const result = await TnfBrowserService.startRuntime();
      appendLog(result.message);
      setState((prev) => ({ ...prev, starting: false, startResult: result }));
      // The runtime opens Chromium before binding :7331 — poll past the cold start.
      [1500, 4000, 8000].forEach((delay) =>
        setTimeout(() => {
          void refreshStatus();
        }, delay)
      );
      return result;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      const result = {
        ok: false,
        message,
        command: 'node packages/tnf-browser/bin/cli.js start',
      };
      appendLog(`Start failed: ${message}`);
      setState((prev) => ({ ...prev, starting: false, startResult: result }));
      return result;
    }
  }, [appendLog, refreshStatus]);

  const run = useCallback(
    async <T>(label: string, action: () => Promise<T>): Promise<T | null> => {
      setState((prev) => ({ ...prev, busy: label, lastError: null }));
      try {
        const result = await action();
        setState((prev) => ({ ...prev, busy: null }));
        return result;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        setState((prev) => ({ ...prev, busy: null, lastError: message }));
        appendLog(`${label} failed: ${message}`);
        return null;
      }
    },
    [appendLog]
  );

  /** Quiet preview refresh — no busy lock, no activity spam, keeps prior shot on failure. */
  const recapturePreview = useCallback(async () => {
    if (!TnfBrowserService.getStatusSnapshot()?.connected) return;
    try {
      const result = await TnfBrowserService.screenshot(false);
      if (result?.dataUrl) {
        setState((prev) => ({ ...prev, lastScreenshot: result.dataUrl || null }));
      }
    } catch {
      /* keep previous preview */
    }
  }, []);

  /**
   * Single settle debouncer shared by event-driven navigation (urlChanged) and
   * commands that may not emit one (same-URL reload). Coalesces SPA bursts into
   * one tabs.list + one quiet recapture, and is cleared on unmount.
   */
  const settleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleSettle = useCallback(() => {
    if (settleTimer.current) clearTimeout(settleTimer.current);
    settleTimer.current = setTimeout(() => {
      settleTimer.current = null;
      void refreshTabs();
      void recapturePreview();
    }, SETTLE_MS);
  }, [recapturePreview, refreshTabs]);

  useEffect(
    () => () => {
      if (settleTimer.current) clearTimeout(settleTimer.current);
      settleTimer.current = null;
    },
    []
  );

  const navigate = useCallback(
    async (url: string, tabId?: number | null) => {
      appendLog(`Navigate → ${url}`);
      const result = await run('navigate', () => TnfBrowserService.navigate(url, tabId));
      setState((prev) => ({
        ...prev,
        currentUrl: url,
      }));
      await refreshTabs();
      // Preview refresh comes from debounced urlChanged settle.
      return result;
    },
    [appendLog, refreshTabs, run]
  );

  const reload = useCallback(
    async (tabId?: number | null) => {
      appendLog('Reload');
      await run('reload', () => TnfBrowserService.reload(tabId));
      await refreshTabs();
      // Same-URL reload may not emit urlChanged — settle covers it either way.
      scheduleSettle();
    },
    [appendLog, refreshTabs, run, scheduleSettle]
  );

  const goBack = useCallback(
    async (tabId?: number | null) => {
      appendLog('Back');
      await run('back', () => TnfBrowserService.goBack(tabId));
      await refreshTabs();
      // Hash-only history entries may not emit urlChanged.
      scheduleSettle();
    },
    [appendLog, refreshTabs, run, scheduleSettle]
  );

  const goForward = useCallback(
    async (tabId?: number | null) => {
      appendLog('Forward');
      await run('forward', () => TnfBrowserService.goForward(tabId));
      await refreshTabs();
      // Hash-only history entries may not emit urlChanged.
      scheduleSettle();
    },
    [appendLog, refreshTabs, run, scheduleSettle]
  );

  const createTab = useCallback(
    async (url?: string) => {
      appendLog(url ? `Create tab → ${url}` : 'Create tab');
      const result = await run('createTab', () => TnfBrowserService.createTab(url));
      await refreshTabs();
      return result;
    },
    [appendLog, refreshTabs, run]
  );

  const closeTab = useCallback(
    async (tabId: number) => {
      appendLog(`Close tab ${tabId}`);
      await run('closeTab', () => TnfBrowserService.closeTab(tabId));
      await refreshTabs();
    },
    [appendLog, refreshTabs, run]
  );

  const activateTab = useCallback(
    async (tabId: number) => {
      appendLog(`Activate tab ${tabId}`);
      await run('activateTab', () => TnfBrowserService.activateTab(tabId));
      await refreshTabs();
      void recapturePreview();
    },
    [appendLog, recapturePreview, refreshTabs, run]
  );

  const takeScreenshot = useCallback(async () => {
    appendLog('Screenshot');
    const result = await run('screenshot', () => TnfBrowserService.screenshot(false));
    if (result?.dataUrl) {
      setState((prev) => ({ ...prev, lastScreenshot: result.dataUrl || null }));
      appendLog('Screenshot captured');
    }
    return result;
  }, [appendLog, run]);

  const discover = useCallback(async () => {
    appendLog('Discover interactive elements');
    const result = await run('discover', () => TnfBrowserService.discover());
    const elements = result?.elements || [];
    setState((prev) => ({ ...prev, discovered: elements }));
    appendLog(`Discovered ${elements.length} elements`);
    return result;
  }, [appendLog, run]);

  const readHtml = useCallback(async () => {
    appendLog('Read page HTML');
    const result = await run('html', () => TnfBrowserService.getHtml());
    if (result) {
      const html = result.html || '';
      setState((prev) => ({
        ...prev,
        htmlPreview: html.slice(0, HTML_PREVIEW_CHARS),
        htmlLength: html.length,
        currentTitle: result.title || prev.currentTitle,
        currentUrl: result.url || prev.currentUrl,
      }));
      appendLog(
        html.length > HTML_PREVIEW_CHARS
          ? `HTML ${html.length.toLocaleString()} chars (showing first ${HTML_PREVIEW_CHARS.toLocaleString()})`
          : `HTML ${html.length.toLocaleString()} chars`
      );
    }
    return result;
  }, [appendLog, run]);

  /**
   * Fetch the full document without storing it in state — the display preview is
   * capped, so "copy what you see" would silently hand back a truncated page.
   */
  const readFullHtml = useCallback(async () => {
    const result = await run('html', () => TnfBrowserService.getHtml());
    const html = result?.html || '';
    appendLog(`Copied full HTML (${html.length.toLocaleString()} chars)`);
    return html;
  }, [appendLog, run]);

  const click = useCallback(
    async (selectorOrHandle: string) => {
      appendLog(`Click ${selectorOrHandle}`);
      return run('click', () => TnfBrowserService.click(selectorOrHandle));
    },
    [appendLog, run]
  );

  const typeText = useCallback(
    async (text: string, selectorOrHandle?: string) => {
      appendLog(selectorOrHandle ? `Type into ${selectorOrHandle}` : `Type ${text.slice(0, 40)}`);
      return run('type', () => TnfBrowserService.type(text, selectorOrHandle));
    },
    [appendLog, run]
  );

  const keyPress = useCallback(
    async (key: string) => {
      appendLog(`Key ${key}`);
      return run('keyPress', () => TnfBrowserService.keyPress(key));
    },
    [appendLog, run]
  );

  useEffect(() => {
    void refreshStatus();
    const timer = setInterval(() => {
      void refreshStatus();
    }, 8000);
    return () => clearInterval(timer);
  }, [refreshStatus]);

  useEffect(() => {
    let disposed = false;
    let unsubscribeEvents: (() => void) | undefined;
    let offUrl: (() => void) | undefined;
    let offRuntime: (() => void) | undefined;

    void (async () => {
      unsubscribeEvents = await TnfBrowserService.subscribeEvents();
      if (disposed) {
        unsubscribeEvents();
        return;
      }

      offUrl = TnfBrowserService.on<{ tabId?: number; url?: string }>('urlChanged', (data) => {
        const nextUrl = data?.url ? String(data.url) : '';
        setState((prev) => ({
          ...prev,
          currentUrl: nextUrl || prev.currentUrl,
          // Keep prior screenshot until debounced recapture lands.
          activityLog: pushLog(
            prev.activityLog,
            nextUrl ? `URL changed → ${nextUrl}` : 'URL changed'
          ),
        }));
        scheduleSettle();
      });

      offRuntime = TnfBrowserService.on<{ connected?: boolean }>('runtime', (data) => {
        appendLog(data?.connected ? 'Extension connected' : 'Extension disconnected');
        void refreshStatus();
        if (data?.connected) void refreshTabs();
      });
    })();

    return () => {
      disposed = true;
      offUrl?.();
      offRuntime?.();
      unsubscribeEvents?.();
    };
  }, [appendLog, refreshStatus, refreshTabs, scheduleSettle]);

  return {
    state,
    connect,
    disconnect,
    startRuntime,
    refreshStatus,
    refreshTabs,
    navigate,
    reload,
    goBack,
    goForward,
    createTab,
    closeTab,
    activateTab,
    takeScreenshot,
    discover,
    readHtml,
    readFullHtml,
    click,
    typeText,
    keyPress,
  };
}
