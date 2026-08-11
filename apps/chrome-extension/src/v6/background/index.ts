/**
 * Fuse Connect v7 - Background Service Worker
 * Multi-node connection, federation channels, notifications
 *
 * This version handles connection failures gracefully and allows
 * starting the relay from the extension's Services tab.
 */

import { clipboardService } from '../services/clipboard-service';
import { commandRegistry } from '../services/command-registry';
import {
  ACTIVITY_CHANNEL,
  AI_MODELS,
  API_URLS,
  DEFAULT_NODES as DEFAULT_NODES_CONST,
  NATIVE_HOST_NAME as NATIVE_HOST_NAME_CONST,
  STORAGE_KEYS as STORAGE_KEYS_CONST,
  TIMINGS,
} from '../shared/constants';
import type { ExtensionMessage, TabInfo } from '../shared/types';
import { connectionManager } from './connection-manager';
import { devtoolsPanelManager } from './devtools-panel-manager';
import { elementsService } from './elements-service';
import { extensionSettings } from './extension-settings';
import { fbSubscriptionManager } from './fb-subscription-manager';
import { federationManager } from './federation-manager';
import { fileService } from './file-service';
import { nativeHostManager } from './native-host-manager';
import { notificationManager } from './notification-manager';
import { pageCaptureService } from './page-capture-service';
import { panelManager } from './panel-manager';
import { permissionManager } from './permission-manager';
import { popupManager } from './popup-manager';
import { previewService } from './preview-service';
import { proximityService } from './proximity-service';
import { screenshotService } from './screenshot-service';
import { tabManager } from './tab-manager';
import { toastManager } from './toast-manager';
import { urlMonitor } from './url-monitor';
import { walletService } from './wallet-service';

const NATIVE_HOST_NAME = NATIVE_HOST_NAME_CONST;
const STORAGE_KEYS = STORAGE_KEYS_CONST;
const DEFAULT_NODES = DEFAULT_NODES_CONST;
const API_URLS = API_URLS;
const TIMINGS = TIMINGS;
const AI_MODELS = AI_MODELS;
const ACTIVITY_CHANNEL = ACTIVITY_CHANNEL;

class BackgroundService {
  // Connection state
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;
  private isShuttingDown = false;

  // Tab management
  private tabs: Map<number, TabInfo> = new Map();

  // Extension lifecycle
  private extensionInstalledAt: number | null = null;

  // Performance monitoring
  private performanceMetrics: {
    messageLatency: number[];
    tabUpdateLatency: number[];
    nativeHostLatency: number[];
  } = {
    messageLatency: [],
    tabUpdateLatency: [],
    nativeHostLatency: [],
  };

  // Debug mode
  private debugMode = false;

  constructor() {
    this.initialize().catch(console.error);
  }

  private async initialize(): Promise<void> {
    // Prevent multiple initializations
    if (this.isInitialized || this.initializationPromise) {
      return this.initializationPromise || Promise.resolve();
    }

    this.initializationPromise = (async () => {
      try {
        console.log('���🚀 Fuse Connect v7 - Background Service Worker Starting...');

        // Load extension settings
        await extensionSettings.init();

        // Initialize all services
        await Promise.all([
          tabManager.init(),
          connectionManager.init(),
          nativeHostManager.init(),
          federationManager.init(),
          fbSubscriptionManager.init(),
          notificationManager.init(),
          elementsService.init(),
          panelManager.init(),
          devtoolsPanelManager.init(),
          urlMonitor.init(),
          toastManager.init(),
          permissionManager.init(),
          clipboardService.init(),
          commandRegistry.init(),
          pageCaptureService.init(),
          screenshotService.init(),
          fileService.init(),
          walletService.init(),
        ]);

        // Setup event listeners
        this.setupListeners();

        // Setup keyboard commands
        this.setupCommands();

        // Set installation timestamp if not set
        if (!this.extensionInstalledAt) {
          this.extensionInstalledAt = Date.now();
          await chrome.storage.local.set({ installed: this.extensionInstalledAt });
        }

        this.isInitialized = true;
        console.log('��✅ Fuse Connect v7 Background Service Worker initialized');

        // Broadcast ready state to all tabs
        await this.broadcastToTabs({ type: 'EXTENSION_READY' });
      } catch (error) {
        console.error('��❌ Failed to initialize background service:', error);
        throw error;
      }
    })();

    return this.initializationPromise;
  }

