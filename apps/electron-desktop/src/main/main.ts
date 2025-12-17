/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable import/order */
/* eslint-disable import/no-unresolved */
import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

import { app, BrowserWindow, dialog, ipcMain, session, shell } from 'electron';

import AdmZip from 'adm-zip';
import axios from 'axios';

import { HybridBackend } from './HybridBackend';
import { JsonStore } from './JsonStore';
import { PlaywrightService } from './PlaywrightService';

// Enable remote debugging for AI agent control
app.commandLine.appendSwitch('remote-debugging-port', '9222');
app.commandLine.appendSwitch('remote-allow-origins', '*');

// Enable WebAuthn/Passkey support for services like GitHub
// This addresses the "partial passkey support" error
app.commandLine.appendSwitch('enable-web-authentication-testing-api');
app.commandLine.appendSwitch(
  'enable-features',
  'WebAuthenticationTouchIdAuthenticator,WebAuthenticationRemoteDesktopSupport'
);

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1';

// Safe logging to prevent EPIPE errors
const safeLog = (...args: any[]) => {
  try {
    console.log(...args);
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
};

const safeError = (...args: any[]) => {
  try {
    console.error(...args);
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
};

const safeWarn = (...args: any[]) => {
  try {
    console.warn(...args);
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
};

class ElectronMain {
  private mainWindow: BrowserWindow | null = null;
  private hybridBackend: HybridBackend | null = null;
  private playwrightService: PlaywrightService = new PlaywrightService();
  private bookmarksStore = new JsonStore<any>('bookmarks.json', []);
  private historyStore = new JsonStore<any>('history.json', []);
  private apiKeysStore = new JsonStore<any>('api-keys.json', [] as any);

  constructor() {
    this.init();
  }

  // API Key management helpers
  private getStoredAPIKeys(): { [key: string]: string } {
    const data = this.apiKeysStore.getAll() as any;
    return (Array.isArray(data) ? {} : data) || {};
  }

  private setStoredAPIKey(provider: string, key: string): void {
    const keys = this.getStoredAPIKeys();
    keys[provider] = key;
    this.apiKeysStore.set(keys as any);
  }

  private async init() {
    // Handle app ready
    app.whenReady().then(async () => {
      // Inject permissive CORS headers for responses loaded inside Electron (dev only)
      if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        const ses = session.defaultSession;

        // Handle CORS for all requests
        ses.webRequest.onBeforeSendHeaders((details: any, callback: any) => {
          const requestHeaders = details.requestHeaders || {};
          // Set Origin header to null for file:// protocol to handle CORS properly
          if (details.url.startsWith('file://')) {
            requestHeaders['Origin'] = 'null';
          }
          callback({ requestHeaders });
        });

        ses.webRequest.onHeadersReceived((details: any, callback: any) => {
          const responseHeaders = details.responseHeaders || {};

          // Enhanced CORS handling for file:// origins and null origins
          responseHeaders['Access-Control-Allow-Origin'] = ['*'];
          responseHeaders['Access-Control-Allow-Methods'] = ['GET,POST,PUT,PATCH,DELETE,OPTIONS'];
          responseHeaders['Access-Control-Allow-Headers'] = ['*'];
          responseHeaders['Access-Control-Expose-Headers'] = ['Content-Length,ETag'];
          responseHeaders['Access-Control-Allow-Credentials'] = ['true'];

          // Handle preflight OPTIONS requests
          if (details.method === 'OPTIONS') {
            responseHeaders['Access-Control-Max-Age'] = ['86400'];
          }

          // Remove iframe-blocking headers for Theia integration
          delete responseHeaders['X-Frame-Options'];
          delete responseHeaders['x-frame-options'];

          // Set proper CSP for development - allow local file loading
          responseHeaders['Content-Security-Policy'] = [
            "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: ws: wss: http: https: file:; " +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: http: https: file:; " +
              "frame-src 'self' data: blob: http: https: file:; " +
              "child-src 'self' data: blob: http: https: file:; " +
              "connect-src 'self' ws: wss: http: https: file:; " +
              "img-src 'self' data: blob: http: https: file:; " +
              "style-src 'self' 'unsafe-inline' data: blob: http: https: file:; " +
              "font-src 'self' data: blob: http: https: file:; " +
              "object-src 'none'; " +
              "media-src 'self' data: blob: http: https: file:;",
          ];

          callback({ responseHeaders });
        });

        // Configure permissions for iframe content
        ses.setPermissionRequestHandler((webContents: any, permission: any, callback: any) => {
          // Allow specific permissions for development
          const allowedPermissions = [
            'camera',
            'microphone',
            'notifications',
            'geolocation',
            'keyboard-lock',
            'fullscreen',
            'media',
            'display-capture',
            'clipboard-read',
            'clipboard-write',
            'window-management',
          ];
          callback(allowedPermissions.includes(permission));
        });

        // Handle permission check for keyboard layout
        ses.setPermissionCheckHandler((webContents: any, permission: any) => {
          // Always allow keyboard layout access for Theia
          return permission === 'keyboard-lock' || permission === 'fullscreen';
        });

        // Set user agent to avoid iframe detection
        ses.setUserAgent(ses.getUserAgent().replace(/Electron\/[\d.]+\s/, ''));

        // Register protocol handler for file:// URLs
        app.setAsDefaultProtocolClient('file');

        // Handle file:// protocol requests
        ses.protocol.handle('file', (request: any) => {
          const filePath = request.url.replace('file://', '');
          try {
            const data = fs.readFileSync(decodeURIComponent(filePath));
            return new Response(data as any as BodyInit);
          } catch (error) {
            return new Response(null, { status: 404, statusText: 'File Not Found' });
          }
        });
      }
      this.createWindow();
      this.initializeHybridBackend();

      // Load Chrome extensions after window is ready
      await this.loadChromeExtensions();
    });

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit();
      }
    });

    // Handle activate (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow();
      }
    });

    // Handle before quit
    app.on('before-quit', async () => {
      if (this.hybridBackend) {
        await this.hybridBackend.shutdown();
      }
    });
  }

  private createWindow(): void {
    // Create the browser window with modern styling
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 1200,
      minHeight: 800,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, '../preload/preload.js'),
        webviewTag: true,
        webSecurity: false, // Disable for development to allow file:// loading
        allowRunningInsecureContent: isDev, // Allow in development only
        experimentalFeatures: false,
        // Enable specific features for development
        ...(isDev
          ? {
              enableBlinkFeatures: 'CSSColorSchemeUARendering',
              additionalArguments: ['--disable-web-security', '--allow-file-access-from-files'],
            }
          : {}),
        disableBlinkFeatures: 'OutOfBlinkCors',
        partition: 'persist:browser-hub',
      },
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#0f0f23',
      show: false,
      icon: path.join(__dirname, '../../assets/icon.png'),
    });

    // Load the Enhanced Browser Hub - the main Browser Hub interface
    if (isDev) {
      // In development, use HTTP server for consistency with Chrome extension
      this.mainWindow?.loadURL('http://localhost:8080');
    } else {
      // In production, use local file for better performance
      const enhancedHubPath = path.join(
        __dirname,
        '../../dist/browser-hub/enhanced-browser-hub.html'
      );
      this.mainWindow?.loadFile(enhancedHubPath);
    }
    if (isDev) {
      this.mainWindow?.webContents.openDevTools();
    }

    // Show window when ready
    this.mainWindow?.once('ready-to-show', () => {
      this.mainWindow?.show();
    });

    // Handle window closed
    this.mainWindow?.on('closed', () => {
      this.mainWindow = null;
    });
  }

  private async initializeHybridBackend(): Promise<void> {
    try {
      // Auto-register Native Messaging Host (Self-Healing)
      await this.ensureNativeHostRegistered();

      this.hybridBackend = new HybridBackend();
      await this.hybridBackend.initialize();

      // Set up IPC handlers for communication with renderer
      this.setupIpcHandlers();

      // Start API and Backend services
      safeLog('Attempting to start API service...');
      await this.hybridBackend.executeNativeCommand('start_service', ['api']);
      safeLog('Attempting to start Backend service...');
      await this.hybridBackend.executeNativeCommand('start_service', ['backend']);

      // Initial system status update in main.ts
      this.updateSystemStatus(); // Call once immediately
      setInterval(() => this.updateSystemStatus(), 5000); // Update every 5 seconds
    } catch (error) {
      safeError('Failed to initialize HybridBackend or start services:', error);
    }
  }

  private async ensureNativeHostRegistered(): Promise<void> {
    try {
      const fs = require('fs');
      const path = require('path');
      const os = require('os');

      const HOST_NAME = 'com.thenewfuse.local_ai';
      const EXTENSION_ID = 'koddjfgfedjfamjgganioboekladjlcf'; // Stable ID

      // Determine Host Path
      let hostScriptPath = '';
      if (app.isPackaged) {
        // In production: resources/native/host.py
        hostScriptPath = path.join(process.resourcesPath, 'native', 'host.py');
      } else {
        // In dev: apps/electron-desktop/native/host.py
        hostScriptPath = path.join(__dirname, '../../native/host.py');
      }

      // Ensure executable permissions (Unix-like systems)
      if (process.platform !== 'win32' && fs.existsSync(hostScriptPath)) {
        try {
          fs.chmodSync(hostScriptPath, '755');
        } catch (e) {
          safeLog('Failed to chmod host script', e);
        }
      }

      // Define Manifest (Windows requires different format)
      const manifest = {
        name: HOST_NAME,
        description: 'The New Fuse Local AI Connector',
        path: process.platform === 'win32' ? hostScriptPath.replace(/\\/g, '\\\\') : hostScriptPath,
        type: 'stdio',
        allowed_origins: [`chrome-extension://${EXTENSION_ID}/`],
      };

      // Platform-specific manifest installation
      let manifestPath = '';

      if (process.platform === 'darwin') {
        // macOS: ~/Library/Application Support/Google/Chrome/NativeMessagingHosts/
        const chromeHostsDir = path.join(
          os.homedir(),
          'Library/Application Support/Google/Chrome/NativeMessagingHosts'
        );
        if (!fs.existsSync(chromeHostsDir)) fs.mkdirSync(chromeHostsDir, { recursive: true });
        manifestPath = path.join(chromeHostsDir, `${HOST_NAME}.json`);
      } else if (process.platform === 'win32') {
        // Windows: Registry + manifest file
        const chromeHostsDir = path.join(
          os.homedir(),
          'AppData',
          'Roaming',
          'Google',
          'Chrome',
          'NativeMessagingHosts'
        );
        if (!fs.existsSync(chromeHostsDir)) fs.mkdirSync(chromeHostsDir, { recursive: true });
        manifestPath = path.join(chromeHostsDir, `${HOST_NAME}.json`);

        // Also register in Windows Registry
        try {
          const regKey = `HKCU\\Software\\Google\\Chrome\\NativeMessagingHosts\\${HOST_NAME}`;
          execSync(`reg add "${regKey}" /ve /t REG_SZ /d "${manifestPath}" /f`, {
            stdio: 'ignore',
          });
          safeLog(`Windows Registry key added: ${regKey}`);
        } catch (regError) {
          safeWarn('Failed to add Windows Registry key (may require admin):', regError);
        }
      } else if (process.platform === 'linux') {
        // Linux: ~/.config/google-chrome/NativeMessagingHosts/
        const chromeHostsDir = path.join(
          os.homedir(),
          '.config/google-chrome/NativeMessagingHosts'
        );
        if (!fs.existsSync(chromeHostsDir)) fs.mkdirSync(chromeHostsDir, { recursive: true });
        manifestPath = path.join(chromeHostsDir, `${HOST_NAME}.json`);
      }

      if (manifestPath) {
        fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
        safeLog(`Native Host registered at: ${manifestPath}`);
      } else {
        safeWarn(`Native Host registration not supported on platform: ${process.platform}`);
      }
    } catch (error) {
      safeError('Failed to register Native Messaging Host', error);
    }
  }

  // Add this new method to send system status updates to the renderer
  private async updateSystemStatus(): Promise<void> {
    if (!this.hybridBackend || !this.mainWindow) return;
    try {
      const status = await this.hybridBackend.executeNativeCommand('get_all_service_statuses', []);
      this.mainWindow.webContents.send('system-status-update', status);
    } catch (error) {
      safeError('Failed to get system status:', error);
    }
  }

  // Load Chrome extensions from the extensions directory
  private async loadChromeExtensions(): Promise<void> {
    try {
      safeLog('🔌 Loading Chrome extensions...');

      // Determine extensions directory path
      const extensionSearchPaths: string[] = [];

      // 1. App-bundled extensions
      if (app.isPackaged) {
        extensionSearchPaths.push(path.join(process.resourcesPath, 'app', 'extensions'));
      } else {
        extensionSearchPaths.push(path.join(__dirname, '../../extensions'));
      }

      // 2. User installed extensions (Persistence)
      extensionSearchPaths.push(path.join(app.getPath('userData'), 'extensions'));

      // 3. System Chrome Extensions (Mac support for now) -- DISABLED to prevent bloat
      /*
      if (process.platform === 'darwin') {
        const chromeExtensions = path.join(os.homedir(), 'Library', 'Application Support', 'Google', 'Chrome', 'Default', 'Extensions');
        if (fs.existsSync(chromeExtensions)) {
           extensionSearchPaths.push(chromeExtensions);
           safeLog(`🔍 Also looking for extensions in system Chrome: ${chromeExtensions}`);
        }
      }
      */

      safeLog(`📁 Searching for extensions in: ${extensionSearchPaths.join(', ')}`);

      // Find all extensions
      const extensionPaths: string[] = [];

      // Helper to find extensions recursively
      const findExtensions = (dir: string, depth: number = 0): string[] => {
        if (depth > 3) return []; // Limit depth
        const results: string[] = [];

        try {
          if (!fs.existsSync(dir)) return [];

          if (fs.existsSync(path.join(dir, 'manifest.json'))) {
            return [dir];
          }

          const entries = fs.readdirSync(dir, { withFileTypes: true });
          for (const entry of entries) {
            if (
              entry.isDirectory() &&
              !entry.name.startsWith('.') &&
              entry.name !== 'node_modules'
            ) {
              results.push(...findExtensions(path.join(dir, entry.name), depth + 1));
            }
          }
        } catch (e) {
          // Ignore access errors
        }
        return results;
      };

      for (const searchPath of extensionSearchPaths) {
        extensionPaths.push(...findExtensions(searchPath));
      }

      safeLog(`📦 Found ${extensionPaths.length} potential extension(s)`);

      // Load each extension
      for (const extPath of extensionPaths) {
        try {
          const manifestPath = path.join(extPath, 'manifest.json');

          // Double check manifest exists
          if (!fs.existsSync(manifestPath)) continue;

          // Read manifest to get extension name
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
          const extName = manifest.name || path.basename(extPath);

          safeLog(`🔧 Loading extension: ${extName} from ${extPath}`);

          // Load the extension
          await session.defaultSession.loadExtension(extPath, {
            allowFileAccess: true,
          });

          safeLog(`✅ Successfully loaded extension: ${extName}`);
        } catch (extError) {
          safeError(`❌ Failed to load extension from ${extPath}:`, extError);
        }
      }

      safeLog('🎉 Chrome extensions loading complete!');
    } catch (error) {
      safeError('Failed to load Chrome extensions:', error);
    }
  }

  private setupIpcHandlers(): void {
    if (!this.hybridBackend) return;

    // TNF Relay commands
    ipcMain.handle('tnf:connect', async (_: any, config: any) => {
      return await this.hybridBackend!.connectTNFRelay(config);
    });

    ipcMain.handle('tnf:disconnect', async () => {
      return await this.hybridBackend!.disconnectTNFRelay();
    });

    ipcMain.handle('tnf:status', async () => {
      return this.hybridBackend!.getTNFRelayStatus();
    });

    // MCP commands
    ipcMain.handle('mcp:connect', async (_: any, config: any) => {
      return await this.hybridBackend!.connectMCP(config);
    });

    ipcMain.handle('mcp:disconnect', async () => {
      return await this.hybridBackend!.disconnectMCP();
    });

    ipcMain.handle('mcp:status', async () => {
      return this.hybridBackend!.getMCPStatus();
    });

    // Port monitoring commands
    ipcMain.handle('ports:add', async (_: any, port: any) => {
      return this.hybridBackend!.addPortToMonitor(port);
    });

    ipcMain.handle('ports:remove', async (_: any, port: any) => {
      return this.hybridBackend!.removePortFromMonitor(port);
    });

    ipcMain.handle('ports:list', async () => {
      return this.hybridBackend!.getMonitoredPorts();
    });

    ipcMain.handle('ports:status', async () => {
      return this.hybridBackend!.getPortStatuses();
    });

    // Native commands
    ipcMain.handle('native:execute', async (_: any, command: any, args: any) => {
      return await this.hybridBackend!.executeNativeCommand(command, args);
    });

    // Chrome extension commands
    ipcMain.handle('chrome:element-detected', async (_: any, elementData: any) => {
      return this.hybridBackend!.handleElementDetection(elementData);
    });

    ipcMain.handle('chrome:send-message', async (_: any, message: any) => {
      return await this.hybridBackend!.sendMessageToChrome(message);
    });

    // System status
    ipcMain.handle('system:status', async () => {
      return this.hybridBackend!.getSystemStatus();
    });

    // Chat commands
    ipcMain.handle('chat:send', async (_: any, message: any) => {
      return await this.hybridBackend!.processChatMessage(message);
    });

    ipcMain.handle('chat:history', async () => {
      return this.hybridBackend!.getChatHistory();
    });

    // Shell integration
    ipcMain.handle('shell:open-external', async (_: any, url: string) => {
      try {
        await shell.openExternal(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Playwright commands
    ipcMain.handle('playwright:open', async (_: any, url: string) => {
      try {
        await this.playwrightService.openUrl(url);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Browser Hub compatibility handlers (stubs for now)
    ipcMain.handle('browser:new-tab', async (_: any, _options: any) => {
      return { success: true };
    });
    ipcMain.handle('browser:set-engine', async (_: any, _engine: string) => {
      return { success: true };
    });
    ipcMain.handle('browser:navigate', async (_: any, _url: string) => {
      return { success: true };
    });
    ipcMain.handle('browser:action', async (_: any, _action: string) => {
      return { success: true };
    });
    ipcMain.handle('browser:toggle-devtools', async () => {
      if (this.mainWindow) {
        if (this.mainWindow.webContents.isDevToolsOpened()) {
          this.mainWindow.webContents.closeDevTools();
        } else {
          this.mainWindow.webContents.openDevTools();
        }
      }
      return { success: true };
    });

    ipcMain.handle('browser:screenshot', async () => ({ success: true }));
    ipcMain.handle('browser:generate-pdf', async () => ({ success: true }));
    ipcMain.handle('browser:start-recording', async () => ({ success: true }));

    // Real Bookmarks Implementation
    ipcMain.handle('browser:get-bookmarks', async () => {
      const bookmarks = this.bookmarksStore.getAll();
      return { success: true, bookmarks };
    });
    ipcMain.handle('browser:add-bookmark', async (_: any, bookmark: any) => {
      this.bookmarksStore.add(bookmark);
      return { success: true };
    });
    ipcMain.handle('browser:remove-bookmark', async (_: any, id: string) => {
      this.bookmarksStore.remove((b: any) => b.id === id);
      return { success: true };
    });
    // UI Toggle handler - keeps existing behavior if needed, but data layer is separate
    ipcMain.handle('browser:toggle-bookmarks', async () => ({ success: true }));

    // Real History Implementation
    ipcMain.handle('browser:get-history', async () => {
      const history = this.historyStore.getAll();
      // Returns last 100 items by default or sort
      return { success: true, history: history.slice(-100).reverse() };
    });
    ipcMain.handle('browser:add-history', async (_: any, item: any) => {
      this.historyStore.add(item);
      return { success: true };
    });
    ipcMain.handle('browser:clear-history', async () => {
      this.historyStore.set([]);
      return { success: true };
    });
    // UI Toggle handler
    ipcMain.handle('browser:show-history', async () => ({ success: true }));

    ipcMain.handle('browser:show-downloads', async () => ({ success: true }));
    ipcMain.handle('browser:show-more', async () => ({ success: true }));

    // App integrations (stubs)
    ipcMain.handle('app:open-theia', async () => ({ success: true }));
    ipcMain.handle('app:start-theia', async () => ({ success: true }));
    ipcMain.handle('app:open-vscode', async () => ({ success: true }));
    ipcMain.handle('app:open-file-explorer', async () => ({ success: true }));
    ipcMain.handle('app:open-theia-terminal', async () => ({ success: true }));
    ipcMain.handle('app:open-theia-git', async () => ({ success: true }));
    ipcMain.handle('app:open-theia-debugger', async () => ({ success: true }));
    ipcMain.handle('app:refresh-services', async () => ({ success: true }));

    // Terminal handler - opens system terminal
    ipcMain.handle('terminal:open', async () => {
      try {
        const { exec } = require('child_process');
        if (process.platform === 'darwin') {
          exec('open -a Terminal');
        } else if (process.platform === 'win32') {
          exec('start cmd');
        } else {
          // Linux - try common terminals
          exec('x-terminal-emulator || gnome-terminal || konsole || xterm');
        }
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // AI message handler
    ipcMain.handle('ai:send-message', async (_: any, provider: string, message: string) => {
      try {
        // Get API keys from secure storage or config
        const apiKeys = this.getStoredAPIKeys();

        if (provider === 'gemini') {
          // Use Gemini API
          const apiKey = apiKeys.gemini;
          if (!apiKey) {
            return { success: false, error: 'Gemini API key not configured' };
          }
          // TODO: Implement actual Gemini API call
          return {
            success: true,
            message: 'Gemini integration coming soon. Please configure API key.',
          };
        } else if (provider === 'openai') {
          const apiKey = apiKeys.openai;
          if (!apiKey) {
            return { success: false, error: 'OpenAI API key not configured' };
          }
          // TODO: Implement actual OpenAI API call
          return {
            success: true,
            message: 'OpenAI integration coming soon. Please configure API key.',
          };
        } else if (provider === 'anthropic') {
          const apiKey = apiKeys.anthropic;
          if (!apiKey) {
            return { success: false, error: 'Anthropic API key not configured' };
          }
          // TODO: Implement actual Anthropic API call
          return {
            success: true,
            message: 'Anthropic integration coming soon. Please configure API key.',
          };
        } else if (provider === 'local') {
          // Execute local CLI agent
          return { success: true, message: 'Local CLI agent execution coming soon.' };
        }

        return { success: false, error: `Unknown provider: ${provider}` };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // API key storage handler
    ipcMain.handle('ai:set-api-key', async (_: any, provider: string, key: string) => {
      try {
        this.setStoredAPIKey(provider, key);
        return { success: true };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Workflow Builder integration
    ipcMain.handle('workflow:create', async (_: any, workflow: any) => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('create_workflow', [
            JSON.stringify(workflow),
          ]);
        }
        return { success: false, error: 'Backend not available' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('workflow:save', async (_: any, workflow: any) => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('save_workflow', [
            JSON.stringify(workflow),
          ]);
        }
        return { success: false, error: 'Backend not available' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('workflow:load', async (_: any, workflowId: string) => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('load_workflow', [workflowId]);
        }
        return { success: false, error: 'Backend not available' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Extensions
    ipcMain.handle('extensions:load-unpacked', async () => {
      if (!this.mainWindow) return { success: false, error: 'No window' };

      const result = await dialog.showOpenDialog(this.mainWindow, {
        properties: ['openDirectory'],
        title: 'Load Unpacked Extension',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return { success: false, canceled: true };
      }

      const extensionPath = result.filePaths[0];
      try {
        safeLog(`🔌 Loading unpacked extension from: ${extensionPath}`);
        const ext = await session.defaultSession.loadExtension(extensionPath, {
          allowFileAccess: true,
        });
        safeLog(`✅ Extension loaded: ${ext.name}`);
        return { success: true, name: ext.name, id: ext.id };
      } catch (error) {
        safeError('Failed to load extension:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    // Install from Chrome Web Store
    ipcMain.handle('extensions:install-from-store', async (_: any, urlOrId: string) => {
      try {
        let extensionId = urlOrId;
        // Extract ID if it's a URL
        // Match typical chrome web store URLs
        const match = urlOrId.match(/(?:\/detail\/[^\/]+\/|\/)([a-z]{32})(?:\?|$)/);
        if (match) {
          extensionId = match[1];
        } else if (!/^[a-z]{32}$/.test(urlOrId)) {
          return { success: false, error: 'Invalid Extension ID or URL' };
        }

        safeLog(`⬇️ Downloading extension ${extensionId}...`);

        // CRX Download URL (CRX2/CRX3 compatible)
        // Using a recent Chrome version to ensure compatibility
        const crxUrl = `https://clients2.google.com/service/update2/crx?response=redirect&prodversion=132.0.0.0&acceptformat=crx2,crx3&x=id%3D${extensionId}%26uc`;

        const userDataPath = app.getPath('userData');
        const extensionsDir = path.join(userDataPath, 'extensions');
        const downloadDir = path.join(userDataPath, 'extensions_crx');
        const destDir = path.join(extensionsDir, extensionId);
        const crxPath = path.join(downloadDir, `${extensionId}.crx`);

        if (!fs.existsSync(extensionsDir)) fs.mkdirSync(extensionsDir, { recursive: true });
        if (!fs.existsSync(downloadDir)) fs.mkdirSync(downloadDir, { recursive: true });

        // Download CRX
        const response = await axios({
          method: 'get',
          url: crxUrl,
          responseType: 'arraybuffer',
        });

        fs.writeFileSync(crxPath, response.data);
        safeLog(`📦 CRX downloaded to ${crxPath}`);

        // Unzip (Electron requires unpacked extensions)
        const zip = new AdmZip(crxPath);
        zip.extractAllTo(destDir, true); // overwrite
        safeLog(`📂 Extracted to ${destDir}`);

        // Load extension
        const ext = await session.defaultSession.loadExtension(destDir, { allowFileAccess: true });
        safeLog(`✅ Extension installed and loaded: ${ext.name}`);

        return { success: true, name: ext.name, id: ext.id };
      } catch (error) {
        safeError('Extension install/load failed:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    // Get all loaded extensions from the session
    ipcMain.handle('extensions:get-loaded', async () => {
      try {
        const extensions = session.defaultSession.getAllExtensions();
        const result = extensions.map((ext) => ({
          id: ext.id,
          name: ext.name,
          version: ext.version || '1.0.0',
          enabled: true,
          path: ext.path,
          // Try to get icon from manifest
          icon: ext.manifest?.icons
            ? ext.manifest.icons['128'] ||
              ext.manifest.icons['48'] ||
              ext.manifest.icons['32'] ||
              ext.manifest.icons['16']
            : null,
          iconPath: ext.path, // Base path for resolving icons
          description: ext.manifest?.description || '',
          permissions: ext.manifest?.permissions || [],
        }));
        safeLog(`📦 Loaded extensions: ${result.length}`);
        return { success: true, extensions: result };
      } catch (error) {
        safeError('Failed to get loaded extensions:', error);
        return { success: false, error: (error as Error).message, extensions: [] };
      }
    });

    // Import System Chrome Extensions (Manual Trigger)
    ipcMain.handle('extensions:import-system', async () => {
      try {
        if (process.platform !== 'darwin') {
          return { success: false, error: 'System import only supported on macOS' };
        }
        const fs = require('fs');
        const path = require('path');
        const os = require('os');
        // Need to import session if not available in this scope, but usually it is used from 'electron'
        // Using 'session.defaultSession' assumes 'session' is imported or available via 'electron.session'
        // In this class, 'session' is imported at top level typically.Checking imports...
        // Assuming session is available. If not, use 'electron.session'
        const { session } = require('electron');

        const chromeExtensions = path.join(
          os.homedir(),
          'Library',
          'Application Support',
          'Google',
          'Chrome',
          'Default',
          'Extensions'
        );
        if (!fs.existsSync(chromeExtensions)) {
          return { success: false, error: 'Chrome extensions directory not found' };
        }

        const extensionPaths: string[] = [];

        // Helper to find extensions recursively (simplified)
        const findExtensions = (dir: string, depth: number = 0): string[] => {
          if (depth > 3) return [];
          const results: string[] = [];
          try {
            if (fs.existsSync(path.join(dir, 'manifest.json'))) return [dir];
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            for (const entry of entries) {
              if (entry.isDirectory() && !entry.name.startsWith('.')) {
                results.push(...findExtensions(path.join(dir, entry.name), depth + 1));
              }
            }
          } catch (e) {}
          return results;
        };

        extensionPaths.push(...findExtensions(chromeExtensions));

        safeLog(
          `Found ${extensionPaths.length} system extensions to import path: ${chromeExtensions}`
        );

        let count = 0;
        for (const extPath of extensionPaths) {
          try {
            await session.defaultSession.loadExtension(extPath, { allowFileAccess: true });
            count++;
          } catch (e) {
            // skip failed
          }
        }
        return { success: true, count, message: `Imported ${count} system extensions` };
      } catch (error) {
        safeError('Failed to import system extensions:', error);
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('workflow:execute', async (_: any, workflow: any) => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('execute_workflow', [
            JSON.stringify(workflow),
          ]);
        }
        return { success: false, error: 'Backend not available' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('workflow:list', async () => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('list_workflows', []);
        }
        return { success: false, error: 'Backend not available' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Prompt management integration - Diverted to API Server
    ipcMain.handle('prompt:get-templates', async () => {
      try {
        const response = await fetch('http://localhost:3000/api/prompt-templates');
        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const templates = await response.json();
        return templates;
      } catch (error) {
        console.error('Failed to fetch prompt templates:', error);
        // Fallback to empty array or local storage if offline logic existed
        // But for now, returning empty to indicate failure/no data
        return [];
      }
    });

    ipcMain.handle('prompt:create-template', async (_: any, template: any) => {
      try {
        const response = await fetch('http://localhost:3000/api/prompt-templates', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(template),
        });

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }

        const newTemplate = await response.json();
        return newTemplate;
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('prompt:generate', async (_: any, templateId: string, variables: any) => {
      try {
        // Assuming API has a compile endpoint
        const response = await fetch(
          `http://localhost:3000/api/prompt-templates/${templateId}/compile`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ variables }),
          }
        );

        if (!response.ok) {
          throw new Error(`API Error: ${response.statusText}`);
        }
        const result = await response.json();
        return { success: true, result: result.content }; // Assuming result has content
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Extension management handlers with Chrome integration
    ipcMain.handle('extensions:get-installed', async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const os = require('os');

        // Real Chrome extension detection
        const extensions: any[] = [];

        // Check local unpacked extensions first
        const localExtensionsPath = path.join(__dirname, '../../extensions');
        if (fs.existsSync(localExtensionsPath)) {
          const extensionDirs = fs
            .readdirSync(localExtensionsPath, { withFileTypes: true })
            .filter((dirent: any) => dirent.isDirectory())
            .map((dirent: any) => dirent.name);

          for (const dir of extensionDirs) {
            const manifestPath = path.join(localExtensionsPath, dir, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
              try {
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                extensions.push({
                  name: manifest.name || dir,
                  version: manifest.version || '1.0.0',
                  enabled: true,
                  type: 'local',
                  path: path.join(localExtensionsPath, dir),
                  id: `local-${dir}`,
                });
              } catch (err) {
                safeWarn(`Failed to read manifest for ${dir}:`, err);
              }
            }
          }
        }

        // Try to read Chrome's extension directory
        let chromeExtensionsPath = '';
        if (process.platform === 'darwin') {
          chromeExtensionsPath = path.join(
            os.homedir(),
            'Library/Application Support/Google/Chrome/Default/Extensions'
          );
        } else if (process.platform === 'win32') {
          chromeExtensionsPath = path.join(
            os.homedir(),
            'AppData/Local/Google/Chrome/User Data/Default/Extensions'
          );
        } else {
          chromeExtensionsPath = path.join(
            os.homedir(),
            '.config/google-chrome/Default/Extensions'
          );
        }

        if (fs.existsSync(chromeExtensionsPath)) {
          try {
            const chromeExtensions = fs.readdirSync(chromeExtensionsPath);
            for (const extId of chromeExtensions.slice(0, 10)) {
              // Limit to first 10 for performance
              const extPath = path.join(chromeExtensionsPath, extId);
              if (fs.statSync(extPath).isDirectory()) {
                // Look for the latest version
                const versions = fs.readdirSync(extPath);
                if (versions.length > 0) {
                  const latestVersion = versions[versions.length - 1];
                  const manifestPath = path.join(extPath, latestVersion, 'manifest.json');
                  if (fs.existsSync(manifestPath)) {
                    try {
                      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
                      extensions.push({
                        name: manifest.name || 'Unknown Extension',
                        version: manifest.version || latestVersion,
                        enabled: true,
                        type: 'chrome-installed',
                        id: extId,
                        path: path.join(extPath, latestVersion),
                      });
                    } catch (err) {
                      // Skip invalid manifests
                    }
                  }
                }
              }
            }
          } catch (err) {
            safeWarn('Failed to read Chrome extensions:', err);
          }
        }

        return { success: true, extensions };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Auto-load local extensions into Chrome
    ipcMain.handle('extensions:auto-load-local', async () => {
      try {
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');

        const localExtensionsPath = path.join(__dirname, '../../extensions');
        const results: any[] = [];

        if (fs.existsSync(localExtensionsPath)) {
          const extensionDirs = fs
            .readdirSync(localExtensionsPath, { withFileTypes: true })
            .filter((dirent: any) => dirent.isDirectory())
            .map((dirent: any) => dirent.name);

          for (const dir of extensionDirs) {
            const manifestPath = path.join(localExtensionsPath, dir, 'manifest.json');
            if (fs.existsSync(manifestPath)) {
              try {
                const extensionPath = path.join(localExtensionsPath, dir);
                const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

                // Try to load extension in Chrome
                if (process.platform === 'darwin') {
                  try {
                    // Check if Chrome is running
                    try {
                      execSync('pgrep -f "Google Chrome"', { stdio: 'pipe' });
                    } catch {
                      // Start Chrome if not running
                      execSync('open -a "Google Chrome"', { stdio: 'pipe' });
                      await new Promise((resolve) => setTimeout(resolve, 3000));
                    }

                    const script = `
                      tell application "Google Chrome"
                        set foundTab to false
                        repeat with w in windows
                          repeat with t in tabs of w
                            if URL of t contains "chrome://extensions" then
                              set active tab index of w to index of t
                              set foundTab to true
                              exit repeat
                            end if
                          end repeat
                          if foundTab then exit repeat
                        end repeat

                        if not foundTab then
                          tell window 1 to make new tab with properties {URL:"chrome://extensions/"}
                        end if

                        activate
                        delay 2
                      end tell

                      tell application "System Events"
                        tell process "Google Chrome"
                          -- Enable Developer mode if not already enabled
                          try
                            click button "Developer mode" of group 1 of group 1 of tab group 1 of splitter group 1 of window 1
                            delay 1
                          on error
                            -- Developer mode might already be enabled
                          end try

                          -- Click Load unpacked
                          click button "Load unpacked" of group 1 of group 1 of tab group 1 of splitter group 1 of window 1
                          delay 2

                          -- Use the file dialog
                          keystroke "g" using {command down, shift down}
                          delay 1
                          keystroke "${extensionPath}"
                          delay 1
                          keystroke return
                          delay 1
                          click button "Choose" of sheet 1 of window 1
                        end tell
                      end tell
                    `;

                    execSync(`osascript -e '${script}'`, { stdio: 'pipe' });

                    results.push({
                      success: true,
                      extension: {
                        name: manifest.name || dir,
                        version: manifest.version || '1.0.0',
                        type: 'local-loaded',
                        path: extensionPath,
                        id: `local-${dir}`,
                      },
                    });

                    // Wait between extensions to avoid overwhelming the system
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                  } catch (scriptError) {
                    results.push({
                      success: false,
                      extension: {
                        name: manifest.name || dir,
                        path: extensionPath,
                        id: `local-${dir}`,
                      },
                      error: 'AppleScript failed: ' + (scriptError as Error).message,
                    });
                  }
                } else {
                  // For non-macOS platforms, provide manual instructions
                  results.push({
                    success: false,
                    extension: {
                      name: manifest.name || dir,
                      path: extensionPath,
                      id: `local-${dir}`,
                    },
                    error:
                      'Automatic loading only supported on macOS. Please manually load from: ' +
                      extensionPath,
                  });
                }
              } catch (err) {
                results.push({
                  success: false,
                  extension: { name: dir, path: path.join(localExtensionsPath, dir) },
                  error: 'Invalid manifest: ' + (err as Error).message,
                });
              }
            }
          }
        }

        return { success: true, results, message: `Processed ${results.length} local extensions` };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('dialog:open-directory', async (_: any, options: any) => {
      try {
        const { dialog } = require('electron');
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          title: options.title || 'Select Directory',
          properties: options.properties || ['openDirectory'],
        });

        return result;
      } catch (error) {
        return { canceled: true, error: (error as Error).message };
      }
    });

    ipcMain.handle('extensions:load-unpacked', async (_: any, extensionPath: string) => {
      try {
        // Real Chrome extension loading implementation
        const fs = require('fs');
        const path = require('path');
        const { execSync } = require('child_process');

        const manifestPath = path.join(extensionPath, 'manifest.json');
        if (fs.existsSync(manifestPath)) {
          const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

          // Try to load extension in Chrome via AppleScript (macOS)
          if (process.platform === 'darwin') {
            try {
              const script = `
                tell application "Google Chrome"
                  activate
                  delay 1
                  open location "chrome://extensions/"
                  delay 2
                end tell

                tell application "System Events"
                  tell process "Google Chrome"
                    -- Enable Developer mode if not already enabled
                    click button "Developer mode" of group 1 of group 1 of tab group 1 of splitter group 1 of window 1
                    delay 1

                    -- Click Load unpacked
                    click button "Load unpacked" of group 1 of group 1 of tab group 1 of splitter group 1 of window 1
                    delay 1

                    -- Navigate to extension directory
                    keystroke "${extensionPath}"
                    keystroke return
                    delay 1
                    click button "Open" of sheet 1 of window 1
                  end tell
                end tell
              `;

              execSync(`osascript -e '${script}'`);

              return {
                success: true,
                extension: {
                  name: manifest.name || 'Unknown Extension',
                  version: manifest.version || '1.0.0',
                  type: 'unpacked',
                  path: extensionPath,
                  loaded: true,
                },
              };
            } catch (scriptError) {
              safeError('AppleScript extension loading failed:', scriptError);
              // Fall back to manual instructions
              return {
                success: true,
                extension: {
                  name: manifest.name || 'Unknown Extension',
                  version: manifest.version || '1.0.0',
                  type: 'unpacked',
                  path: extensionPath,
                  loaded: false,
                  instructions: 'Please manually load the extension in Chrome://extensions',
                },
              };
            }
          } else {
            // For Windows/Linux, provide manual instructions
            return {
              success: true,
              extension: {
                name: manifest.name || 'Unknown Extension',
                version: manifest.version || '1.0.0',
                type: 'unpacked',
                path: extensionPath,
                loaded: false,
                instructions:
                  'Open chrome://extensions, enable Developer mode, and click Load unpacked',
              },
            };
          }
        } else {
          return { success: false, error: 'No manifest.json found in selected directory' };
        }
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Real Chrome Extension Management
    ipcMain.handle('chrome:get-real-extensions', async () => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('get_real_extensions', []);
        }
        return { success: false, error: 'Backend not available' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Toggle Chrome Extension
    ipcMain.handle(
      'chrome:toggle-extension',
      async (_: any, extensionId: string, enabled: boolean) => {
        try {
          if (process.platform === 'darwin') {
            const { execSync } = require('child_process');

            const script = `
            tell application "Google Chrome"
              activate
              open location "chrome://extensions/"
              delay 2
            end tell

            tell application "System Events"
              tell process "Google Chrome"
                -- Look for the extension toggle button
                -- This is a simplified approach
                delay 1
              end tell
            end tell
          `;

            execSync(`osascript -e '${script}'`);
            return { success: true, message: `Extension ${enabled ? 'enabled' : 'disabled'}` };
          }

          return { success: false, error: 'Chrome integration only available on macOS' };
        } catch (error) {
          return { success: false, error: (error as Error).message };
        }
      }
    );

    // Open Chrome Extension Options
    ipcMain.handle('chrome:open-extension-options', async (_: any, extensionId: string) => {
      try {
        if (process.platform === 'darwin') {
          const { execSync } = require('child_process');

          const script = `
            tell application "Google Chrome"
              activate
              open location "chrome-extension://${extensionId}/options.html"
            end tell
          `;

          execSync(`osascript -e '${script}'`);
          return { success: true };
        }

        return { success: false, error: 'Chrome integration only available on macOS' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Install Extension from Chrome Web Store
    ipcMain.handle('chrome:install-extension', async (_: any, extensionUrl: string) => {
      try {
        if (process.platform === 'darwin') {
          const { execSync } = require('child_process');

          const script = `
            tell application "Google Chrome"
              activate
              open location "${extensionUrl}"
              delay 3
            end tell

            tell application "System Events"
              tell process "Google Chrome"
                -- Click Add to Chrome button
                try
                  click button "Add to Chrome" of group 1 of tab group 1 of splitter group 1 of window 1
                  delay 2
                  click button "Add extension" of sheet 1 of window 1
                on error
                  -- Extension might already be installed or button not found
                end try
              end tell
            end tell
          `;

          execSync(`osascript -e '${script}'`);
          return { success: true, message: 'Extension installation initiated' };
        }

        return { success: false, error: 'Chrome integration only available on macOS' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Terminal integration handlers
    ipcMain.handle('app:open-terminal', async () => {
      try {
        if (process.platform === 'darwin') {
          const { execSync } = require('child_process');
          execSync('open -a Terminal');
          return { success: true };
        } else if (process.platform === 'win32') {
          const { execSync } = require('child_process');
          execSync('start cmd');
          return { success: true };
        } else {
          const { execSync } = require('child_process');
          execSync('gnome-terminal &');
          return { success: true };
        }
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    ipcMain.handle('terminal:get-output', async () => {
      // Return mock terminal output for now
      return {
        success: true,
        output: 'TNF Terminal Ready\n$ ',
      };
    });

    ipcMain.handle('terminal:clear', async () => {
      // Clear terminal command
      return { success: true };
    });

    // Real service status from backend
    ipcMain.handle('services:list', async () => {
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3004/api/services/status');
        return { success: true, services: response.data };
      } catch (error) {
        // Fallback to local service detection
        const services = await this.detectLocalServices();
        return { success: true, services };
      }
    });

    ipcMain.handle('system:metrics', async () => {
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3004/api/system/metrics');
        return { success: true, metrics: response.data };
      } catch (error) {
        // Fallback to local metrics
        return {
          success: true,
          metrics: {
            uptime: process.uptime() * 1000,
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            platform: process.platform,
            version: process.version,
          },
        };
      }
    });

    ipcMain.handle('system:resources', async () => {
      return {
        success: true,
        resources: {
          memory: {
            used: process.memoryUsage().heapUsed,
            total: process.memoryUsage().heapTotal,
          },
          cpu: process.cpuUsage(),
          uptime: process.uptime(),
        },
      };
    });

    ipcMain.handle('system:tools', async () => {
      try {
        const axios = require('axios');
        const response = await axios.get('http://localhost:3004/api/system/tools');
        return { success: true, tools: response.data };
      } catch (error) {
        // Detect real local tools
        const tools = await this.detectSystemTools();
        return { success: true, tools };
      }
    });

    // ===========================================
    // LOCAL DEV TOOLS IPC HANDLERS
    // ===========================================

    // Run arbitrary commands in the project directory
    ipcMain.handle('dev:run-command', async (_: any, command: string, cwd?: string) => {
      try {
        const { exec } = require('child_process');
        const path = require('path');

        // Default to project root if no cwd provided
        const workingDir = cwd || path.join(__dirname, '../../../../..');

        return new Promise((resolve) => {
          exec(
            command,
            { cwd: workingDir, maxBuffer: 1024 * 1024 * 10 },
            (error: any, stdout: string, stderr: string) => {
              if (error) {
                resolve({ success: false, error: error.message, stderr, stdout });
              } else {
                resolve({ success: true, stdout, stderr });
              }
            }
          );
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Scan for active ports
    ipcMain.handle('dev:scan-ports', async () => {
      try {
        const { exec } = require('child_process');

        return new Promise((resolve) => {
          let command: string;

          if (process.platform === 'darwin' || process.platform === 'linux') {
            command = 'lsof -i -P -n | grep LISTEN';
          } else if (process.platform === 'win32') {
            command = 'netstat -an | findstr LISTENING';
          } else {
            resolve({ success: false, error: 'Unsupported platform' });
            return;
          }

          exec(command, { maxBuffer: 1024 * 1024 }, (error: any, stdout: string) => {
            if (error && !stdout) {
              resolve({ success: true, ports: [] }); // No ports listening
              return;
            }

            const ports: any[] = [];
            const lines = stdout.split('\n').filter(Boolean);

            for (const line of lines) {
              // Parse lsof/netstat output
              if (process.platform === 'darwin' || process.platform === 'linux') {
                const match = line.match(
                  /(\S+)\s+(\d+)\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+\S+\s+(\S+):(\d+)/
                );
                if (match) {
                  ports.push({
                    process: match[1],
                    pid: match[2],
                    address: match[3],
                    port: parseInt(match[4]),
                  });
                }
              } else {
                const match = line.match(/:(\d+)\s+.*LISTENING/);
                if (match) {
                  ports.push({ port: parseInt(match[1]) });
                }
              }
            }

            // Filter to common dev ports
            const devPorts = ports.filter((p) =>
              [
                3000, 3001, 3004, 3005, 3006, 3007, 5173, 5174, 5432, 6379, 8080, 8081, 9229,
              ].includes(p.port)
            );

            resolve({ success: true, ports: devPorts, allPorts: ports });
          });
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Kill a process on a specific port
    ipcMain.handle('dev:kill-port', async (_: any, port: number) => {
      try {
        const { exec } = require('child_process');

        return new Promise((resolve) => {
          let command: string;

          if (process.platform === 'darwin' || process.platform === 'linux') {
            command = `lsof -ti:${port} | xargs kill -9 2>/dev/null || true`;
          } else if (process.platform === 'win32') {
            command = `FOR /F "tokens=5" %P IN ('netstat -ano ^| findstr :${port}') DO taskkill /F /PID %P`;
          } else {
            resolve({ success: false, error: 'Unsupported platform' });
            return;
          }

          exec(command, (error: any, stdout: string, stderr: string) => {
            if (error && stderr) {
              resolve({ success: false, error: stderr });
            } else {
              resolve({ success: true, message: `Killed processes on port ${port}` });
            }
          });
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Get service status for all known services
    ipcMain.handle('dev:service-status', async () => {
      try {
        const axios = require('axios');
        const services = [
          { name: 'Frontend', port: 3000, type: 'web' },
          { name: 'Backend', port: 3004, type: 'api' },
          { name: 'API Gateway', port: 3005, type: 'gateway' },
          { name: 'Redis', port: 6379, type: 'cache' },
        ];

        const results = await Promise.all(
          services.map(async (service) => {
            try {
              if (service.name === 'Redis') {
                // Redis doesn't respond to HTTP, check if port is in use
                const { exec } = require('child_process');
                const isListening = await new Promise<boolean>((resolve) => {
                  exec(`lsof -i:${service.port} | grep LISTEN`, (error: any, stdout: string) => {
                    resolve(!!stdout);
                  });
                });
                return { ...service, status: isListening ? 'running' : 'stopped' };
              }

              await axios.get(`http://localhost:${service.port}`, { timeout: 2000 });
              return { ...service, status: 'running' };
            } catch {
              return { ...service, status: 'stopped' };
            }
          })
        );

        return { success: true, services: results };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Start a specific service
    ipcMain.handle('dev:start-service', async (_: any, service: string) => {
      try {
        const { spawn } = require('child_process');
        const path = require('path');

        const projectRoot = path.join(__dirname, '../../../../..');
        let command: string;
        let args: string[];

        switch (service.toLowerCase()) {
          case 'frontend':
            command = 'pnpm';
            args = ['--filter', '@the-new-fuse/frontend', 'dev'];
            break;
          case 'backend':
            command = 'pnpm';
            args = ['--filter', '@the-new-fuse/backend', 'dev'];
            break;
          case 'api':
          case 'api-gateway':
            command = 'pnpm';
            args = ['--filter', '@the-new-fuse/api-gateway', 'dev'];
            break;
          case 'redis':
            command = 'redis-server';
            args = [];
            break;
          default:
            return { success: false, error: `Unknown service: ${service}` };
        }

        const child = spawn(command, args, {
          cwd: projectRoot,
          detached: true,
          stdio: 'ignore',
        });

        child.unref();

        return { success: true, message: `Started ${service}`, pid: child.pid };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Stop a specific service
    ipcMain.handle('dev:stop-service', async (_: any, service: string) => {
      try {
        const portMap: Record<string, number> = {
          frontend: 3000,
          backend: 3004,
          api: 3005,
          'api-gateway': 3005,
          redis: 6379,
        };

        const port = portMap[service.toLowerCase()];
        if (!port) {
          return { success: false, error: `Unknown service: ${service}` };
        }

        // Reuse the kill-port logic
        const { exec } = require('child_process');

        return new Promise((resolve) => {
          exec(`lsof -ti:${port} | xargs kill -9 2>/dev/null || true`, (error: any) => {
            resolve({ success: true, message: `Stopped ${service}` });
          });
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Restart a service
    ipcMain.handle('dev:restart-service', async (event: any, service: string) => {
      try {
        // Stop then start
        await ipcMain.emit('dev:stop-service', event, service);
        await new Promise((resolve) => setTimeout(resolve, 1000));
        return await ipcMain.emit('dev:start-service', event, service);
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Build all packages
    ipcMain.handle('dev:build-all', async () => {
      try {
        const { exec } = require('child_process');
        const path = require('path');

        const projectRoot = path.join(__dirname, '../../../../..');

        return new Promise((resolve) => {
          exec(
            'pnpm run build',
            { cwd: projectRoot, maxBuffer: 1024 * 1024 * 50 },
            (error: any, stdout: string, stderr: string) => {
              if (error) {
                resolve({ success: false, error: error.message, stdout, stderr });
              } else {
                resolve({ success: true, stdout, stderr });
              }
            }
          );
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Run tests
    ipcMain.handle('dev:run-tests', async () => {
      try {
        const { exec } = require('child_process');
        const path = require('path');

        const projectRoot = path.join(__dirname, '../../../../..');

        return new Promise((resolve) => {
          exec(
            'pnpm run test',
            { cwd: projectRoot, maxBuffer: 1024 * 1024 * 50 },
            (error: any, stdout: string, stderr: string) => {
              resolve({ success: !error, stdout, stderr, error: error?.message });
            }
          );
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Run linter
    ipcMain.handle('dev:run-lint', async () => {
      try {
        const { exec } = require('child_process');
        const path = require('path');

        const projectRoot = path.join(__dirname, '../../../../..');

        return new Promise((resolve) => {
          exec(
            'pnpm run lint',
            { cwd: projectRoot, maxBuffer: 1024 * 1024 * 50 },
            (error: any, stdout: string, stderr: string) => {
              resolve({ success: !error, stdout, stderr, error: error?.message });
            }
          );
        });
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });

    // Start dev mode (all services)
    ipcMain.handle('dev:start-dev-mode', async () => {
      try {
        const { spawn } = require('child_process');
        const path = require('path');

        const projectRoot = path.join(__dirname, '../../../../..');

        const child = spawn('pnpm', ['run', 'dev'], {
          cwd: projectRoot,
          detached: true,
          stdio: 'ignore',
        });

        child.unref();

        return { success: true, message: 'Started dev mode', pid: child.pid };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    });
  }

  // Helper method for detecting local services
  private async detectLocalServices(): Promise<any[]> {
    const axios = require('axios');
    const services = [
      { name: 'Frontend App', port: 3000, type: 'web' },
      { name: 'API Gateway', port: 3005, type: 'api' },
      { name: 'Backend App', port: 3004, type: 'backend' },
      { name: 'Theia IDE', port: 3007, type: 'ide' },
    ];

    const results = await Promise.all(
      services.map(async (service) => {
        try {
          await axios.get(`http://localhost:${service.port}`, { timeout: 1000 });
          return { ...service, status: 'running', health: 'healthy' };
        } catch {
          return { ...service, status: 'stopped', health: 'error' };
        }
      })
    );

    return results;
  }

  // Helper method for detecting system tools
  private async detectSystemTools(): Promise<any[]> {
    const tools: any[] = [];

    // Check Chrome installation
    try {
      const { execSync } = require('child_process');
      if (process.platform === 'darwin') {
        execSync('open -Ra "Google Chrome"');
        tools.push({ name: 'Chrome Browser', type: 'browser', status: 'active' });
      }
    } catch {}

    // Check terminal availability
    tools.push({ name: 'Terminal Integration', type: 'shell', status: 'active' });

    // Check workflow capabilities
    tools.push({ name: 'Workflow Builder', type: 'automation', status: 'active' });

    return tools;
  }
}

// Start the application
new ElectronMain();
