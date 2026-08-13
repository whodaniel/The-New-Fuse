/**
 * TNF Embedded Browser - Electron Main Process
 *
 * This runs as a child process spawned by the VS Code extension.
 * It provides a real Chromium browser window that can be controlled via IPC.
 *
 * Based on Browser Action Baby architecture.
 */

const { app, BrowserWindow, BrowserView, ipcMain, session } = require('electron');
const path = require('path');

let mainWindow;
let browserView;
let currentUrl = 'about:blank';

/**
 * Listen for messages from VS Code extension
 */
process.on('message', (message) => {
  handleMessage(message);
});

/**
 * Handle incoming messages
 */
function handleMessage(message) {
  switch (message.type) {
    case 'navigate':
      navigateTo(message.url);
      break;
    case 'goBack':
      if (browserView?.webContents.canGoBack()) {
        browserView.webContents.goBack();
      }
      break;
    case 'goForward':
      if (browserView?.webContents.canGoForward()) {
        browserView.webContents.goForward();
      }
      break;
    case 'refresh':
      browserView?.webContents.reload();
      break;
    case 'takeScreenshot':
      takeScreenshot();
      break;
    case 'takeSemanticSnapshot':
      takeSemanticSnapshot(message.id);
      break;
    case 'takeAnnotatedScreenshot':
      takeAnnotatedScreenshot(message.id);
      break;
    case 'executeScript':
      executeScript(message.script, message.id);
      break;
    case 'click':
      executeScript(
        `
        const el = document.querySelector('${message.selector}');
        if (el) { el.click(); }
      `,
        message.id
      );
      break;
    case 'type':
      executeScript(
        `
        const el = document.querySelector('${message.selector}');
        if (el) {
          el.focus();
          el.value = ${JSON.stringify(message.text)};
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `,
        message.id
      );
      break;
    case 'getPageContent':
      executeScript(
        `
        document.body.innerText;
      `,
        message.id
      );
      break;
    case 'analyzePage':
      executeScript(
        `
        ({
          url: window.location.href,
          title: document.title,
          headings: Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent.trim()),
          links: Array.from(document.querySelectorAll('a[href]')).length,
          buttons: Array.from(document.querySelectorAll('button')).length,
          inputs: Array.from(document.querySelectorAll('input, textarea')).length,
        });
      `,
        message.id
      );
      break;
  }
}

/**
 * Navigate to a URL
 */
function navigateTo(url) {
  if (!browserView?.webContents) return;

  // Ensure URL has protocol
  if (!url.includes('://')) {
    url = 'https://' + url;
  }

  currentUrl = url;
  browserView.webContents.loadURL(url);
}

/**
 * Take a screenshot
 */
async function takeScreenshot() {
  if (!browserView?.webContents) {
    sendMessage({ type: 'screenshot', dataUrl: null });
    return;
  }

  try {
    const image = await browserView.webContents.capturePage();
    const dataUrl = 'data:image/png;base64,' + image.toPNG().toString('base64');
    sendMessage({ type: 'screenshot', dataUrl });
  } catch (error) {
    sendMessage({ type: 'screenshot', dataUrl: null, error: error.message });
  }
}

/**
 * Execute JavaScript in the browser
 */
async function executeScript(script, id) {
  if (!browserView?.webContents) {
    sendMessage({ type: 'executeScriptResult', id, error: 'Browser not ready' });
    return;
  }

  try {
    const result = await browserView.webContents.executeJavaScript(script);
    sendMessage({ type: 'executeScriptResult', id, result });
  } catch (error) {
    sendMessage({ type: 'executeScriptResult', id, error: error.message });
  }
}

/**
 * Take a semantic snapshot (accessibility tree)
 */
async function takeSemanticSnapshot(id) {
  if (!browserView?.webContents) {
    sendMessage({ type: 'semanticSnapshotResult', id, error: 'Browser not ready' });
    return;
  }

  try {
    if (!browserView.webContents.debugger.isAttached()) {
      browserView.webContents.debugger.attach();
    }
    const { nodes } = await browserView.webContents.debugger.sendCommand(
      'Accessibility.getFullAXTree'
    );
    sendMessage({ type: 'semanticSnapshotResult', id, nodes });
  } catch (error) {
    sendMessage({ type: 'semanticSnapshotResult', id, error: error.message });
  }
}

/**
 * Take an annotated screenshot with numbered labels
 */
