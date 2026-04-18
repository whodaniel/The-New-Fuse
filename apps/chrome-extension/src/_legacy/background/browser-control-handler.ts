/**
 * Browser Control Handler for TNF Chrome Extension
 *
 * Handles incoming browser control commands from the TNF Relay,
 * enabling any local AI agent to control websites through the extension.
 *
 * This module extends the existing TNFRelayConnection with full browser
 * automation capabilities.
 */

import { Logger } from '../utils/logger';
import { screenRecordingService } from './screen-recording';
import { web3Interceptor } from './web3-interceptor';

// ============================================================================
// MESSAGE TYPES (Must match protocol.ts in shared package)
// ============================================================================

export enum BrowserControlMessageType {
  // Navigation
  NAVIGATE = 'NAVIGATE',
  NAVIGATE_RESULT = 'NAVIGATE_RESULT',
  GO_BACK = 'GO_BACK',
  GO_FORWARD = 'GO_FORWARD',
  REFRESH = 'REFRESH',
  GET_CURRENT_URL = 'GET_CURRENT_URL',
  GET_CURRENT_URL_RESULT = 'GET_CURRENT_URL_RESULT',

  // Page Analysis
  ANALYZE_PAGE = 'ANALYZE_PAGE',
  ANALYZE_PAGE_RESULT = 'ANALYZE_PAGE_RESULT',
  GET_PAGE_CONTENT = 'GET_PAGE_CONTENT',
  GET_PAGE_CONTENT_RESULT = 'GET_PAGE_CONTENT_RESULT',
  GET_DOM_SNAPSHOT = 'GET_DOM_SNAPSHOT',
  GET_DOM_SNAPSHOT_RESULT = 'GET_DOM_SNAPSHOT_RESULT',
  FIND_ELEMENTS = 'FIND_ELEMENTS',
  FIND_ELEMENTS_RESULT = 'FIND_ELEMENTS_RESULT',

  // Element Interaction
  CLICK = 'CLICK',
  CLICK_RESULT = 'CLICK_RESULT',
  TYPE = 'TYPE',
  TYPE_RESULT = 'TYPE_RESULT',
  SCROLL = 'SCROLL',
  SCROLL_RESULT = 'SCROLL_RESULT',
  HOVER = 'HOVER',
  HOVER_RESULT = 'HOVER_RESULT',
  FOCUS = 'FOCUS',
  FOCUS_RESULT = 'FOCUS_RESULT',

  // Chat Interface
  DETECT_CHAT_ELEMENTS = 'DETECT_CHAT_ELEMENTS',
  DETECT_CHAT_ELEMENTS_RESULT = 'DETECT_CHAT_ELEMENTS_RESULT',
  SEND_CHAT_MESSAGE = 'SEND_CHAT_MESSAGE',
  SEND_CHAT_MESSAGE_RESULT = 'SEND_CHAT_MESSAGE_RESULT',
  GET_CHAT_MESSAGES = 'GET_CHAT_MESSAGES',
  GET_CHAT_MESSAGES_RESULT = 'GET_CHAT_MESSAGES_RESULT',
  WAIT_FOR_RESPONSE = 'WAIT_FOR_RESPONSE',
  CHAT_RESPONSE_RECEIVED = 'CHAT_RESPONSE_RECEIVED',

  // Screenshots & Recording
  TAKE_SCREENSHOT = 'TAKE_SCREENSHOT',
  TAKE_SCREENSHOT_RESULT = 'TAKE_SCREENSHOT_RESULT',
  START_RECORDING = 'START_RECORDING',
  START_RECORDING_RESULT = 'START_RECORDING_RESULT',
  STOP_RECORDING = 'STOP_RECORDING',
  STOP_RECORDING_RESULT = 'STOP_RECORDING_RESULT',
  GET_RECORDING_STATUS = 'GET_RECORDING_STATUS',
  GET_RECORDING_STATUS_RESULT = 'GET_RECORDING_STATUS_RESULT',

