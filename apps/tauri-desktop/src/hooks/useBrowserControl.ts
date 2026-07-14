import { useCallback, useEffect, useState } from 'react';
import BrowserControlService, { type BrowserControlEvent } from '../services/BrowserControlService';
import { useSettingsStore } from '../stores/settingsStore';

export interface BrowserControlState {
  relayConnected: boolean;
  extensionConnected: boolean;
  connecting: boolean;
  lastError: string | null;
  currentUrl: string;
  currentTitle: string;
  tabs: Array<{ id: number; title: string; url: string; active?: boolean }>;
  lastScreenshot: string | null;
  sessionActive: boolean;
  activityLog: string[];
}

const INITIAL_STATE: BrowserControlState = {
  relayConnected: false,
  extensionConnected: false,
  connecting: false,
  lastError: null,
  currentUrl: '',
  currentTitle: '',
  tabs: [],
  lastScreenshot: null,
  sessionActive: false,
  activityLog: [],
};

function pushLog(prev: string[], line: string): string[] {
  const next = [`[${new Date().toLocaleTimeString()}] ${line}`, ...prev];
  return next.slice(0, 80);
}

export function useBrowserControl() {
  const { environment } = useSettingsStore();
  const [state, setState] = useState<BrowserControlState>(INITIAL_STATE);

  const appendLog = useCallback((line: string) => {
    setState((prev) => ({ ...prev, activityLog: pushLog(prev.activityLog, line) }));
  }, []);

  const refreshTabs = useCallback(async () => {
    if (!BrowserControlService.isConnected()) return;
    try {
      const result = await BrowserControlService.listTabs();
      setState((prev) => ({
        ...prev,
        tabs: (result.tabs || []).map((tab) => ({
          id: tab.id,
          title: tab.title || tab.url,
          url: tab.url,
          active: tab.active,
        })),
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({ ...prev, lastError: message }));
    }
  }, []);

  const refreshCurrentUrl = useCallback(async () => {
    if (!BrowserControlService.isConnected()) return;
    try {
      const result = await BrowserControlService.getCurrentUrl();
      setState((prev) => ({
        ...prev,
        currentUrl: result.url || prev.currentUrl,
        currentTitle: result.title || prev.currentTitle,
      }));
    } catch {
      // Extension may be offline; keep last known URL.
    }
  }, []);

  const connect = useCallback(async () => {
    setState((prev) => ({ ...prev, connecting: true, lastError: null }));
    appendLog('Connecting to TNF relay...');
    try {
      const ok = await BrowserControlService.connect();
      setState((prev) => ({
        ...prev,
        relayConnected: ok,
        extensionConnected: BrowserControlService.isExtensionConnected(),
        connecting: false,
        lastError: ok ? null : 'Relay connection failed',
      }));
      if (ok) {
        appendLog('Relay connected');
        await refreshTabs();
        await refreshCurrentUrl();
      }
      return ok;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setState((prev) => ({
        ...prev,
        connecting: false,
        relayConnected: false,
        lastError: message,
      }));
      appendLog(`Relay error: ${message}`);
      return false;
    }
  }, [appendLog, refreshCurrentUrl, refreshTabs]);

  useEffect(() => {
    const handlers: Array<[BrowserControlEvent, (...args: unknown[]) => void]> = [
      [
        'connected',
        () => {
          setState((prev) => ({ ...prev, relayConnected: true, connecting: false }));
          appendLog('Relay socket open');
        },
      ],
      [
        'disconnected',
        () => {
          setState((prev) => ({
            ...prev,
            relayConnected: false,
            extensionConnected: false,
          }));
          appendLog('Relay disconnected');
        },
      ],
      [
        'extension_connected',
        () => {
          setState((prev) => ({ ...prev, extensionConnected: true }));
          appendLog('Chrome extension connected');
          void refreshTabs();
        },
      ],
      [
        'extension_disconnected',
        () => {
          setState((prev) => ({ ...prev, extensionConnected: false }));
          appendLog('Chrome extension disconnected');
        },
      ],
      [
        'error',
        (error) => {
          const message = error instanceof Error ? error.message : String(error);
          setState((prev) => ({ ...prev, lastError: message }));
          appendLog(`Error: ${message}`);
        },
      ],
      [
        'screenshot',
        (payload) => {
          const dataUrl =
            payload && typeof payload === 'object' && 'dataUrl' in payload
              ? String((payload as { dataUrl?: string }).dataUrl || '')
              : '';
          if (dataUrl) {
            setState((prev) => ({ ...prev, lastScreenshot: dataUrl }));
            appendLog('Screenshot captured');
          }
        },
      ],
    ];

    for (const [event, handler] of handlers) {
      BrowserControlService.on(event, handler);
    }

    if (BrowserControlService.isConnected()) {
      setState((prev) => ({
        ...prev,
        relayConnected: true,
        extensionConnected: BrowserControlService.isExtensionConnected(),
        connecting: false,
      }));
      void refreshTabs();
      void refreshCurrentUrl();
    } else {
      void connect();
    }

    return () => {
      for (const [event, handler] of handlers) {
        BrowserControlService.off(event, handler);
      }
    };
  }, [appendLog, connect, environment, refreshTabs]);

  const navigate = useCallback(
    async (url: string) => {
      appendLog(`Navigate → ${url}`);
      if (!BrowserControlService.isExtensionConnected()) {
        setState((prev) => ({ ...prev, currentUrl: url }));
        return { mode: 'preview' as const, url };
      }
      const result = await BrowserControlService.navigate(url);
      setState((prev) => ({
        ...prev,
        currentUrl: result.url || url,
        currentTitle: result.title || prev.currentTitle,
      }));
      await refreshTabs();
      return { mode: 'extension' as const, ...result };
    },
    [appendLog, refreshTabs]
  );

  const goBack = useCallback(async () => {
    appendLog('Go back');
    await BrowserControlService.goBack();
    await refreshCurrentUrl();
  }, [appendLog, refreshCurrentUrl]);

  const goForward = useCallback(async () => {
    appendLog('Go forward');
    await BrowserControlService.goForward();
    await refreshCurrentUrl();
  }, [appendLog, refreshCurrentUrl]);

  const refresh = useCallback(async () => {
    appendLog('Refresh page');
    await BrowserControlService.refresh();
    await refreshCurrentUrl();
  }, [appendLog, refreshCurrentUrl]);

  const takeScreenshot = useCallback(async () => {
    appendLog('Capture screenshot');
    const result = await BrowserControlService.takeScreenshot({ fullPage: false });
    if (result?.dataUrl) {
      setState((prev) => ({ ...prev, lastScreenshot: result.dataUrl ?? null }));
    }
    return result;
  }, [appendLog]);

  const analyzePage = useCallback(async () => {
    appendLog('Analyze page');
    return BrowserControlService.analyzePage();
  }, [appendLog]);

  const startSession = useCallback(async () => {
    appendLog('Start browser control session');
    const result = await BrowserControlService.startSession({
      recordSession: true,
      showOverlay: true,
    });
    setState((prev) => ({ ...prev, sessionActive: true }));
    return result;
  }, [appendLog]);

  const endSession = useCallback(async () => {
    appendLog('End browser control session');
    await BrowserControlService.endSession();
    setState((prev) => ({ ...prev, sessionActive: false }));
  }, [appendLog]);

  const openNative = useCallback(
    async (url: string) => {
      appendLog(`Open native → ${url}`);
      const { open } = await import('@tauri-apps/plugin-shell');
      await open(url);
    },
    [appendLog]
  );

  return {
    state,
    connect,
    navigate,
    goBack,
    goForward,
    refresh,
    takeScreenshot,
    analyzePage,
    startSession,
    endSession,
    openNative,
    refreshTabs,
    refreshCurrentUrl,
    service: BrowserControlService,
  };
}