  private setupListeners(): void {
    // Runtime events
    chrome.runtime.onInstalled.addListener(this.handleInstalled.bind(this));
    chrome.runtime.onStartup.addListener(this.handleStartup.bind(this));
    chrome.runtime.onSuspend.addListener(this.handleSuspend.bind(this));
    chrome.runtime.onSuspendCanceled.addListener(this.handleSuspendCanceled.bind(this));
    chrome.runtime.onMessage.addListener(this.handleMessage.bind(this));

    // Tab events
    chrome.tabs.onCreated.addListener(this.handleTabCreated.bind(this));
    chrome.tabs.onUpdated.addListener(this.handleTabUpdated.bind(this));
    chrome.tabs.onRemoved.addListener(this.handleTabRemoved.bind(this));
    chrome.tabs.onActivated.addListener(this.handleTabActivated.bind(this));
    chrome.tabs.onZoomChange.addListener(this.handleTabZoomChanged.bind(this));
    chrome.windows.onFocusChanged.addListener(this.handleWindowFocusChanged.bind(this));

    // Command events
    chrome.commands.onCommand.addListener(this.handleCommand.bind(this));

    // Alarm events
    chrome.alarms.onAlarm.addListener(this.handleAlarm.bind(this));

    // Storage events
    chrome.storage.onChanged.addListener(this.handleStorageChanged.bind(this));
  }

  private handleInstalled(details: chrome.runtime.InstalledDetails): void {
    console.log('Extension installed/updated:', details.reason);
    if (details.reason === 'install') {
      // First time installation
      void this.initializeExtension();
      console.log('��✅ Extension installed and initialized');
    } else if (details.reason === 'update') {
      // Extension updated
      void this.handleUpdate(details);
    }
  }

  private async handleStartup(): Promise<void> {
    console.log('���🚀 Chrome started, initializing extension...');
    await this.initialize();
  }

  private handleSuspend(): void {
    console.log('��⏸��️ Chrome suspending...');
  }

  private handleSuspendCanceled(): void {
    console.log('�▶��️ Chrome suspend canceled');
  }

  private handleMessage(
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): boolean {
    // We return true to indicate we will respond asynchronously
    void this.handleMessageAsync(request, sender, sendResponse);
    return true;
  }

