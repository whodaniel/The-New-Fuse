#!/usr/bin/env node
/**
 * MCP Launcher for Google Docs Server
 *
 * This wrapper script validates OAuth tokens BEFORE starting the MCP server.
 * Smart notification handling:
 * - If TNF Electron app is running: Send notification there
 * - If Electron is installed but not running: Show system dialog with options
 * - Opens browser for OAuth flow without blocking MCP connection
 */

const { spawn, exec, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');
const net = require('net');

// Try to load googleapis, fall back gracefully
let google;
try {
  google = require('googleapis').google;
} catch (e) {
  console.error('[MCP Launcher] googleapis not installed, running npm install...');
  execSync('npm install googleapis', { cwd: __dirname, stdio: 'inherit' });
  google = require('googleapis').google;
}

const CREDENTIALS_PATH = path.join(__dirname, 'credentials.json');
const TOKEN_PATH = path.join(__dirname, 'token.json');
const SERVER_PATH = path.join(__dirname, 'dist', 'server.js');

// TNF Electron app detection
const TNF_ELECTRON_APP_NAME = 'Electron';
const TNF_IPC_PORT = 9876; // Port for MCP->Electron communication

// Scopes required by the Google Docs MCP server
const SCOPES = [
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/drive.file',
];

/**
 * Check if TNF Electron app is running
 */
function isElectronRunning() {
  try {
    const result = execSync('pgrep -f "Electron.*The-New-Fuse"', { encoding: 'utf-8' });
    return result.trim().length > 0;
  } catch (error) {
    return false;
  }
}

/**
 * Check if TNF Electron app is installed
 */
function isElectronInstalled() {
  const possiblePaths = [
    '/Applications/TNF Browser Hub.app',
    '/Applications/The New Fuse.app',
    path.join(process.env.HOME, 'Applications/TNF Browser Hub.app'),
    path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop'),
  ];

  return possiblePaths.some((p) => fs.existsSync(p));
}

/**
 * Get path to Electron app
 */
function getElectronAppPath() {
  const possiblePaths = [
    '/Applications/TNF Browser Hub.app',
    '/Applications/The New Fuse.app',
    path.join(process.env.HOME, 'Desktop/A1-Inter-LLM-Com/The-New-Fuse/apps/electron-desktop'),
  ];

  for (const p of possiblePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

/**
 * Send notification to TNF Electron app via IPC
 */
async function sendToElectronApp(notification) {
  return new Promise((resolve) => {
    // Try to connect to Electron app's IPC server
    const client = new net.Socket();

    client.on('error', () => {
      resolve(false);
    });

    client.connect(TNF_IPC_PORT, '127.0.0.1', () => {
      client.write(
        JSON.stringify({
          type: 'mcp-auth-required',
          service: 'google-docs',
          ...notification,
        })
      );
      client.end();
      resolve(true);
    });

    // Timeout after 1 second
    setTimeout(() => {
      client.destroy();
      resolve(false);
    }, 1000);
  });
}

/**
 * Show macOS notification
 */
function showNotification(title, message) {
  const script = `display notification "${message}" with title "${title}"`;
  try {
    execSync(`osascript -e '${script}'`);
  } catch (e) {
    console.error('[MCP Launcher] Failed to show notification');
  }
}

/**
 * Show macOS dialog with options
 * Returns: 'electron' | 'browser' | 'cancel'
 */
function showAuthDialog(title, message) {
  const electronInstalled = isElectronInstalled();

  const buttons = electronInstalled
    ? '{"Open TNF Browser Hub", "Open Default Browser", "Cancel"}'
    : '{"Open Default Browser", "Cancel"}';

  const defaultButton = electronInstalled ? 1 : 1;

  const script = `
    set dialogResult to display dialog "${message}" ¬
      with title "${title}" ¬
      buttons ${buttons} ¬
      default button ${defaultButton} ¬
      with icon caution
    return button returned of dialogResult
  `;

  try {
    const result = execSync(`osascript -e '${script}'`, { encoding: 'utf-8' }).trim();

    if (result === 'Open TNF Browser Hub') return 'electron';
    if (result === 'Open Default Browser') return 'browser';
    return 'cancel';
  } catch (error) {
    return 'cancel';
  }
}

/**
 * Open URL in the default browser
 */
function openBrowser(url) {
  exec(`open "${url}"`);
}

/**
 * Open TNF Electron app with a URL
 */
function openElectronApp(url) {
  const appPath = getElectronAppPath();

  if (appPath && appPath.endsWith('.app')) {
    exec(`open -a "${appPath}" "${url}"`);
  } else if (appPath) {
    // Dev mode - electron is running from source
    // Send URL via IPC or just open in browser
    openBrowser(url);
  } else {
    openBrowser(url);
  }
}

/**
 * Load saved credentials from token.json
 */
function loadSavedToken() {
  try {
    const content = fs.readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
}

/**
 * Load OAuth2 client from credentials.json
 */
function loadCredentials() {
  try {
    const content = fs.readFileSync(CREDENTIALS_PATH, 'utf-8');
    const credentials = JSON.parse(content);
    const { client_secret, client_id, redirect_uris } = credentials.installed || credentials.web;
    return new google.auth.OAuth2(
      client_id,
      client_secret,
      redirect_uris?.[0] || 'http://localhost'
    );
  } catch (error) {
    console.error('[MCP Launcher] Error loading credentials:', error.message);
    return null;
  }
}

/**
 * Validate the current token by making a simple API call
 */
async function validateToken(oAuth2Client) {
  try {
    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    await drive.about.get({ fields: 'user' });
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Attempt to refresh the token if we have a refresh_token
 */
async function refreshToken(oAuth2Client, token) {
  if (!token.refresh_token) {
    return false;
  }

  try {
    oAuth2Client.setCredentials(token);
    const { credentials } = await oAuth2Client.refreshAccessToken();

    // Save the new token
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(credentials, null, 2));
    console.error('[MCP Launcher] Token refreshed successfully');
    return true;
  } catch (error) {
    console.error('[MCP Launcher] Token refresh failed:', error.message);
    return false;
  }
}

/**
 * Handle the authentication flow based on user choice
 */
async function handleAuthFlow(oAuth2Client, openWith) {
  return new Promise((resolve, reject) => {
    // Create a local server to capture the OAuth callback
    const server = http.createServer(async (req, res) => {
      const query = url.parse(req.url, true).query;

      if (query.code) {
        try {
          const { tokens } = await oAuth2Client.getToken(query.code);
          oAuth2Client.setCredentials(tokens);

          // Save token
          fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens, null, 2));

          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <head>
                <title>Authentication Successful</title>
                <style>
                  body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                    color: #eee;
                  }
                  .container {
                    text-align: center;
                    padding: 60px;
                    background: rgba(255,255,255,0.05);
                    border-radius: 24px;
                    box-shadow: 0 8px 32px rgba(0,0,0,0.3);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255,255,255,0.1);
                  }
                  h1 {
                    color: #4ecca3;
                    font-size: 2rem;
                    margin-bottom: 16px;
                  }
                  .checkmark {
                    font-size: 4rem;
                    margin-bottom: 20px;
                  }
                  p {
                    color: #888;
                    font-size: 1.1rem;
                  }
                  .close-hint {
                    margin-top: 30px;
                    font-size: 0.9rem;
                    color: #666;
                  }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="checkmark">✓</div>
                  <h1>Authentication Successful!</h1>
                  <p>Google Docs MCP server is now authorized.</p>
                  <p class="close-hint">You can close this window.</p>
                </div>
                <script>setTimeout(() => window.close(), 3000);</script>
              </body>
            </html>
          `);

          server.close();

          showNotification(
            'Google Docs MCP Ready',
            'Authentication successful! You can now use Google Docs with Claude.'
          );

          resolve(true);
        } catch (error) {
          res.writeHead(500, { 'Content-Type': 'text/html' });
          res.end(`
            <!DOCTYPE html>
            <html>
              <body style="font-family: system-ui; background: #1a1a2e; color: #fff; display: flex; justify-content: center; align-items: center; height: 100vh;">
                <div style="text-align: center; padding: 40px; background: rgba(255,0,0,0.1); border-radius: 16px;">
                  <h1 style="color: #f44;">Authentication Failed</h1>
                  <p>${error.message}</p>
                </div>
              </body>
            </html>
          `);
          server.close();
          reject(error);
        }
      } else if (query.error) {
        res.writeHead(400, { 'Content-Type': 'text/plain' });
        res.end('Authentication denied: ' + query.error);
        server.close();
        reject(new Error(query.error));
      }
    });

    // Find an available port
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      console.error(`[MCP Launcher] OAuth callback server listening on port ${port}`);

      // Generate auth URL with our callback
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
        prompt: 'consent',
        redirect_uri: `http://127.0.0.1:${port}`,
      });

      console.error(
        `[MCP Launcher] Opening ${openWith === 'electron' ? 'TNF Browser Hub' : 'default browser'}...`
      );

      if (openWith === 'electron') {
        openElectronApp(authUrl);
      } else {
        openBrowser(authUrl);
      }
    });

    // Timeout after 5 minutes
    setTimeout(
      () => {
        server.close();
        reject(new Error('Authentication timeout (5 minutes)'));
      },
      5 * 60 * 1000
    );
  });
}

/**
 * Start the actual MCP server
 */
function startMCPServer() {
  console.error('[MCP Launcher] Starting Google Docs MCP server...');

  const child = spawn('node', [SERVER_PATH], {
    stdio: 'inherit',
    cwd: __dirname,
  });

  child.on('error', (error) => {
    console.error('[MCP Launcher] Server error:', error.message);
    process.exit(1);
  });

  child.on('exit', (code) => {
    process.exit(code || 0);
  });
}

/**
 * Main entry point
 */
async function main() {
  console.error('[MCP Launcher] Google Docs MCP Server Launcher v2.0');
  console.error('[MCP Launcher] Validating authentication...');

  // Check if credentials exist
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.error('[MCP Launcher] ERROR: credentials.json not found!');
    console.error('[MCP Launcher] Please follow the setup instructions in README.md');

    showNotification(
      'Google Docs MCP Error',
      'credentials.json not found. Please set up OAuth credentials.'
    );

    process.exit(1);
  }

  // Load OAuth client
  const oAuth2Client = loadCredentials();
  if (!oAuth2Client) {
    console.error('[MCP Launcher] ERROR: Failed to load credentials');
    process.exit(1);
  }

  // Check for existing token
  const savedToken = loadSavedToken();

  if (savedToken) {
    oAuth2Client.setCredentials(savedToken);

    // Try to validate the token
    const isValid = await validateToken(oAuth2Client);

    if (isValid) {
      console.error('[MCP Launcher] Token is valid');
      startMCPServer();
      return;
    }

    // Try to refresh
    console.error('[MCP Launcher] Token expired, attempting refresh...');
    const refreshed = await refreshToken(oAuth2Client, savedToken);

    if (refreshed) {
      startMCPServer();
      return;
    }
  }

  // Need interactive authentication
  console.error('[MCP Launcher] Interactive authentication required');

  // Check if Electron app is running
  const electronRunning = isElectronRunning();
  let openWith = 'browser';

  if (electronRunning) {
    // Try to send notification to Electron app
    console.error('[MCP Launcher] TNF Electron app detected, sending notification...');

    const sent = await sendToElectronApp({
      title: 'Google Docs Authentication Required',
      message: 'The Google Docs MCP server needs you to sign in with Google.',
      action: 'authenticate',
    });

    if (sent) {
      openWith = 'electron';
      showNotification('Google Docs MCP', 'Check TNF Browser Hub for authentication prompt.');
    } else {
      // Fallback to showing in Electron anyway
      openWith = 'electron';
    }
  } else {
    // Electron not running, show dialog
    console.error('[MCP Launcher] Showing authentication dialog...');

    const choice = showAuthDialog(
      'Google Docs MCP Authentication Required',
      'The Google Docs MCP server needs you to sign in with Google to enable document access.\\n\\nWhere would you like to sign in?'
    );

    if (choice === 'cancel') {
      console.error('[MCP Launcher] Authentication cancelled by user');
      process.exit(1);
    }

    openWith = choice;
  }

  try {
    await handleAuthFlow(oAuth2Client, openWith);
    startMCPServer();
  } catch (error) {
    console.error('[MCP Launcher] Authentication failed:', error.message);
    showNotification('Google Docs MCP Error', 'Authentication failed. Please try again.');
    process.exit(1);
  }
}

main().catch((error) => {
  console.error('[MCP Launcher] Fatal error:', error.message);
  process.exit(1);
});
