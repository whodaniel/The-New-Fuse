/**
 * Browser-automation parity layer for Fuse Connect.
 *
 * Gives TNF's backend/agents the same "in Chrome" capabilities
 * claude-in-chrome has, against the user's own real, logged-in Chrome
 * session — which is the whole reason to build this here rather than route
 * through packages/tnf-browser (a separate tool that drives its own
 * dedicated, logged-out browser instance).
 *
 * A single entry point, `executeBrowserAction()`, covers both:
 *  - capabilities that already existed in this extension's content script
 *    but had no caller anywhere (click/type by element ref, human-like
 *    interaction, CAPTCHA handling, accessibility-tree reading) — this
 *    module is that caller;
 *  - capabilities that didn't exist at all before this file (navigate,
 *    screenshot, arbitrary JS eval, console log reading, network request
 *    reading, window resize, generic tab management, page text
 *    extraction).
 *
 * Every action that needs the page (click, type, read text/console/tree) is
 * dispatched to the content script via chrome.tabs.sendMessage — the exact
 * pattern already proven end-to-end by INJECT_MESSAGE
 * (background/index.ts's injectMessageToActiveTab/injectMessageToTab).
 * Actions that are purely extension/browser-level (navigate, screenshot,
 * eval, network, resize, tabs) never touch the content script at all.
 */

export interface BrowserActionRequest {
  action: string;
  /** Defaults to the active tab in the current window when omitted. */
  tabId?: number;
  params?: Record<string, unknown>;
}

export interface BrowserActionResult {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface NetworkLogEntry {
  requestId: string;
  url: string;
  method: string;
  type: string;
  statusCode?: number;
  timeStamp: number;
}

const MAX_NETWORK_LOG_ENTRIES_PER_TAB = 200;

/**
 * Content-script actions this module forwards verbatim — see
 * content/index.ts's message switch for each handler's implementation.
 * Listed once here so the mapping between a public action name and its
 * content-script message type is visible in one place, since they're
 * intentionally not always identical strings.
 */
const CONTENT_SCRIPT_ACTIONS: Record<string, string> = {
  click: 'CLICK_ELEMENT',
  type: 'TYPE_INTO_ELEMENT',
  getElementByRef: 'GET_ELEMENT_BY_REF',
  readAccessibilityTree: 'GET_ACCESSIBILITY_TREE',
  humanType: 'HUMAN_TYPE',
  humanClick: 'HUMAN_CLICK',
  humanScroll: 'HUMAN_SCROLL',
  detectCaptcha: 'DETECT_CAPTCHA',
  bypassCaptcha: 'BYPASS_CAPTCHA',
  waitForCaptcha: 'WAIT_FOR_CAPTCHA',
  getConsoleLogs: 'GET_CONSOLE_LOGS',
  getPageText: 'GET_PAGE_TEXT',
};

export class BrowserAutomation {
  private networkLogs = new Map<number, NetworkLogEntry[]>();
  private networkListenersInstalled = false;

  /**
   * Registers webRequest listeners once. The `webRequest` permission is
   * already declared in manifest.json — it was simply never wired to any
   * listener before this. Call once at background service-worker startup.
   */
  installNetworkListeners(): void {
    if (this.networkListenersInstalled) return;
    this.networkListenersInstalled = true;

    chrome.webRequest.onBeforeRequest.addListener(
      (details) => {
        if (details.tabId < 0) return; // not associated with a tab
        this.pushNetworkLog(details.tabId, {
          requestId: details.requestId,
          url: details.url,
          method: details.method,
          type: details.type,
          timeStamp: details.timeStamp,
        });
      },
      { urls: ['<all_urls>'] }
    );

    chrome.webRequest.onCompleted.addListener(
      (details) => {
        if (details.tabId < 0) return;
        const log = this.networkLogs.get(details.tabId);
        const entry = log?.find((e) => e.requestId === details.requestId);
        if (entry) entry.statusCode = details.statusCode;
      },
      { urls: ['<all_urls>'] }
    );

    chrome.tabs.onRemoved.addListener((tabId) => {
      this.networkLogs.delete(tabId);
    });
  }

  private pushNetworkLog(tabId: number, entry: NetworkLogEntry): void {
    const log = this.networkLogs.get(tabId) ?? [];
    log.push(entry);
    if (log.length > MAX_NETWORK_LOG_ENTRIES_PER_TAB) {
      log.splice(0, log.length - MAX_NETWORK_LOG_ENTRIES_PER_TAB);
    }
    this.networkLogs.set(tabId, log);
  }

