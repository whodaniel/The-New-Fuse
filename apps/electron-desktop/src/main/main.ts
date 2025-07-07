import { app, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { HybridBackend } from './HybridBackend'

const isDev = process.env.NODE_ENV === 'development'

class ElectronMain {
  private mainWindow: BrowserWindow | null = null
  private hybridBackend: HybridBackend | null = null

  constructor() {
    this.init()
  }

  private async init() {
    // Handle app ready
    app.whenReady().then(() => {
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
    // Create the browser window
    this.mainWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      minWidth: 800,
      minHeight: 600,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: join(__dirname, '../preload/preload.js')
      },
      titleBarStyle: 'hiddenInset',
      show: false,
      icon: join(__dirname, '../../assets/icon.png')
    })

    // Load the renderer
    if (isDev) {
      this.mainWindow.loadURL('http://localhost:5173')
      this.mainWindow.webContents.openDevTools()
    } else {
      this.mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
    }

    // Show window when ready
    this.mainWindow.once('ready-to-show', () => {
      this.mainWindow?.show()
    })

    // Handle window closed
    this.mainWindow.on('closed', () => {
      this.mainWindow = null
    })
  }

  private async initializeHybridBackend(): Promise<void> {
    try {
      this.hybridBackend = new HybridBackend()
      await this.hybridBackend.initialize()
      
      // Set up IPC handlers for communication with renderer
      this.setupIpcHandlers()
      
    } catch {
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
  }
}

// Start the application
new ElectronMain()