  // Tab Management
  NEW_TAB = 'NEW_TAB',
  NEW_TAB_RESULT = 'NEW_TAB_RESULT',
  CLOSE_TAB = 'CLOSE_TAB',
  SWITCH_TAB = 'SWITCH_TAB',
  LIST_TABS = 'LIST_TABS',
  LIST_TABS_RESULT = 'LIST_TABS_RESULT',

  // Overlay
  SHOW_OVERLAY = 'SHOW_OVERLAY',
  HIDE_OVERLAY = 'HIDE_OVERLAY',
  UPDATE_OVERLAY = 'UPDATE_OVERLAY',

  // Cascade
  CASCADE_START = 'CASCADE_START',
  CASCADE_CANCEL = 'CASCADE_CANCEL',
  CASCADE_STATUS = 'CASCADE_STATUS',
  CASCADE_COMPLETE = 'CASCADE_COMPLETE',

  // Session
  START_SESSION = 'START_SESSION',
  END_SESSION = 'END_SESSION',
  GET_SESSION_STATUS = 'GET_SESSION_STATUS',
  SESSION_STATUS = 'SESSION_STATUS',

  // Errors
  ERROR = 'ERROR',
  NOTIFICATION = 'NOTIFICATION',
}

// ============================================================================
// BROWSER CONTROL HANDLER CLASS
// ============================================================================

export class BrowserControlHandler {
  private logger: Logger;
  private activeCascades: Map<string, CascadeState> = new Map();
  private sessionActive: boolean = false;
  private sessionId: string | null = null;
  private overlayVisible: boolean = false;

  constructor() {
    this.logger = new Logger({
      name: 'BrowserControl',
      level: 'info',
      saveToStorage: true,
    });
  }