  private async handleMessageAsync(
    request: any,
    sender: chrome.runtime.MessageSender,
    sendResponse: (response: any) => void
  ): Promise<void> {
    try {
      const response = await extensionSettings.handleMessage(request, sender);
      if (response !== undefined) {
        sendResponse(response);
        return;
      }

      // Handle tab-specific messages
      if (sender.tab?.id !== undefined) {
        const tabResponse = await tabManager.handleMessage(request, sender.tab.id);
        if (tabResponse !== undefined) {
          sendResponse(tabResponse);
          return;
        }
      }

      // Handle connection messages
      const connResponse = await connectionManager.handleMessage(request, sender);
      if (connResponse !== undefined) {
        sendResponse(connResponse);
        return;
      }

      // Handle native host messages
      const nativeResponse = await nativeHostManager.handleMessage(request, sender);
      if (nativeResponse !== undefined) {
        sendResponse(nativeResponse);
        return;
      }

      // Handle federation messages
      const fedResponse = await federationManager.handleMessage(request, sender);
      if (fedResponse !== undefined) {
        sendResponse(fedResponse);
        return;
      }

      // Handle notification messages
      const notifResponse = await notificationManager.handleMessage(request, sender);
      if (notifResponse !== undefined) {
        sendResponse(notifResponse);
        return;
      }

      // Handle clipboard messages
      const clipResponse = await clipboardService.handleMessage(request, sender);
      if (clipResponse !== undefined) {
        sendResponse(clipResponse);
        return;
      }

      // Handle command messages
      const cmdResponse = await commandRegistry.handleMessage(request, sender);
      if (cmdResponse !== undefined) {
        sendResponse(cmdResponse);
        return;
      }

      // Handle popup messages
      const popupResponse = await popupManager.handleMessage(request, sender);
      if (popupResponse !== undefined) {
        sendResponse(popupResponse);
        return;
      }

      // Handle panel messages
      const panelResponse = await panelManager.handleMessage(request, sender);
      if (panelResponse !== undefined) {
        sendResponse(panelResponse);
        return;
      }

      // Handle devtools panel messages
      const devtoolsResponse = await devtoolsPanelManager.handleMessage(request, sender);
      if (devtoolsResponse !== undefined) {
        sendResponse(devtoolsResponse);
        return;
      }

      // Handle elements service messages
      const elementsResponse = await elementsService.handleMessage(request, sender);
      if (elementsResponse !== undefined) {
        sendResponse(elementsResponse);
        return;
      }

      // Handle proximity service messages
      const proximityResponse = await proximityService.handleMessage(request, sender);
      if (proximityResponse !== undefined) {
        sendResponse(proximityResponse);
        return;
      }

      // Handle url monitor messages
      const urlResponse = await urlMonitor.handleMessage(request, sender);
      if (urlResponse !== undefined) {
        sendResponse(urlResponse);
        return;
      }

      // Handle toast manager messages
      const toastResponse = await toastManager.handleMessage(request, sender);
      if (toastResponse !== undefined) {
        sendResponse(toastResponse);
        return;
      }

      // Handle permission manager messages
      const permResponse = await permissionManager.handleMessage(request, sender);
      if (permResponse !== undefined) {
        sendResponse(permResponse);
        return;
      }

      // Handle file service messages
      const fileResponse = await fileService.handleMessage(request, sender);
      if (fileResponse !== undefined) {
        sendResponse(fileResponse);
        return;
      }

      // Handle screenshot service messages
      const screenshotResponse = await screenshotService.handleMessage(request, sender);
      if (screenshotResponse !== undefined) {
        sendResponse(screenshotResponse);
        return;
      }

      // Handle page capture service messages
      const pageCaptureResponse = await pageCaptureService.handleMessage(request, sender);
      if (pageCaptureResponse !== undefined) {
        sendResponse(pageCaptureResponse);
        return;
      }

      // Handle wallet service messages
      const walletResponse = await walletService.handleMessage(request, sender);
      if (walletResponse !== undefined) {
        sendResponse(walletResponse);
        return;
      }

      // Handle preview service messages
      const previewResponse = await previewService.handleMessage(request, sender);
      if (previewResponse !== undefined) {
        sendResponse(previewResponse);
        return;
      }

      // If we got here, no handler found
      console.warn('��⚠��️ Unhandled message:', request);
      sendResponse({ error: 'Unhandled message type' });
    } catch (error) {
      console.error('��❌ Error handling message:', error);
      sendResponse({ error: error.message });
    }
  }

  private handleTabCreated(tab: chrome.Tab): void {
    if (tab.id !== undefined) {
      tabManager.handleTabCreated(tab);
    }
  }

  private handleTabUpdated(
    tabId: number,
    changeInfo: chrome.tabChanges.TabChangeInfo,
    tab: chrome.Tab
  ): void {
    tabManager.handleTabUpdated(tabId, changeInfo, tab);
  }

  private handleTabRemoved(tabId: number, removeInfo: chrome.tabs.TabRemoveInfo): void {
    tabManager.handleTabRemoved(tabId, removeInfo);
  }

  private handleTabActivated(activeInfo: chrome.tabs.TabActiveInfo): void {
    if (activeInfo.tabId !== undefined) {
      tabManager.handleTabActivated(activeInfo.tabId);
    }
  }

  private handleTabZoomChanged(zoomChangeInfo: chrome.tabs.TabZoomChangeInfo): void {
    if (zoomChangeInfo.tabId !== undefined) {
      tabManager.handleTabZoomChanged(zoomChangeInfo.tabId, zoomChangeInfo.newZoom);
    }
  }

  private handleWindowFocusChanged(windowId: number): void {
    tabManager.handleWindowFocusChanged(windowId);
  }

