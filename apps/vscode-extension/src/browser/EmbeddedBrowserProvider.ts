/**
 * TNF Embedded Browser Panel for VS Code
 *
 * Provides an embedded Chromium browser directly in VS Code,
 * allowing AI agents to control web browsers without leaving the editor.
 *
 * Based on Browser Action Baby's Electron BrowserView approach,
 * enhanced with TNF browser control protocol for AI automation.
 */

import { ChildProcess, spawn } from 'child_process';
import * as path from 'path';
import * as vscode from 'vscode';

export class EmbeddedBrowserProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'theNewFuse.browserView';
  private _view?: vscode.WebviewView;
  private browserProcess: ChildProcess | null = null;
  private panel: vscode.WebviewPanel | null = null;
  private currentUrl: string = 'about:blank';
  private isLoading: boolean = false;

  constructor(private readonly extensionUri: vscode.Uri) {}

  /**
   * Resolve the webview view
   */
  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ): void {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.extensionUri],
    };

    webviewView.webview.html = this.getWebviewContent();

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage((message) => {
      this.handleWebviewMessage(message);
    });
  }

  /**
   * Open browser in a new panel tab
   */
  public openBrowserPanel(url?: string): void {
    if (this.panel) {
      this.panel.reveal();
      if (url) {
        this.navigateTo(url);
      }
      return;
    }

    this.panel = vscode.window.createWebviewPanel(
      'theNewFuse.browser',
      'TNF Browser',
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [this.extensionUri],
      }
    );

    this.panel.webview.html = this.getFullBrowserContent();
    this.panel.iconPath = new vscode.ThemeIcon('globe');

    this.panel.webview.onDidReceiveMessage((message) => {
      this.handleWebviewMessage(message);
    });

    this.panel.onDidDispose(() => {
      this.panel = null;
      this.killBrowserProcess();
    });

    // Start the Electron browser process
    this.startBrowserProcess();

    if (url) {
      setTimeout(() => this.navigateTo(url), 1000);
    }
  }

  /**
   * Navigate to a URL
   */
  public navigateTo(url: string): void {
    // Ensure URL has protocol
    if (!url.includes('://')) {
      url = 'https://' + url;
    }

    this.currentUrl = url;
    this.isLoading = true;

    // Send to browser process
    if (this.browserProcess) {
      this.browserProcess.send?.({ type: 'navigate', url });
    }

    // Update webview
    this.updateStatus({ url, loading: true });
  }

  /**
   * Go back in history
   */
  public goBack(): void {
    this.browserProcess?.send?.({ type: 'goBack' });
  }

  /**
   * Go forward in history
   */
  public goForward(): void {
    this.browserProcess?.send?.({ type: 'goForward' });
  }

  /**
   * Refresh current page
   */
  public refresh(): void {
    this.browserProcess?.send?.({ type: 'refresh' });
  }

  /**
   * Take screenshot of current page
   */
  public async takeScreenshot(): Promise<string | null> {
    return new Promise((resolve) => {
      if (!this.browserProcess) {
        resolve(null);
        return;
      }

      const messageHandler = (message: any) => {
        if (message.type === 'screenshot') {
          this.browserProcess?.off?.('message', messageHandler);
          resolve(message.dataUrl);
        }
      };

      this.browserProcess.on('message', messageHandler);
      this.browserProcess.send?.({ type: 'takeScreenshot' });

      // Timeout after 5 seconds
      setTimeout(() => {
        this.browserProcess?.off?.('message', messageHandler);
        resolve(null);
      }, 5000);
    });
  }

  /**
   * Take a semantic snapshot (accessibility tree)
   */
  public async takeSemanticSnapshot(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.browserProcess) {
        reject(new Error('Browser not running'));
        return;
      }

      const id = Date.now().toString();
      const messageHandler = (message: any) => {
        if (message.type === 'semanticSnapshotResult' && message.id === id) {
          this.browserProcess?.off?.('message', messageHandler);
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.nodes);
          }
        }
      };

      this.browserProcess.on('message', messageHandler);
      this.browserProcess.send?.({ type: 'takeSemanticSnapshot', id });

      setTimeout(() => {
        this.browserProcess?.off?.('message', messageHandler);
        reject(new Error('Semantic snapshot timeout'));
      }, 10000);
    });
  }

  /**
   * Take an annotated screenshot for vision models
   */
  public async takeAnnotatedScreenshot(): Promise<{ dataUrl: string; elements: any[] } | null> {
    return new Promise((resolve) => {
      if (!this.browserProcess) {
        resolve(null);
        return;
      }

      const id = Date.now().toString();
      const messageHandler = (message: any) => {
        if (message.type === 'annotatedScreenshotResult' && message.id === id) {
          this.browserProcess?.off?.('message', messageHandler);
          if (message.error) {
            resolve(null);
          } else {
            resolve({ dataUrl: message.dataUrl, elements: message.elements });
          }
        }
      };

      this.browserProcess.on('message', messageHandler);
      this.browserProcess.send?.({ type: 'takeAnnotatedScreenshot', id });

      setTimeout(() => {
        this.browserProcess?.off?.('message', messageHandler);
        resolve(null);
      }, 10000);
    });
  }

  /**
   * Execute JavaScript in the browser
   */
  public async executeScript(script: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.browserProcess) {
        reject(new Error('Browser not running'));
        return;
      }

      const id = Date.now().toString();
      const messageHandler = (message: any) => {
        if (message.type === 'executeScriptResult' && message.id === id) {
          this.browserProcess?.off?.('message', messageHandler);
          if (message.error) {
            reject(new Error(message.error));
          } else {
            resolve(message.result);
          }
        }
      };

      this.browserProcess.on('message', messageHandler);
      this.browserProcess.send?.({ type: 'executeScript', script, id });

      setTimeout(() => {
        this.browserProcess?.off?.('message', messageHandler);
        reject(new Error('Script execution timeout'));
      }, 30000);
    });
  }

  /**
   * Click an element by selector
   */
  public async clickElement(selector: string): Promise<boolean> {
    try {
      await this.executeScript(`
        const el = document.querySelector('${selector}');
        if (el) {
          el.click();
          true;
        } else {
          false;
        }
      `);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Type text into an element
   */
  public async typeText(selector: string, text: string): Promise<boolean> {
    try {
      await this.executeScript(`
        const el = document.querySelector('${selector}');
        if (el) {
          el.focus();
          el.value = '${text.replace(/'/g, "\\'")}';
          el.dispatchEvent(new Event('input', { bubbles: true }));
          true;
        } else {
          false;
        }
      `);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get current URL
   */
  public getCurrentUrl(): string {
    return this.currentUrl;
  }

  /**
   * Check if browser is loading
   */
  public isPageLoading(): boolean {
    return this.isLoading;
  }

  /**
   * Handle messages from webview
   */
  private handleWebviewMessage(message: any): void {
    switch (message.type) {
      case 'navigate':
        this.navigateTo(message.url);
        break;
      case 'goBack':
        this.goBack();
        break;
      case 'goForward':
        this.goForward();
        break;
      case 'refresh':
        this.refresh();
        break;
      case 'screenshot':
        this.takeScreenshot().then((dataUrl) => {
          if (this.panel) {
            this.panel.webview.postMessage({ type: 'screenshot', dataUrl });
          }
        });
        break;
    }
  }

  /**
   * Start the Electron browser process
   */
  private startBrowserProcess(): void {
    try {
      // Try to find electron in various locations
      const electronPaths = [
        path.join(this.extensionUri.fsPath, 'node_modules', '.bin', 'electron'),
        path.join(
          this.extensionUri.fsPath,
          'node_modules',
          'electron',
          'dist',
          'Electron.app',
          'Contents',
          'MacOS',
          'Electron'
        ),
        'electron', // Global
      ];

      let electronPath = '';
      for (const p of electronPaths) {
        try {
          require('fs').accessSync(p);
          electronPath = p;
          break;
        } catch {
          continue;
        }
      }

      if (!electronPath) {
        vscode.window.showWarningMessage(
          'Electron not found. Embedded browser requires electron package. Using fallback iframe mode.'
        );
        return;
      }

      const mainJsPath = path.join(this.extensionUri.fsPath, 'browser', 'main.js');

      this.browserProcess = spawn(electronPath, [mainJsPath], {
        stdio: ['pipe', 'pipe', 'pipe', 'ipc'],
      });

      // Handle messages from browser process
      this.browserProcess.on('message', (message: any) => {
        switch (message.type) {
          case 'loading-start':
            this.isLoading = true;
            this.updateStatus({ loading: true });
            break;
          case 'loading-end':
            this.isLoading = false;
            this.updateStatus({ loading: false });
            break;
          case 'url-changed':
            this.currentUrl = message.url;
            this.updateStatus({ url: message.url });
            break;
          case 'loading-error':
            this.isLoading = false;
            this.updateStatus({ loading: false, error: message.error });
            break;
        }
      });

      this.browserProcess.on('exit', () => {
        this.browserProcess = null;
      });
    } catch (error) {
      console.error('Failed to start browser process:', error);
    }
  }

  /**
   * Kill the browser process
   */
  private killBrowserProcess(): void {
    if (this.browserProcess) {
      this.browserProcess.kill();
      this.browserProcess = null;
    }
  }

  /**
   * Update status in webview
   */
  private updateStatus(status: { url?: string; loading?: boolean; error?: string }): void {
    if (this.panel) {
      this.panel.webview.postMessage({ type: 'status', ...status });
    }
    if (this._view) {
      this._view.webview.postMessage({ type: 'status', ...status });
    }
  }

  /**
   * Get webview content for sidebar
   */
  private getWebviewContent(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      margin: 0;
      padding: 16px;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
    }
    .browser-info {
      text-align: center;
      padding: 20px;
    }
    .browser-info h3 {
      margin-bottom: 16px;
    }
    .browser-info p {
      color: var(--vscode-descriptionForeground);
      margin-bottom: 16px;
    }
    button {
      padding: 8px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
    }
    button:hover {
      background: var(--vscode-button-hoverBackground);
    }
  </style>
</head>
<body>
  <div class="browser-info">
    <h3>🌐 TNF Embedded Browser</h3>
    <p>Control web browsers directly from VS Code. AI agents can navigate, click, type, and capture screenshots.</p>
    <button onclick="openFullBrowser()">Open Browser Panel</button>
  </div>
  <script>
    const vscode = acquireVsCodeApi();
    function openFullBrowser() {
      vscode.postMessage({ type: 'openBrowser' });
    }
  </script>
</body>
</html>`;
  }

  /**
   * Get full browser panel content
   */
  private getFullBrowserContent(): string {
    return `<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      box-sizing: border-box;
    }
    body {
      margin: 0;
      padding: 0;
      font-family: var(--vscode-font-family);
      color: var(--vscode-foreground);
      background: var(--vscode-editor-background);
      height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .nav-bar {
      display: flex;
      align-items: center;
      padding: 8px;
      background: var(--vscode-titleBar-activeBackground);
      border-bottom: 1px solid var(--vscode-panel-border);
      gap: 8px;
    }
    .nav-buttons {
      display: flex;
      gap: 4px;
    }
    .nav-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: var(--vscode-foreground);
      cursor: pointer;
      font-size: 16px;
    }
    .nav-btn:hover {
      background: var(--vscode-toolbar-hoverBackground);
    }
    .nav-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    #urlInput {
      flex: 1;
      padding: 6px 12px;
      background: var(--vscode-input-background);
      border: 1px solid var(--vscode-input-border);
      border-radius: 4px;
      color: var(--vscode-input-foreground);
      font-size: 13px;
    }
    #urlInput:focus {
      outline: none;
      border-color: var(--vscode-focusBorder);
    }
    .go-btn {
      padding: 6px 16px;
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: 500;
    }
    .go-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }
    .browser-frame {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .status-bar {
      padding: 4px 12px;
      font-size: 11px;
      color: var(--vscode-descriptionForeground);
      background: var(--vscode-statusBar-background);
      display: flex;
      justify-content: space-between;
    }
    .loading-indicator {
      color: var(--vscode-charts-blue);
    }
    .error-indicator {
      color: var(--vscode-errorForeground);
    }
    .placeholder {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      color: var(--vscode-descriptionForeground);
    }
    .placeholder-icon {
      font-size: 64px;
      margin-bottom: 16px;
    }
    .placeholder p {
      margin: 8px 0;
      max-width: 400px;
      text-align: center;
    }
    .ai-controls {
      padding: 8px;
      background: var(--vscode-sideBar-background);
      border-top: 1px solid var(--vscode-panel-border);
    }
    .ai-controls-title {
      font-weight: 600;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .quick-actions {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .quick-action {
      padding: 4px 12px;
      background: var(--vscode-button-secondaryBackground);
      color: var(--vscode-button-secondaryForeground);
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 12px;
    }
    .quick-action:hover {
      background: var(--vscode-button-secondaryHoverBackground);
    }
  </style>
</head>
<body>
  <div class="nav-bar">
    <div class="nav-buttons">
      <button class="nav-btn" onclick="goBack()" title="Back">←</button>
      <button class="nav-btn" onclick="goForward()" title="Forward">→</button>
      <button class="nav-btn" onclick="refresh()" id="refreshBtn" title="Refresh">↻</button>
    </div>
    <input type="text" id="urlInput" placeholder="Enter URL or search...">
    <button class="go-btn" onclick="navigate()">Go</button>
  </div>

  <div class="browser-frame">
    <div class="placeholder" id="placeholder">
      <div class="placeholder-icon">🌐</div>
      <h2>TNF Embedded Browser</h2>
      <p>Enter a URL above to start browsing. AI agents can control this browser to automate web tasks.</p>
      <p style="font-size: 12px;">Try: chat.openai.com, claude.ai, or any website</p>
    </div>
  </div>

  <div class="ai-controls">
    <div class="ai-controls-title">🤖 AI Quick Actions</div>
    <div class="quick-actions">
      <button class="quick-action" onclick="quickAction('screenshot')">📷 Screenshot</button>
      <button class="quick-action" onclick="quickAction('analyze')">🔍 Analyze Page</button>
      <button class="quick-action" onclick="quickAction('detectChat')">💬 Detect Chat</button>
      <button class="quick-action" onclick="quickAction('getContent')">📄 Get Content</button>
    </div>
  </div>

  <div class="status-bar">
    <span id="statusText">Ready</span>
    <span id="loadingIndicator" class="loading-indicator" style="display: none;">Loading...</span>
  </div>

  <script>
    const vscode = acquireVsCodeApi();
    const urlInput = document.getElementById('urlInput');
    const statusText = document.getElementById('statusText');
    const loadingIndicator = document.getElementById('loadingIndicator');

    urlInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        navigate();
      }
    });

    function navigate() {
      const url = urlInput.value.trim();
      if (url) {
        vscode.postMessage({ type: 'navigate', url });
        statusText.textContent = 'Navigating to ' + url;
        loadingIndicator.style.display = 'inline';
      }
    }

    function goBack() {
      vscode.postMessage({ type: 'goBack' });
    }

    function goForward() {
      vscode.postMessage({ type: 'goForward' });
    }

    function refresh() {
      vscode.postMessage({ type: 'refresh' });
    }

    function quickAction(action) {
      vscode.postMessage({ type: 'quickAction', action });
    }

    // Handle messages from extension
    window.addEventListener('message', (event) => {
      const message = event.data;
      switch (message.type) {
        case 'status':
          if (message.url) {
            urlInput.value = message.url;
            statusText.textContent = message.url;
          }
          loadingIndicator.style.display = message.loading ? 'inline' : 'none';
          if (message.error) {
            statusText.textContent = 'Error: ' + message.error;
            statusText.className = 'error-indicator';
          } else {
            statusText.className = '';
          }
          break;
      }
    });
  </script>