  /**
   * Handle incoming browser control message
   */
  async handleMessage(message: any): Promise<any> {
    const { type, payload, id } = message;
    this.logger.info(`Handling browser control message: ${type}`);

    try {
      switch (type) {
        // ─── Navigation ───
        case BrowserControlMessageType.NAVIGATE:
          return await this.handleNavigate(payload);
        case BrowserControlMessageType.GO_BACK:
          return await this.handleGoBack(payload);
        case BrowserControlMessageType.GO_FORWARD:
          return await this.handleGoForward(payload);
        case BrowserControlMessageType.REFRESH:
          return await this.handleRefresh(payload);
        case BrowserControlMessageType.GET_CURRENT_URL:
          return await this.handleGetCurrentUrl(payload);

        // ─── Page Analysis ───
        case BrowserControlMessageType.ANALYZE_PAGE:
          return await this.handleAnalyzePage(payload);
        case BrowserControlMessageType.GET_PAGE_CONTENT:
          return await this.handleGetPageContent(payload);
        case BrowserControlMessageType.GET_DOM_SNAPSHOT:
          return await this.handleGetDOMSnapshot(payload);
        case BrowserControlMessageType.FIND_ELEMENTS:
          return await this.handleFindElements(payload);

        // ─── Element Interaction ───
        case BrowserControlMessageType.CLICK:
          return await this.handleClick(payload);
        case BrowserControlMessageType.TYPE:
          return await this.handleType(payload);
        case BrowserControlMessageType.SCROLL:
          return await this.handleScroll(payload);
        case BrowserControlMessageType.HOVER:
          return await this.handleHover(payload);
        case BrowserControlMessageType.FOCUS:
          return await this.handleFocus(payload);

        // ─── Chat Interface ───
        case BrowserControlMessageType.DETECT_CHAT_ELEMENTS:
          return await this.handleDetectChatElements(payload);
        case BrowserControlMessageType.SEND_CHAT_MESSAGE:
          return await this.handleSendChatMessage(payload);
        case BrowserControlMessageType.GET_CHAT_MESSAGES:
          return await this.handleGetChatMessages(payload);
        case BrowserControlMessageType.WAIT_FOR_RESPONSE:
          return await this.handleWaitForResponse(payload);

        // ─── Screenshots & Recording ───
        case BrowserControlMessageType.TAKE_SCREENSHOT:
          return await this.handleTakeScreenshot(payload);
        case BrowserControlMessageType.START_RECORDING:
          return await this.handleStartRecording(payload);
        case BrowserControlMessageType.STOP_RECORDING:
          return await this.handleStopRecording();
        case BrowserControlMessageType.GET_RECORDING_STATUS:
          return this.handleGetRecordingStatus();

        // ─── Tab Management ───
        case BrowserControlMessageType.NEW_TAB:
          return await this.handleNewTab(payload);
        case BrowserControlMessageType.CLOSE_TAB:
          return await this.handleCloseTab(payload);
        case BrowserControlMessageType.SWITCH_TAB:
          return await this.handleSwitchTab(payload);
        case BrowserControlMessageType.LIST_TABS:
          return await this.handleListTabs();

        // ─── Overlay ───
        case BrowserControlMessageType.SHOW_OVERLAY:
          return await this.handleShowOverlay(payload);
        case BrowserControlMessageType.HIDE_OVERLAY:
          return await this.handleHideOverlay();
        case BrowserControlMessageType.UPDATE_OVERLAY:
          return await this.handleUpdateOverlay(payload);

        // ─── Cascade ───
        case BrowserControlMessageType.CASCADE_START:
          return await this.handleCascadeStart(payload);
        case BrowserControlMessageType.CASCADE_CANCEL:
          return await this.handleCascadeCancel(payload);
        case BrowserControlMessageType.CASCADE_STATUS:
          return await this.handleCascadeStatus(payload);

        // ─── Session ───
        case BrowserControlMessageType.START_SESSION:
          return await this.handleStartSession(payload);
        case BrowserControlMessageType.END_SESSION:
          return await this.handleEndSession();
        case BrowserControlMessageType.GET_SESSION_STATUS:
          return await this.handleGetSessionStatus();

        default:
          this.logger.warn(`Unknown browser control message type: ${type}`);
          return { success: false, error: `Unknown message type: ${type}` };
      }
    } catch (error) {
      this.logger.error(`Error handling ${type}:`, error);
      return { success: false, error: (error as Error).message };
    }
  }

  // ============================================================================
  // NAVIGATION HANDLERS
  // ============================================================================

