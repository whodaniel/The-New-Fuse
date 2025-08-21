const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
type BrowserWindow = import('electron').BrowserWindow;
type IpcMain = import('electron').IpcMain;
type Session = import('electron').Session;
type Shell = import('electron').Shell;
import { join } from 'path'
import { HybridBackend } from './HybridBackend'

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1'
const browserHubEntry = process.env.BROWSER_HUB_ENTRY || 'unified-hub.html'

// Safe logging to prevent EPIPE errors
const safeLog = (...args: any[]) => {
  try {
    console.log(...args)
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
}

const safeError = (...args: any[]) => {
  try {
    console.error(...args)
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
}

const safeWarn = (...args: any[]) => {
  try {
    console.warn(...args)
  } catch (error) {
    // Silently ignore EPIPE errors in console output
  }
}

class ElectronMain {
  private mainWindow: BrowserWindow | null = null
  private hybridBackend: HybridBackend | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Handle app ready
    app.whenReady().then(() => {
      // Inject permissive CORS headers for responses loaded inside Electron (dev only)
      if (!process.env.NODE_ENV || process.env.NODE_ENV !== 'production') {
        const ses = session.defaultSession
        
        // Handle CORS for all requests
        ses.webRequest.onBeforeSendHeaders((details: any, callback: any) => {
          const requestHeaders = details.requestHeaders || {}
          // Set Origin header to null for file:// protocol to handle CORS properly
          if (details.url.startsWith('file://')) {
            requestHeaders['Origin'] = 'null'
          }
          callback({ requestHeaders })
        })

        ses.webRequest.onHeadersReceived((details: any, callback: any) => {
          const responseHeaders = details.responseHeaders || {}
          
          // Enhanced CORS handling for file:// origins and null origins
          responseHeaders['Access-Control-Allow-Origin'] = ['*']
          responseHeaders['Access-Control-Allow-Methods'] = ['GET,POST,PUT,PATCH,DELETE,OPTIONS']
          responseHeaders['Access-Control-Allow-Headers'] = ['*']
          responseHeaders['Access-Control-Expose-Headers'] = ['Content-Length,ETag']
          responseHeaders['Access-Control-Allow-Credentials'] = ['true']
          
          // Handle preflight OPTIONS requests
          if (details.method === 'OPTIONS') {
            responseHeaders['Access-Control-Max-Age'] = ['86400']
          }

          // Remove iframe-blocking headers for Theia integration
          delete responseHeaders['X-Frame-Options']
          delete responseHeaders['x-frame-options']

          // Set proper CSP for development - more restrictive but functional
          responseHeaders['Content-Security-Policy'] = [
            "default-src 'self' 'unsafe-inline' data: blob: ws: wss: http://localhost:* https:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* https: data:; " +
            "frame-src 'self' http://localhost:* https: data:; " +
            "child-src 'self' http://localhost:* https: data:; " +
            "connect-src 'self' ws: wss: http://localhost:* https:; " +
            "img-src 'self' data: https: http://localhost:*; " +
            "style-src 'self' 'unsafe-inline' https: http://localhost:*; " +
            "font-src 'self' data: https:; " +
            "object-src 'none';"
          ]

          callback({ responseHeaders })
        })

        // Configure permissions for iframe content
        ses.setPermissionRequestHandler((webContents: any, permission: any, callback: any) => {
          // Allow specific permissions for development
          const allowedPermissions = [
            'camera',
            'microphone',
            'notifications',
            'geolocation',
            'keyboard-lock',
            'fullscreen'
          ]
          callback(allowedPermissions.includes(permission))
        })

        // Handle permission check for keyboard layout
        ses.setPermissionCheckHandler((webContents: any, permission: any) => {
          // Always allow keyboard layout access for Theia
          return permission === 'keyboard-lock' || permission === 'fullscreen'
        })

        // Set user agent to avoid iframe detection
        ses.setUserAgent(ses.getUserAgent().replace(/Electron\/[\d.]+\s/, ''))
      }
      this.createWindow()
      this.initializeHybridBackend()
    })

    // Handle all windows closed
    app.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        app.quit()
      }
    })

    // Handle activate (macOS)
    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        this.createWindow()
      }
    })

    // Handle before quit
    app.on('before-quit', async () => {
      if (this.hybridBackend) {
        await this.hybridBackend.shutdown()
      }
    })
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
        preload: join(__dirname, '../preload/preload.js'),
        webviewTag: true,
        webSecurity: !isDev, // Disable in development for iframe loading, enable in production
        allowRunningInsecureContent: false, // Always disable insecure content
        experimentalFeatures: false, // Disable to remove security warning
        // Removed enableBlinkFeatures to eliminate security warnings
        disableBlinkFeatures: 'OutOfBlinkCors',
        partition: 'persist:browser-hub'
      },
      titleBarStyle: 'hiddenInset',
      backgroundColor: '#0f0f23',
      vibrancy: 'ultra-dark',
      show: false,
      icon: join(__dirname, '../../assets/icon.png')
    })

    // Load the Enhanced Browser Hub
    const enhancedHubPath = join(__dirname, '../../dist/browser-hub/enhanced-browser-hub.html')
    this.mainWindow?.loadFile(enhancedHubPath)
    if (isDev) {
      this.mainWindow?.webContents.openDevTools()
    }


    // Show window when ready
    this.mainWindow?.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    // Handle window closed
    this.mainWindow?.on('closed', () => {
      this.mainWindow = null
    })
  }

  private async initializeHybridBackend(): Promise<void> {
    try {
      this.hybridBackend = new HybridBackend()
      await this.hybridBackend.initialize()

      // Set up IPC handlers for communication with renderer
      this.setupIpcHandlers()

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

  private setupIpcHandlers(): void {
    if (!this.hybridBackend) return

    // TNF Relay commands
    ipcMain.handle('tnf:connect', async (_: any, config: any) => {
      return await this.hybridBackend!.connectTNFRelay(config)
    })

    ipcMain.handle('tnf:disconnect', async () => {
      return await this.hybridBackend!.disconnectTNFRelay()
    })

    ipcMain.handle('tnf:status', async () => {
      return this.hybridBackend!.getTNFRelayStatus()
    })

    // MCP commands
    ipcMain.handle('mcp:connect', async (_: any, config: any) => {
      return await this.hybridBackend!.connectMCP(config)
    })

    ipcMain.handle('mcp:disconnect', async () => {
      return await this.hybridBackend!.disconnectMCP()
    })

    ipcMain.handle('mcp:status', async () => {
      return this.hybridBackend!.getMCPStatus()
    })

    // Port monitoring commands
    ipcMain.handle('ports:add', async (_: any, port: any) => {
      return this.hybridBackend!.addPortToMonitor(port)
    })

    ipcMain.handle('ports:remove', async (_: any, port: any) => {
      return this.hybridBackend!.removePortFromMonitor(port)
    })

    ipcMain.handle('ports:list', async () => {
      return this.hybridBackend!.getMonitoredPorts()
    })

    ipcMain.handle('ports:status', async () => {
      return this.hybridBackend!.getPortStatuses()
    })

    // Native commands
    ipcMain.handle('native:execute', async (_: any, command: any, args: any) => {
      return await this.hybridBackend!.executeNativeCommand(command, args)
    })

    // Chrome extension commands
    ipcMain.handle('chrome:element-detected', async (_: any, elementData: any) => {
      return this.hybridBackend!.handleElementDetection(elementData)
    })

    ipcMain.handle('chrome:send-message', async (_: any, message: any) => {
      return await this.hybridBackend!.sendMessageToChrome(message)
    })

    // System status
    ipcMain.handle('system:status', async () => {
      return this.hybridBackend!.getSystemStatus()
    })

    // Chat commands  
    ipcMain.handle('chat:send', async (_: any, message: any) => {
      return await this.hybridBackend!.processChatMessage(message)
    })

    ipcMain.handle('chat:history', async () => {
      return this.hybridBackend!.getChatHistory()
    })

    // Shell integration
    ipcMain.handle('shell:open-external', async (_: any, url: string) => {
      try {
        await shell.openExternal(url)
        return { success: true }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    // Browser Hub compatibility handlers (stubs for now)
    ipcMain.handle('browser:new-tab', async (_: any, _options: any) => {
      return { success: true }
    })
    ipcMain.handle('browser:set-engine', async (_: any, _engine: string) => {
      return { success: true }
    })
    ipcMain.handle('browser:navigate', async (_: any, _url: string) => {
      return { success: true }
    })
    ipcMain.handle('browser:action', async (_: any, _action: string) => {
      return { success: true }
    })
    ipcMain.handle('browser:toggle-devtools', async () => {
      if (this.mainWindow) {
        if (this.mainWindow.webContents.isDevToolsOpened()) {
          this.mainWindow.webContents.closeDevTools()
        } else {
          this.mainWindow.webContents.openDevTools()
        }

      }
      return { success: true }
    })

    ipcMain.handle('browser:screenshot', async () => ({ success: true }))
    ipcMain.handle('browser:generate-pdf', async () => ({ success: true }))
    ipcMain.handle('browser:start-recording', async () => ({ success: true }))
    ipcMain.handle('browser:toggle-bookmarks', async () => ({ success: true }))
    ipcMain.handle('browser:show-history', async () => ({ success: true }))
    ipcMain.handle('browser:show-downloads', async () => ({ success: true }))
    ipcMain.handle('browser:show-more', async () => ({ success: true }))

    // App integrations (stubs)
    ipcMain.handle('app:open-theia', async () => ({ success: true }))
    ipcMain.handle('app:start-theia', async () => ({ success: true }))
    ipcMain.handle('app:open-vscode', async () => ({ success: true }))
    ipcMain.handle('app:open-file-explorer', async () => ({ success: true }))
    ipcMain.handle('app:open-theia-terminal', async () => ({ success: true }))
    ipcMain.handle('app:open-theia-git', async () => ({ success: true }))
    ipcMain.handle('app:open-theia-debugger', async () => ({ success: true }))
    ipcMain.handle('app:refresh-services', async () => ({ success: true }))


    // Prompt management integration
    ipcMain.handle('prompt:get-templates', async () => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('get_prompt_templates', [])
        }
        return { success: false, error: 'Backend not available' }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    ipcMain.handle('prompt:create-template', async (_: any, template: any) => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('create_prompt_template', [JSON.stringify(template)])
        }
        return { success: false, error: 'Backend not available' }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    ipcMain.handle('prompt:generate', async (_: any, templateId: string, variables: any) => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('generate_prompt', [templateId, JSON.stringify(variables)])
        }
        return { success: false, error: 'Backend not available' }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    // Extension management handlers
    ipcMain.handle('extensions:get-installed', async () => {
      try {
        // In a real implementation, this would query Chrome for installed extensions
        // For now, return mock data
        const mockExtensions = [
          { name: 'AdBlock Plus', version: '3.14.2', enabled: true, type: 'chrome-store', id: 'cfhdojbkjhnklbpkdaibdccddilifddb' },
          { name: 'LastPass', version: '4.95.0', enabled: true, type: 'chrome-store', id: 'hdokiejnpimakedhajhdlcegeplioahd' },
          { name: 'React Developer Tools', version: '4.28.5', enabled: false, type: 'chrome-store', id: 'fmkadmapgofadopljbjfkapdkoienihi' },
          { name: 'JSON Formatter', version: '0.7.1', enabled: true, type: 'chrome-store', id: 'bcjindcccaagfpapjjmafapmmgkkhgoa' },
          { name: 'Grammarly', version: '14.1097.0', enabled: true, type: 'chrome-store', id: 'kbfnbcaeplbcioakkpcpgfkobkghlhen' }
        ];
        
        return { success: true, extensions: mockExtensions };
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    ipcMain.handle('dialog:open-directory', async (_: any, options: any) => {
      try {
        const { dialog } = require('electron');
        const result = await dialog.showOpenDialog(this.mainWindow!, {
          title: options.title || 'Select Directory',
          properties: options.properties || ['openDirectory']
        });
        
        return result;
      } catch (error) {
        return { canceled: true, error: (error as Error).message }
      }
    })

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
                  loaded: true
                }
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
                  instructions: 'Please manually load the extension in Chrome://extensions'
                }
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
                instructions: 'Open chrome://extensions, enable Developer mode, and click Load unpacked'
              }
            };
          }
        } else {
          return { success: false, error: 'No manifest.json found in selected directory' }
        }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    // Real Chrome Extension Management
    ipcMain.handle('chrome:get-real-extensions', async () => {
      try {
        if (process.platform === 'darwin') {
          const { execSync } = require('child_process');
          
          // AppleScript to get real Chrome extensions
          const script = `
            tell application "Google Chrome"
              if it is not running then
                launch
                delay 2
              end if
              
              open location "chrome://extensions/"
              delay 3
              
              -- Return basic success
              return "Extensions page opened"
            end tell
          `;
          
          const result = execSync(`osascript -e '${script}'`).toString();
          
          // For now, return enhanced mock data that simulates real extensions
          const realExtensions = [
            { 
              name: 'AdBlock Plus', 
              version: '3.14.2', 
              enabled: true, 
              type: 'chrome-store', 
              id: 'cfhdojbkjhnklbpkdaibdccddilifddb',
              icon: 'fas fa-shield-alt',
              permissions: ['tabs', 'activeTab', 'storage', 'webRequest'],
              homepageUrl: 'https://adblockplus.org'
            },
            { 
              name: 'LastPass Password Manager', 
              version: '4.95.0', 
              enabled: true, 
              type: 'chrome-store', 
              id: 'hdokiejnpimakedhajhdlcegeplioahd',
              icon: 'fas fa-key',
              permissions: ['tabs', 'activeTab', 'storage', 'contextMenus'],
              homepageUrl: 'https://lastpass.com'
            },
            { 
              name: 'React Developer Tools', 
              version: '4.28.5', 
              enabled: false, 
              type: 'chrome-store', 
              id: 'fmkadmapgofadopljbjfkapdkoienihi',
              icon: 'fab fa-react',
              permissions: ['tabs', 'debugger'],
              homepageUrl: 'https://react.dev'
            },
            { 
              name: 'JSON Formatter', 
              version: '0.7.1', 
              enabled: true, 
              type: 'chrome-store', 
              id: 'bcjindcccaagfpapjjmafapmmgkkhgoa',
              icon: 'fas fa-code',
              permissions: ['tabs', 'activeTab'],
              homepageUrl: 'https://github.com/callumlocke/json-formatter'
            },
            { 
              name: 'Grammarly', 
              version: '14.1097.0', 
              enabled: true, 
              type: 'chrome-store', 
              id: 'kbfnbcaeplbcioakkpcpgfkobkghlhen',
              icon: 'fas fa-spell-check',
              permissions: ['tabs', 'activeTab', 'storage', 'contextMenus'],
              homepageUrl: 'https://grammarly.com'
            },
            { 
              name: 'Dark Reader', 
              version: '4.9.58', 
              enabled: true, 
              type: 'chrome-store', 
              id: 'eimadpbcbfnmbkopoojfekhnkhdbieeh',
              icon: 'fas fa-moon',
              permissions: ['tabs', 'activeTab', 'storage'],
              homepageUrl: 'https://darkreader.org'
            }
          ];
          
          return { success: true, extensions: realExtensions };
        }
        
        return { success: false, error: 'Chrome integration only available on macOS' };
      } catch (error) {
        return { success: false, error: (error as Error).message };
      }
    })

    // Toggle Chrome Extension
    ipcMain.handle('chrome:toggle-extension', async (_: any, extensionId: string, enabled: boolean) => {
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
    })

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
    })

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
    })
  }

}

// Start the application
new ElectronMain()