async function takeAnnotatedScreenshot(id) {
  if (!browserView?.webContents) {
    sendMessage({ type: 'annotatedScreenshotResult', id, error: 'Browser not ready' });
    return;
  }

  try {
    const elementsInfo = await browserView.webContents.executeJavaScript(`
      (function() {
        const interactiveSelectors = 'a, button, input, select, textarea, [role="button"], [role="link"]';
        const elements = document.querySelectorAll(interactiveSelectors);
        const info = [];
        
        elements.forEach((el, i) => {
          const rect = el.getBoundingClientRect();
          if (rect.width === 0 || rect.height === 0) return;
          
          const box = document.createElement('div');
          box.className = 'tnf-vision-label';
          box.style.cssText = 'position:absolute; border:2px solid red; z-index:2147483647; pointer-events:none; background:rgba(255,0,0,0.1);';
          box.style.left = rect.left + window.scrollX + 'px';
          box.style.top = rect.top + window.scrollY + 'px';
          box.style.width = rect.width + 'px';
          box.style.height = rect.height + 'px';
          
          const label = document.createElement('span');
          label.innerText = i + 1;
          label.style.cssText = 'position:absolute; top:-10px; left:-10px; background:red; color:white; font-weight:bold; border-radius:50%; padding:2px 5px; font-size:12px;';
          box.appendChild(label);
          
          document.body.appendChild(box);
          info.push({ id: i + 1, tagName: el.tagName, text: el.innerText.substring(0, 20) });
        });
        return info;
      })()
    `);

    const image = await browserView.webContents.capturePage();
    const dataUrl = 'data:image/png;base64,' + image.toPNG().toString('base64');

    // Cleanup labels
    await browserView.webContents.executeJavaScript(`
      document.querySelectorAll('.tnf-vision-label').forEach(el => el.remove());
    `);

    sendMessage({ type: 'annotatedScreenshotResult', id, dataUrl, elements: elementsInfo });
  } catch (error) {
    sendMessage({ type: 'annotatedScreenshotResult', id, error: error.message });
  }
}

/**
 * Send message back to VS Code extension
 */
function sendMessage(message) {
  if (process.send) {
    process.send(message);
  }
}

/**
 * Create the browser window
 */
function createWindow() {
  // Create the browser window with specific dimensions
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Hidden - controlled via IPC from VS Code
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  // Create the browser view for actual web content
  browserView = new BrowserView({
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      // Allow media and other permissions for AI sites
      webSecurity: true,
    },
  });

  mainWindow.setBrowserView(browserView);
  browserView.setBounds({ x: 0, y: 0, width: 1200, height: 800 });
  browserView.setAutoResize({ width: true, height: true });

  // Load initial page
  browserView.webContents.loadURL('about:blank');

  // Handle navigation events
  browserView.webContents.on('did-start-loading', () => {
    sendMessage({ type: 'loading-start' });
  });

  browserView.webContents.on('did-finish-load', () => {
    sendMessage({ type: 'loading-end' });
  });

  browserView.webContents.on('did-navigate', (event, url) => {
    currentUrl = url;
    sendMessage({ type: 'url-changed', url });
  });

  browserView.webContents.on('did-navigate-in-page', (event, url) => {
    currentUrl = url;
    sendMessage({ type: 'url-changed', url });
  });

  browserView.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    sendMessage({ type: 'loading-error', error: errorDescription });
  });

  // Handle new window requests (open in same view)
  browserView.webContents.setWindowOpenHandler(({ url }) => {
    browserView.webContents.loadURL(url);
    return { action: 'deny' };
  });

  // Handle console messages from page
  browserView.webContents.on('console-message', (event, level, message, line, sourceId) => {
    if (level >= 2) {
      // Warning and above
      sendMessage({ type: 'console', level, message, line, sourceId });
    }
  });

  // Handle window close
  mainWindow.on('closed', () => {
    mainWindow = null;
    browserView = null;
    sendMessage({ type: 'closed' });
  });

  // Tell VS Code we're ready
  sendMessage({ type: 'ready' });
}

// Start when Electron is ready
app.whenReady().then(createWindow);

// Quit when all windows are closed
app.on('window-all-closed', () => {
  app.quit();
});

// Handle activate (macOS)
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// Handle IPC from renderer (if we add a navigation bar later)
ipcMain.on('navigate', (event, url) => {
  navigateTo(url);
});