  private async resolveTabId(explicit?: number): Promise<number> {
    if (typeof explicit === 'number') return explicit;
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) throw new Error('No active tab available');
    return tab.id;
  }

  async executeBrowserAction(request: BrowserActionRequest): Promise<BrowserActionResult> {
    try {
      const contentScriptType = CONTENT_SCRIPT_ACTIONS[request.action];
      if (contentScriptType) {
        const tabId = await this.resolveTabId(request.tabId);
        const response = await chrome.tabs.sendMessage(tabId, {
          type: contentScriptType,
          ...(request.params || {}),
        });
        return { success: response?.success !== false, data: response };
      }

      switch (request.action) {
        case 'navigate': {
          const url = String(request.params?.url || '');
          if (!url) throw new Error('navigate requires params.url');
          const tabId = await this.resolveTabId(request.tabId);
          await chrome.tabs.update(tabId, { url });
          return { success: true, data: { tabId, url } };
        }

        case 'goBack': {
          const tabId = await this.resolveTabId(request.tabId);
          await chrome.tabs.goBack(tabId);
          return { success: true, data: { tabId } };
        }

        case 'goForward': {
          const tabId = await this.resolveTabId(request.tabId);
          await chrome.tabs.goForward(tabId);
          return { success: true, data: { tabId } };
        }

        case 'reload': {
          const tabId = await this.resolveTabId(request.tabId);
          await chrome.tabs.reload(tabId);
          return { success: true, data: { tabId } };
        }

        case 'screenshot': {
          const tabId = await this.resolveTabId(request.tabId);
          const tab = await chrome.tabs.get(tabId);
          if (typeof tab.windowId !== 'number') {
            throw new Error(`Tab ${tabId} has no window`);
          }
          const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
          return { success: true, data: { dataUrl } };
        }

        case 'executeJs': {
          const code = String(request.params?.code || '');
          if (!code) throw new Error('executeJs requires params.code');
          const tabId = await this.resolveTabId(request.tabId);
          const [injection] = await chrome.scripting.executeScript({
            target: { tabId },
            world: 'MAIN',
            func: (source: string) => {
              // eslint-disable-next-line no-eval
              return (0, eval)(source);
            },
            args: [code],
          });
          return { success: true, data: { result: injection?.result } };
        }

        case 'getNetworkRequests': {
          const tabId = await this.resolveTabId(request.tabId);
          const urlPattern = request.params?.urlPattern as string | undefined;
          const limit = (request.params?.limit as number | undefined) ?? 100;
          let log = this.networkLogs.get(tabId) ?? [];
          if (urlPattern) {
            log = log.filter((entry) => entry.url.includes(urlPattern));
          }
          return { success: true, data: { requests: log.slice(-limit) } };
        }

        case 'resizeWindow': {
          const width = Number(request.params?.width);
          const height = Number(request.params?.height);
          if (!Number.isFinite(width) || !Number.isFinite(height)) {
            throw new Error('resizeWindow requires numeric params.width and params.height');
          }
          const tabId = await this.resolveTabId(request.tabId);
          const tab = await chrome.tabs.get(tabId);
          if (typeof tab.windowId !== 'number') {
            throw new Error(`Tab ${tabId} has no window`);
          }
          await chrome.windows.update(tab.windowId, { width, height });
          return { success: true, data: { windowId: tab.windowId, width, height } };
        }

        case 'listTabs': {
          const tabs = await chrome.tabs.query({});
          return {
            success: true,
            data: {
              tabs: tabs.map((tab) => ({
                id: tab.id,
                url: tab.url,
                title: tab.title,
                active: tab.active,
                windowId: tab.windowId,
              })),
            },
          };
        }

        case 'newTab': {
          const url = request.params?.url as string | undefined;
          const tab = await chrome.tabs.create({ url });
          return { success: true, data: { tabId: tab.id } };
        }

        case 'closeTab': {
          const tabId = await this.resolveTabId(request.tabId);
          await chrome.tabs.remove(tabId);
          return { success: true, data: { tabId } };
        }

        default:
          return { success: false, error: `Unknown browser action: '${request.action}'` };
      }
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : String(error) };
    }
  }
}

export const browserAutomation = new BrowserAutomation();
