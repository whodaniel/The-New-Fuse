/**
 * The New Fuse - Tauri Frontend
 * Lightweight desktop hub with MCP bridge integration
 */

import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import './styles.css';

// ============================================================================
// TYPES
// ============================================================================

interface MCPTool {
  name: string;
  description: string;
  inputSchema: object;
}

// ============================================================================
// STATE
// ============================================================================

let bridgeConnected = false;
let activeView = 'dashboard';
let sidebarCollapsed = localStorage.getItem('sidebarCollapsed') === 'true';

// ============================================================================
// TAURI API WRAPPERS
// ============================================================================

async function connectBridge(): Promise<boolean> {
  try {
    bridgeConnected = await invoke<boolean>('connect_bridge');
    updateBridgeStatus();
    return bridgeConnected;
  } catch (e) {
    console.error('Bridge connection failed:', e);
    showNotification('Bridge connection failed', 'error');
    return false;
  }
}

async function disconnectBridge(): Promise<boolean> {
  try {
    await invoke<boolean>('disconnect_bridge');
    bridgeConnected = false;
    updateBridgeStatus();
    return true;
  } catch (e) {
    console.error('Bridge disconnect failed:', e);
    return false;
  }
}

async function getBridgeStatus(): Promise<boolean> {
  try {
    bridgeConnected = await invoke<boolean>('get_bridge_status');
    return bridgeConnected;
  } catch (e) {
    console.error('Failed to get bridge status:', e);
    return false;
  }
}

async function callMCPTool(toolName: string, args: object): Promise<unknown> {
  try {
    return await invoke('mcp_call_tool', { toolName, arguments: args });
  } catch (e) {
    console.error(`MCP tool call failed: ${toolName}`, e);
    throw e;
  }
}

async function listMCPTools(): Promise<MCPTool[]> {
  try {
    return await invoke<MCPTool[]>('mcp_list_tools');
  } catch (e) {
    console.error('Failed to list MCP tools:', e);
    return [];
  }
}

// ============================================================================
// UI FUNCTIONS
// ============================================================================

function updateBridgeStatus() {
  const indicator = document.getElementById('bridge-status');
  if (indicator) {
    indicator.className = `status-dot ${bridgeConnected ? 'online' : 'offline'}`;
    indicator.title = bridgeConnected ? 'Cloud connected' : 'Cloud disconnected';
  }
}

function toggleSidebar() {
  sidebarCollapsed = !sidebarCollapsed;
  localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));

  const sidebar = document.getElementById('sidebar');
  if (sidebar) {
    sidebar.classList.toggle('collapsed', sidebarCollapsed);
  }

  const icon = document.querySelector('.sidebar-toggle i');
  if (icon) {
    icon.className = sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
  }
}

function switchView(viewId: string) {
  activeView = viewId;

  // Update nav items
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('active');
  });

  const activeItem = document.querySelector(`[data-view="${viewId}"]`);
  if (activeItem) {
    activeItem.classList.add('active');
  }

  // Update content
  renderContent(viewId);
}

function renderContent(viewId: string) {
  const content = document.getElementById('main-content');
  if (!content) {
    return;
  }

  switch (viewId) {
    case 'dashboard':
      content.innerHTML = renderDashboard();
      break;
    case 'tools':
      content.innerHTML = renderToolsPanel();
      loadTools();
      break;
    case 'files':
      content.innerHTML = renderFileManager();
      break;
    case 'settings':
      content.innerHTML = renderSettings();
      break;
    default:
      content.innerHTML = renderDashboard();
  }
}

function renderDashboard(): string {
  return `
    <div class="dashboard-container">
      <div class="dashboard-header">
        <div class="icon-circle">
          <i class="fas fa-rocket icon"></i>
        </div>
        <h1>The New Fuse</h1>
        <p class="subtitle">Lightweight Desktop Hub • Cloud Brain</p>
      </div>

      <div class="quick-actions">
        <button class="action-card" onclick="window.tnf.connectBridge()">
          <i class="fas fa-plug"></i>
          <span>Connect Cloud</span>
          <div class="status-dot ${bridgeConnected ? 'online' : 'offline'}" id="bridge-status-card"></div>
        </button>

        <button class="action-card" onclick="window.tnf.switchView('tools')">
          <i class="fas fa-tools"></i>
          <span>MCP Tools</span>
        </button>

        <button class="action-card" onclick="window.tnf.switchView('files')">
          <i class="fas fa-folder-open"></i>
          <span>File Manager</span>
        </button>

        <button class="action-card" onclick="window.open('https://thenewfuse.com')">
          <i class="fas fa-globe"></i>
          <span>TNF Cloud</span>
        </button>
      </div>

      <div class="services-grid" id="services-grid">
        <div class="service-card">
          <div class="service-icon"><i class="fas fa-server"></i></div>
          <div class="service-info">
            <h3>Railway Sandbox</h3>
            <p>Cloud compute environment</p>
          </div>
          <div class="status-dot ${bridgeConnected ? 'online' : 'offline'}"></div>
        </div>

        <div class="service-card">
          <div class="service-icon"><i class="fas fa-database"></i></div>
          <div class="service-info">
            <h3>PostgreSQL</h3>
            <p>railway.app</p>
          </div>
          <div class="status-dot offline"></div>
        </div>

        <div class="service-card">
          <div class="service-icon"><i class="fas fa-brain"></i></div>
          <div class="service-info">
            <h3>AI Inference</h3>
            <p>Cloud models</p>
          </div>
          <div class="status-dot offline"></div>
        </div>
      </div>
    </div>
  `;
}

