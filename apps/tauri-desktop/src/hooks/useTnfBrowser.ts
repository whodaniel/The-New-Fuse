import { useCallback, useEffect, useState } from 'react';
import TnfBrowserService, {
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
  activityLog: string[];
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
  activityLog: [],
};

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
    const result = await TnfBrowserService.startRuntime();
    appendLog(result.message);
    setTimeout(() => {
      void refreshStatus();
    }, 1500);
    return result;
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

  const navigate = useCallback(
    async (url: string) => {
      appendLog(`Navigate → ${url}`);
      const result = await run('navigate', () => TnfBrowserService.navigate(url));
      setState((prev) => ({ ...prev, currentUrl: url }));
      await refreshTabs();
      return result;
    },
    [appendLog, refreshTabs, run]
  );

  const reload = useCallback(async () => {
    appendLog('Reload');
    await run('reload', () => TnfBrowserService.reload());
    await refreshTabs();
  }, [appendLog, refreshTabs, run]);

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
      setState((prev) => ({
        ...prev,
        htmlPreview: (result.html || '').slice(0, 4000),
        currentTitle: result.title || prev.currentTitle,
        currentUrl: result.url || prev.currentUrl,
      }));
    }
    return result;
  }, [appendLog, run]);

  const click = useCallback(
    async (selectorOrHandle: string) => {
      appendLog(`Click ${selectorOrHandle}`);
      return run('click', () => TnfBrowserService.click(selectorOrHandle));
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

  return {
    state,
    connect,
    disconnect,
    startRuntime,
    refreshStatus,
    refreshTabs,
    navigate,
    reload,
    takeScreenshot,
    discover,
    readHtml,
    click,
  };
}
