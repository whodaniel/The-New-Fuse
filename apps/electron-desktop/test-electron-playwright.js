/**
 * Test script to verify Playwright integration with The Browser Hub Electron app
 *
 * This script tests the IPC communication between the renderer and main process
 * to trigger Playwright automation from within the Electron app.
 */

const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, 'dist/preload/preload.js')
        }
    });

    // Create a simple test HTML page
    const testHTML = `
    <!DOCTYPE html>
    <html>
    <head>
        <title>Playwright Integration Test</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                padding: 40px;
                background: #0f0f23;
                color: #fff;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
            }
            h1 {
                color: #00d9ff;
            }
            button {
                background: #00d9ff;
                color: #0f0f23;
                border: none;
                padding: 12px 24px;
                font-size: 16px;
                cursor: pointer;
                border-radius: 6px;
                margin: 10px 5px;
            }
            button:hover {
                background: #00b8d4;
            }
            #output {
                background: #1a1a2e;
                padding: 20px;
                border-radius: 8px;
                margin-top: 20px;
                min-height: 200px;
                font-family: 'Courier New', monospace;
            }
            .success { color: #4caf50; }
            .error { color: #f44336; }
            .info { color: #2196f3; }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>🎭 Playwright Integration Test</h1>
            <p>Test the Playwright integration with The Browser Hub Electron app</p>

            <div>
                <button onclick="testPlaywright('https://www.google.com')">Test: Open Google</button>
                <button onclick="testPlaywright('https://github.com')">Test: Open GitHub</button>
                <button onclick="testPlaywright('https://www.wikipedia.org')">Test: Open Wikipedia</button>
            </div>

            <div id="output">
                <div class="info">Click a button to test Playwright integration...</div>
            </div>
        </div>

        <script>
            function log(message, type = 'info') {
                const output = document.getElementById('output');
                const timestamp = new Date().toLocaleTimeString();
                const className = type;
                output.innerHTML += \`<div class="\${className}">\${timestamp} - \${message}</div>\`;
                output.scrollTop = output.scrollHeight;
            }

            async function testPlaywright(url) {
                log('🚀 Starting Playwright test for: ' + url, 'info');

                try {
                    // Call the IPC handler to open URL with Playwright
                    const result = await window.electronAPI.playwright.open(url);

                    if (result.success) {
                        log('✅ Successfully opened URL with Playwright!', 'success');
                    } else {
                        log('❌ Failed to open URL: ' + result.error, 'error');
                    }
                } catch (error) {
                    log('❌ Error: ' + error.message, 'error');
                }
            }

            // Log when ready
            window.addEventListener('DOMContentLoaded', () => {
                log('✅ Test page loaded and ready', 'success');
                log('📡 Checking Playwright API availability...', 'info');

                if (window.electronAPI && window.electronAPI.playwright) {
                    log('✅ Playwright API is available!', 'success');
                } else {
                    log('❌ Playwright API not found!', 'error');
                }
            });
        </script>
    </body>
    </html>
    `;

    mainWindow.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(testHTML));
    mainWindow.webContents.openDevTools();
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Set up IPC handler for Playwright
ipcMain.handle('playwright:open', async (_, url) => {
    console.log('📡 Received Playwright request to open:', url);

    try {
        const { chromium } = require('playwright');

        console.log('🚀 Launching Playwright browser...');
        const browser = await chromium.launch({
            headless: false
        });

        const context = await browser.newContext();
        const page = await context.newPage();

        console.log('🌐 Navigating to:', url);
        await page.goto(url);
        await page.waitForLoadState('networkidle');

        const title = await page.title();
        console.log('✅ Page loaded:', title);

        // Keep browser open for 10 seconds
        setTimeout(async () => {
            console.log('🔒 Closing browser...');
            await browser.close();
            console.log('✅ Browser closed');
        }, 10000);

        return { success: true, title };
    } catch (error) {
        console.error('❌ Playwright error:', error);
        return { success: false, error: error.message };
    }
});

console.log('🎭 Playwright Integration Test App Started');