function renderToolsPanel(): string {
  return `
    <div class="tools-container">
      <div class="panel-header">
        <h2><i class="fas fa-tools"></i> MCP Tools</h2>
        <button class="refresh-btn" onclick="window.tnf.loadTools()">
          <i class="fas fa-sync"></i>
        </button>
      </div>
      <div class="tools-grid" id="tools-list">
        <div class="loading">Loading tools...</div>
      </div>
    </div>
  `;
}

function renderFileManager(): string {
  return `
    <div class="files-container">
      <div class="panel-header">
        <h2><i class="fas fa-folder-open"></i> File Manager</h2>
      </div>
      <div class="file-browser">
        <p class="placeholder">File browser coming soon...</p>
      </div>
    </div>
  `;
}

function renderSettings(): string {
  return `
    <div class="settings-container">
      <div class="panel-header">
        <h2><i class="fas fa-cog"></i> Settings</h2>
      </div>

      <div class="settings-group">
        <h3>Cloud Connection</h3>
        <div class="setting-item">
          <label>Sandbox URL</label>
          <input type="text" id="sandbox-url" value="wss://tnf-sandbox.up.railway.app/ws" />
        </div>
        <button class="primary-btn" onclick="window.tnf.saveSandboxUrl()">Save</button>
      </div>

      <div class="settings-group">
        <h3>Appearance</h3>
        <div class="setting-item">
          <label>Sidebar Collapsed</label>
          <input type="checkbox" id="sidebar-collapsed" ${sidebarCollapsed ? 'checked' : ''} onchange="window.tnf.toggleSidebar()" />
        </div>
      </div>
    </div>
  `;
}

async function loadTools() {
  const toolsList = document.getElementById('tools-list');
  if (!toolsList) {
    return;
  }

  const tools = await listMCPTools();

  if (tools.length === 0) {
    toolsList.innerHTML = '<p class="empty">No tools available. Connect to cloud first.</p>';
    return;
  }

  toolsList.innerHTML = tools
    .map(
      (tool) => `
    <div class="tool-card">
      <div class="tool-icon"><i class="fas fa-wrench"></i></div>
      <div class="tool-info">
        <h3>${tool.name}</h3>
        <p>${tool.description}</p>
      </div>
      <button class="run-btn" onclick="window.tnf.runTool('${tool.name}')">
        <i class="fas fa-play"></i>
      </button>
    </div>
  `
    )
    .join('');
}

async function runTool(toolName: string) {
  showNotification(`Running ${toolName}...`, 'info');
  try {
    const result = await callMCPTool(toolName, {});
    console.log('Tool result:', result);
    showNotification(`${toolName} completed`, 'success');
  } catch {
    showNotification(`${toolName} failed`, 'error');
  }
}

function showNotification(message: string, type: 'success' | 'error' | 'info' = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => notification.remove(), 3000);
}

async function saveSandboxUrl() {
  const input = document.getElementById('sandbox-url') as HTMLInputElement;
  if (input) {
    await invoke('set_sandbox_url', { url: input.value });
    showNotification('Sandbox URL saved', 'success');
  }
}

// ============================================================================
// INITIALIZATION
// ============================================================================

function initApp() {
  // Restore sidebar state
  if (sidebarCollapsed) {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) {
      sidebar.classList.add('collapsed');
    }
  }

  // Initial render
  renderContent('dashboard');

  // Check bridge status
  getBridgeStatus();

  // Listen for Tauri events
  listen('bridge-connected', () => {
    bridgeConnected = true;
    updateBridgeStatus();
    showNotification('Cloud connected', 'success');
  });

  listen('bridge-disconnected', () => {
    bridgeConnected = false;
    updateBridgeStatus();
    showNotification('Cloud disconnected', 'info');
  });

  console.log('🚀 The New Fuse initialized');
  console.log('Active view:', activeView); // Use activeView to avoid lint error
}

// Expose functions to window for HTML onclick handlers
(window as unknown as { tnf: object }).tnf = {
  connectBridge,
  disconnectBridge,
  switchView,
  toggleSidebar,
  loadTools,
  runTool,
  saveSandboxUrl,
};

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', initApp);