  private async handleNavigate(payload: any): Promise<any> {
    const { url, tabId, newTab, waitForLoad } = payload;

    // Intercept and resolve Web3 URLs
    const interceptionResult = web3Interceptor.interceptUrl(url);
    const finalUrl = interceptionResult.url;

    // Show notification if Web3 URL was resolved
    if (interceptionResult.wasWeb3 && interceptionResult.protocol && !interceptionResult.error) {
      await web3Interceptor.showNotification(
        interceptionResult.originalUrl!,
        finalUrl,
        interceptionResult.protocol
      );
    }

    // Log any Web3 URL errors
    if (interceptionResult.error) {
      this.logger.warn(`Web3 URL error: ${interceptionResult.error}`, { url });
    }

    if (newTab) {
      return new Promise((resolve) => {
        chrome.tabs.create({ url: finalUrl, active: true }, (tab) => {
          if (waitForLoad) {
            chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
              if (updatedTabId === tab.id && info.status === 'complete') {
                chrome.tabs.onUpdated.removeListener(listener);
                resolve({
                  success: true,
                  tabId: tab.id,
                  url: tab.url,
                  title: tab.title,
                  web3: interceptionResult.wasWeb3 ? {
                    protocol: interceptionResult.protocol,
                    originalUrl: interceptionResult.originalUrl,
                  } : undefined,
                });
              }
            });
          } else {
            resolve({
              success: true,
              tabId: tab.id,
              url: finalUrl,
              web3: interceptionResult.wasWeb3 ? {
                protocol: interceptionResult.protocol,
                originalUrl: interceptionResult.originalUrl,
              } : undefined,
            });
          }
        });
      });
    }

    const targetTabId = tabId || (await this.getActiveTabId());
    if (!targetTabId) {
      return { success: false, error: 'No active tab' };
    }

    return new Promise((resolve) => {
      chrome.tabs.update(targetTabId, { url: finalUrl }, (tab) => {
        if (waitForLoad) {
          chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
            if (updatedTabId === targetTabId && info.status === 'complete') {
              chrome.tabs.onUpdated.removeListener(listener);
              resolve({
                success: true,
                tabId: targetTabId,
                url: tab?.url,
                title: tab?.title,
                web3: interceptionResult.wasWeb3 ? {
                  protocol: interceptionResult.protocol,
                  originalUrl: interceptionResult.originalUrl,
                } : undefined,
              });
            }
          });
        } else {
          resolve({
            success: true,
            tabId: targetTabId,
            url: finalUrl,
            web3: interceptionResult.wasWeb3 ? {
              protocol: interceptionResult.protocol,
              originalUrl: interceptionResult.originalUrl,
            } : undefined,
          });
        }
      });
    });
  }

  private async handleGoBack(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return new Promise((resolve) => {
      chrome.tabs.goBack(tabId, () => {
        resolve({ success: !chrome.runtime.lastError });
      });
    });
  }

  private async handleGoForward(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return new Promise((resolve) => {
      chrome.tabs.goForward(tabId, () => {
        resolve({ success: !chrome.runtime.lastError });
      });
    });
  }

  private async handleRefresh(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return new Promise((resolve) => {
      chrome.tabs.reload(tabId, () => {
        resolve({ success: !chrome.runtime.lastError });
      });
    });
  }

  private async handleGetCurrentUrl(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return new Promise((resolve) => {
      chrome.tabs.get(tabId, (tab) => {
        resolve({ url: tab.url, title: tab.title });
      });
    });
  }

  // ============================================================================
  // PAGE ANALYSIS HANDLERS
  // ============================================================================

  private async handleAnalyzePage(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'ANALYZE_PAGE', payload);
  }

  private async handleGetPageContent(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'GET_PAGE_CONTENT', payload);
  }

  private async handleGetDOMSnapshot(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'GET_DOM_SNAPSHOT', payload);
  }

  private async handleFindElements(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'FIND_ELEMENTS', payload);
  }

  // ============================================================================
  // ELEMENT INTERACTION HANDLERS
  // ============================================================================

  private async handleClick(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'CLICK_ELEMENT', payload);
  }

  private async handleType(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'TYPE_TEXT', payload);
  }

  private async handleScroll(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'SCROLL_PAGE', payload);
  }

  private async handleHover(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'HOVER_ELEMENT', payload);
  }

  private async handleFocus(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'FOCUS_ELEMENT', payload);
  }

  // ============================================================================
  // CHAT INTERFACE HANDLERS
  // ============================================================================

  private async handleDetectChatElements(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'AUTO_DETECT_ELEMENTS', payload);
  }

  private async handleSendChatMessage(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'SEND_CHAT_MESSAGE', payload);
  }

  private async handleGetChatMessages(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'GET_CHAT_MESSAGES', payload);
  }

  private async handleWaitForResponse(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'WAIT_FOR_RESPONSE', payload);
  }

  // ============================================================================
  // SCREENSHOT & RECORDING HANDLERS
  // ============================================================================

  private async handleTakeScreenshot(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    if (!tabId) return { success: false, error: 'No active tab' };

    return new Promise((resolve) => {
      chrome.tabs.captureVisibleTab(
        null, // current window
        {
          format: payload?.format || 'png',
          quality: payload?.quality || 100,
        },
        (dataUrl) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve({ success: true, dataUrl, width: 0, height: 0 }); // dimensions filled by caller
          }
        }
      );
    });
  }

  private async handleStartRecording(payload: any): Promise<any> {
    const tabId = payload?.tabId || (await this.getActiveTabId());
    const result = await screenRecordingService.startRecording(tabId || undefined);
    return {
      success: result.success,
      recordingId: result.recordingId,
    };
  }

  private async handleStopRecording(): Promise<any> {
    const result = await screenRecordingService.stopRecording();
    return {
      success: result.success,
      recordingId: result.recordingId,
      dataUrl: result.dataUrl,
      duration: result.duration,
    };
  }

  private handleGetRecordingStatus(): any {
    const status = screenRecordingService.getStatus();
    return {
      success: true,
      ...status,
    };
  }

  // ============================================================================
  // TAB MANAGEMENT HANDLERS
  // ============================================================================

  private async handleNewTab(payload: any): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.create({ url: payload?.url || 'about:blank', active: true }, (tab) => {
        resolve({ tabId: tab.id });
      });
    });
  }

  private async handleCloseTab(payload: any): Promise<any> {
    if (!payload?.tabId) return { success: false, error: 'No tabId provided' };

    return new Promise((resolve) => {
      chrome.tabs.remove(payload.tabId, () => {
        resolve({ success: !chrome.runtime.lastError });
      });
    });
  }

  private async handleSwitchTab(payload: any): Promise<any> {
    if (!payload?.tabId) return { success: false, error: 'No tabId provided' };

    return new Promise((resolve) => {
      chrome.tabs.update(payload.tabId, { active: true }, () => {
        resolve({ success: !chrome.runtime.lastError });
      });
    });
  }

  private async handleListTabs(): Promise<any> {
    return new Promise((resolve) => {
      chrome.tabs.query({}, (tabs) => {
        const tabInfos = tabs.map((tab) => ({
          id: tab.id,
          url: tab.url,
          title: tab.title,
          active: tab.active,
          status: tab.status,
          favIconUrl: tab.favIconUrl,
          windowId: tab.windowId,
        }));
        resolve({ tabs: tabInfos });
      });
    });
  }

  // ============================================================================
  // OVERLAY HANDLERS
  // ============================================================================

  private async handleShowOverlay(payload: any): Promise<any> {
    const tabId = await this.getActiveTabId();
    if (!tabId) return { success: false, error: 'No active tab' };

    this.overlayVisible = true;
    return this.executeContentScript(tabId, 'SHOW_OVERLAY', payload);
  }

  private async handleHideOverlay(): Promise<any> {
    const tabId = await this.getActiveTabId();
    if (!tabId) return { success: false, error: 'No active tab' };

    this.overlayVisible = false;
    return this.executeContentScript(tabId, 'HIDE_OVERLAY', {});
  }

  private async handleUpdateOverlay(payload: any): Promise<any> {
    const tabId = await this.getActiveTabId();
    if (!tabId) return { success: false, error: 'No active tab' };

    return this.executeContentScript(tabId, 'UPDATE_OVERLAY', payload);
  }

  // ============================================================================
  // CASCADE HANDLERS
  // ============================================================================

  private async handleCascadeStart(payload: any): Promise<any> {
    const { cascadeId, steps, options } = payload;

    const cascadeState: CascadeState = {
      cascadeId,
      steps,
      currentStep: 0,
      status: 'running',
      results: [],
      startTime: Date.now(),
      options,
    };

    this.activeCascades.set(cascadeId, cascadeState);

    // Start executing cascade in background
    this.executeCascade(cascadeId).catch((error) => {
      this.logger.error(`Cascade ${cascadeId} failed:`, error);
    });

    return { cascadeId, started: true };
  }

  private async handleCascadeCancel(payload: any): Promise<any> {
    const { cascadeId } = payload;
    const cascade = this.activeCascades.get(cascadeId);

    if (!cascade) {
      return { success: false, error: 'Cascade not found' };
    }

    cascade.status = 'cancelled';
    return { success: true };
  }

  private async handleCascadeStatus(payload: any): Promise<any> {
    const { cascadeId } = payload;
    const cascade = this.activeCascades.get(cascadeId);

    if (!cascade) {
      return { success: false, error: 'Cascade not found' };
    }

    return {
      cascadeId,
      status: cascade.status,
      currentStep: cascade.currentStep,
      totalSteps: cascade.steps.length,
      stepResults: cascade.results,
    };
  }

  private async executeCascade(cascadeId: string): Promise<void> {
    const cascade = this.activeCascades.get(cascadeId);
    if (!cascade) return;

    for (let i = 0; i < cascade.steps.length; i++) {
      if (cascade.status === 'cancelled') break;

      cascade.currentStep = i;
      const step = cascade.steps[i];

      try {
        const result = await this.handleMessage({
          type: step.action,
          payload: step.payload,
        });

        cascade.results.push({
          stepId: step.id,
          success: result.success !== false,
          result,
        });

        // Handle wait conditions
        if (step.waitCondition) {
          await this.waitForCondition(step.waitCondition);
        }

        if (!result.success && cascade.options?.stopOnError) {
          cascade.status = 'error';
          break;
        }
      } catch (error) {
        cascade.results.push({
          stepId: step.id,
          success: false,
          error: (error as Error).message,
        });

        if (cascade.options?.stopOnError) {
          cascade.status = 'error';
          break;
        }
      }
    }

    if (cascade.status === 'running') {
      cascade.status = 'completed';
    }
  }

  private async waitForCondition(condition: any): Promise<void> {
    const { type, value, timeout = 30000 } = condition;
    const startTime = Date.now();

    return new Promise((resolve) => {
      const check = async () => {
        if (Date.now() - startTime > timeout) {
          resolve();
          return;
        }

        switch (type) {
          case 'delay':
            setTimeout(resolve, value as number);
            return;
          // Add more condition types as needed
          default:
            resolve();
        }
      };

      check();
    });
  }

  // ============================================================================
  // SESSION HANDLERS
  // ============================================================================

  private async handleStartSession(payload: any): Promise<any> {
    this.sessionActive = true;
    this.sessionId = `session-${Date.now()}`;

    return { sessionId: this.sessionId };
  }

  private async handleEndSession(): Promise<any> {
    this.sessionActive = false;
    this.sessionId = null;
    this.activeCascades.clear();

    if (this.overlayVisible) {
      await this.handleHideOverlay();
    }

    return { success: true };
  }

  private async handleGetSessionStatus(): Promise<any> {
    const tabs = await new Promise<chrome.tabs.Tab[]>((resolve) => {
      chrome.tabs.query({}, resolve);
    });

    return {
      active: this.sessionActive,
      sessionId: this.sessionId,
      extensionConnected: true, // We're in the extension, so always true
      tabCount: tabs.length,
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private async getActiveTabId(): Promise<number | null> {
    return new Promise((resolve) => {
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        resolve(tabs[0]?.id || null);
      });
    });
  }

  private async executeContentScript(tabId: number, action: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: action, payload }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
        } else {
          resolve(response);
        }
      });
    });
  }
}

// ============================================================================
// SUPPORTING TYPES
// ============================================================================

interface CascadeState {
  cascadeId: string;
  steps: any[];
  currentStep: number;
  status: 'running' | 'paused' | 'completed' | 'cancelled' | 'error';
  results: Array<{ stepId: string; success: boolean; result?: any; error?: string }>;
  startTime: number;
  options: any;
}

// ============================================================================
// SINGLETON EXPORT
// ============================================================================

export const browserControlHandler = new BrowserControlHandler();