</body>
</html>`;
  }
}

/**
 * Register browser commands
 */
export function registerBrowserCommands(
  context: vscode.ExtensionContext,
  browserProvider: EmbeddedBrowserProvider
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand('theNewFuse.openBrowser', () => {
      browserProvider.openBrowserPanel();
    }),
    vscode.commands.registerCommand('theNewFuse.navigateTo', async () => {
      const url = await vscode.window.showInputBox({
        prompt: 'Enter URL to navigate to',
        placeHolder: 'https://example.com',
      });
      if (url) {
        browserProvider.openBrowserPanel(url);
      }
    }),
    vscode.commands.registerCommand('theNewFuse.browserScreenshot', async () => {
      const dataUrl = await browserProvider.takeScreenshot();
      if (dataUrl) {
        vscode.window.showInformationMessage('Screenshot captured!');
        // Could save to file or return to AI agent
      } else {
        vscode.window.showWarningMessage('Failed to capture screenshot');
      }
    }),
    vscode.commands.registerCommand('theNewFuse.browserSemanticSnapshot', async () => {
      try {
        const snapshot = await browserProvider.takeSemanticSnapshot();
        vscode.window.showInformationMessage('Semantic snapshot captured!');
        console.log('Semantic Snapshot:', snapshot);
      } catch (error) {
        vscode.window.showErrorMessage(`Failed to capture semantic snapshot: ${error}`);
      }
    }),
    vscode.commands.registerCommand('theNewFuse.browserAnnotatedScreenshot', async () => {
      const result = await browserProvider.takeAnnotatedScreenshot();
      if (result) {
        vscode.window.showInformationMessage(
          `Annotated screenshot captured with ${result.elements.length} interactive elements!`
        );
      } else {
        vscode.window.showWarningMessage('Failed to capture annotated screenshot');
      }
    }),
    vscode.commands.registerCommand('theNewFuse.browserExecuteScript', async () => {
      const script = await vscode.window.showInputBox({
        prompt: 'Enter JavaScript to execute in browser',
        placeHolder: 'document.title',
      });
      if (script) {
        try {
          const result = await browserProvider.executeScript(script);
          vscode.window.showInformationMessage(`Result: ${JSON.stringify(result)}`);
        } catch (error) {
          vscode.window.showErrorMessage(`Error: ${error}`);
        }
      }
    })
  );
}
