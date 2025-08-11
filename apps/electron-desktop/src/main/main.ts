const { app, BrowserWindow, ipcMain, session, shell } = require('electron');
type BrowserWindow = import('electron').BrowserWindow;
type IpcMain = import('electron').IpcMain;
type Session = import('electron').Session;
type Shell = import('electron').Shell;
import { join } from 'path'
import { HybridBackend } from './HybridBackend'

const isDev = process.env.NODE_ENV === 'development' || process.env.ELECTRON_DEV === '1'
const browserHubEntry = process.env.BROWSER_HUB_ENTRY || 'unified-hub.html'

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
        ses.webRequest.onHeadersReceived((details: any, callback: any) => {
          const responseHeaders = details.responseHeaders || {}
          responseHeaders['Access-Control-Allow-Origin'] = ['*']
          responseHeaders['Access-Control-Allow-Methods'] = ['GET,POST,PUT,PATCH,DELETE,OPTIONS']
          responseHeaders['Access-Control-Allow-Headers'] = ['*']
          responseHeaders['Access-Control-Expose-Headers'] = ['Content-Length,ETag']

          // Remove iframe-blocking headers for Theia integration
          delete responseHeaders['X-Frame-Options']
          delete responseHeaders['x-frame-options']

          // Set proper CSP for development
          responseHeaders['Content-Security-Policy'] = [
            "default-src 'self' 'unsafe-inline' data: blob: ws: wss: http: https:; " +
            "script-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; " +
            "frame-src *; child-src *; object-src *;"
          ]

          callback({ responseHeaders })
        })

        // Configure permissions for iframe content
        ses.setPermissionRequestHandler((webContents: any, permission: any, callback: any) => {
          // Allow all permissions for development
          callback(true)
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
        webSecurity: true, // Always enable web security
        allowRunningInsecureContent: false, // Disable insecure content
        experimentalFeatures: true,
        enableBlinkFeatures: 'CSSColorSchemeUARendering',
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
      console.log('Attempting to start API service...');
      await this.hybridBackend.executeNativeCommand('start_service', ['api']);
      console.log('Attempting to start Backend service...');
      await this.hybridBackend.executeNativeCommand('start_service', ['backend']);

      // Initial system status update in main.ts
      this.updateSystemStatus(); // Call once immediately
      setInterval(() => this.updateSystemStatus(), 5000); // Update every 5 seconds

    } catch (error) {
      console.error('Failed to initialize HybridBackend or start services:', error);
    }
  }

  // Add this new method to send system status updates to the renderer
  private async updateSystemStatus(): Promise<void> {
    if (!this.hybridBackend || !this.mainWindow) return;
    try {
      const status = await this.hybridBackend.executeNativeCommand('get_all_service_statuses', []);
      this.mainWindow.webContents.send('system-status-update', status);
    } catch (error) {
      console.error('Failed to get system status:', error);
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
    ipcMain.handle('app:open-terminal', async () => ({ success: true }))
    ipcMain.handle('app:open-file-explorer', async () => ({ success: true }))
    ipcMain.handle('app:open-theia-terminal', async () => ({ success: true }))
    ipcMain.handle('app:open-theia-git', async () => ({ success: true }))
    ipcMain.handle('app:open-theia-debugger', async () => ({ success: true }))
    ipcMain.handle('app:refresh-services', async () => ({ success: true }))

    // Terminal integration
    ipcMain.handle('terminal:get-output', async () => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('get_terminal_output', [])
        }
        return { success: false, error: 'Backend not available' }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

    ipcMain.handle('terminal:clear', async () => {
      try {
        if (this.hybridBackend) {
          return await this.hybridBackend.executeNativeCommand('clear_terminal', [])
        }
        return { success: false, error: 'Backend not available' }
      } catch (error) {
        return { success: false, error: (error as Error).message }
      }
    })

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
  }

}

// Start the application
new ElectronMain()