  private handleCommand(command: string): void {
    // This is called directly by chrome.commands.onCommand
    // We need to ensure proper binding of 'this'
    void this.handleCommandAsync(command);
  }

  private async handleCommandAsync(command: string): Promise<void> {
    try {
      console.log('���🎹 Command received:', command);

      if (command === 'toggle-panel') {
        await this.broadcastToTabs({ type: 'TOGGLE_PANEL' });
      } else if (command === 'show-devtools') {
        await this.broadcastToTabs({ type: 'SHOW_DEVTOOLS' });
      } else if (command === 'capture-page') {
        await this.broadcastToTabs({ type: 'CAPTURE_PAGE' });
      } else if (command === 'send-to-native') {
        await this.broadcastToTabs({ type: 'SEND_TO_NATIVE' });
      } else {
        console.warn('��⚠��️ Unknown command:', command);
      }
    } catch (error) {
      console.error('��❌ Error handling command:', error);
    }
  }

  private handleAlarm(alarm: chrome.Alarm): void {
    // Handle alarms if needed
    console.debug('Alarm triggered:', alarm.name);
  }

  private handleStorageChanged(
    changes: { [key: string]: chrome.storage.StorageChange },
    areaName: chrome.storage.StorageArea
  ): void {
    // Handle storage changes if needed
    console.debug('Storage changed:', changes, areaName);
  }

  private async initializeExtension(): Promise<void> {
    try {
      console.log('���🔧 Initializing extension...');

      // Set default values if not already set
      const defaults = {
        installed: Date.now(),
        tier: 'free',
        userId: this.generateUserId(),
        // Add any other default settings here
      };

      await chrome.storage.local.set(defaults);
      console.log('��✅ Extension initialized with default settings');
    } catch (error) {
      console.error('��❌ Failed to initialize extension:', error);
      throw error;
    }
  }

  private async handleUpdate(details: chrome.runtime.InstalledDetails): Promise<void> {
    try {
      console.log('���🔄 Handling extension update:', details);

      const manifest = chrome.runtime.getManifest();
      console.log(`Updated to version ${manifest.version}`);

      // Run any migration logic here if needed
      // For now, just log the update
    } catch (error) {
      console.error('��❌ Error handling extension update:', error);
    }
  }

  private generateUserId(): string {
    return 'user_' + Math.random().toString(36).substr(2, 9);
  }

  private async broadcastToTabs(message: ExtensionMessage): Promise<void> {
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
      if (tab.id !== undefined && tab.url?.startsWith('http')) {
        try {
          await chrome.tabs.sendMessage(tab.id, message);
        } catch (error) {
          // Ignore errors for tabs that are closed or inaccessible
          if (error.message !== 'Could not establish connection. Receiving end does not exist.') {
            console.debug('Failed to send message to tab:', tab.id, error.message);
          }
        }
      }
    }
  }

  public async shutdown(): Promise<void> {
    if (this.isShuttingDown) {
      return;
    }

    this.isShuttingDown = true;
    console.log('���🛑 Shutting down background service...');

    try {
      // Cleanup all services
      await Promise.all([
        tabManager.shutdown(),
        connectionManager.shutdown(),
        nativeHostManager.shutdown(),
        federationManager.shutdown(),
        fbSubscriptionManager.shutdown(),
        notificationManager.shutdown(),
        elementsService.shutdown(),
        panelManager.shutdown(),
        devtoolsPanelManager.shutdown(),
        urlMonitor.shutdown(),
        toastManager.shutdown(),
        permissionManager.shutdown(),
        clipboardService.shutdown(),
        commandRegistry.shutdown(),
        pageCaptureService.shutdown(),
        screenshotService.shutdown(),
        fileService.shutdown(),
        walletService.shutdown(),
      ]);

      console.log('��✅ Background service worker shut down');
    } catch (error) {
      console.error('��❌ Error during shutdown:', error);
    }
  }
}

// Initialize the background service
const backgroundService = new BackgroundService();

// Handle shutdown events
chrome.runtime.onSuspend.addListener(() => {
  void backgroundService.shutdown();
});

// Export for testing (if needed)
export { BackgroundService };
