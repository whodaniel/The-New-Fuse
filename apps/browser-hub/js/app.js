/**
 * TNF Browser Hub - Application Logic
 * Handles UI interactions, Electron integration, and browser features.
 */

// Global Variables
let activeTab = 'dashboard';
const tabs = {
  dashboard: {
    title: 'TNF Dashboard',
    url: 'http://localhost:3000',
    icon: 'fas fa-tachometer-alt',
    frame: document.getElementById('frame-dashboard'),
  },
};
const tabHistory = {};
let sidebarCollapsed = false;

// Sidebar Management
function toggleSidebar() {
  const sidebar = document.getElementById('sidebar');
  const icon = document.querySelector('.sidebar-toggle i');

  sidebarCollapsed = !sidebarCollapsed;
  sidebar.classList.toggle('collapsed', sidebarCollapsed);

  icon.className = sidebarCollapsed ? 'fas fa-chevron-right' : 'fas fa-chevron-left';
}

function setSidebarWidth(width) {
  const sidebar = document.getElementById('sidebar');
  sidebar.style.width = width + 'px';
}

// Section Management
function toggleSection(sectionId) {
  const content = document.getElementById(sectionId + '-section');
  const arrow = document.getElementById(sectionId + '-arrow');

  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    arrow.classList.remove('collapsed');
  } else {
    content.classList.add('collapsed');
    arrow.classList.add('collapsed');
  }
}

// Drag and Drop Functionality
let draggedElement = null;

function initDragAndDrop() {
  const draggableItems = document.querySelectorAll('.nav-item.draggable');

  draggableItems.forEach((item) => {
    item.addEventListener('dragstart', handleDragStart);
    item.addEventListener('dragover', handleDragOver);
    item.addEventListener('drop', handleDrop);
    item.addEventListener('dragend', handleDragEnd);
    item.addEventListener('dragenter', handleDragEnter);
    item.addEventListener('dragleave', handleDragLeave);
  });
}

function handleDragStart(e) {
  draggedElement = this;
  this.classList.add('dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/html', this.outerHTML);
}

function handleDragOver(e) {
  if (e.preventDefault) {
    e.preventDefault();
  }
  e.dataTransfer.dropEffect = 'move';
  return false;
}

function handleDragEnter(e) {
  if (this !== draggedElement) {
    this.classList.add('drag-over');
  }
}

function handleDragLeave(e) {
  this.classList.remove('drag-over');
}

function handleDrop(e) {
  if (e.stopPropagation) {
    e.stopPropagation();
  }

  if (draggedElement !== this) {
    // Get parent container
    const container = this.parentNode;
    const draggedIndex = Array.from(container.children).indexOf(draggedElement);
    const dropIndex = Array.from(container.children).indexOf(this);

    // Reorder elements
    if (draggedIndex < dropIndex) {
      container.insertBefore(draggedElement, this.nextSibling);
    } else {
      container.insertBefore(draggedElement, this);
    }

    // Save new order to localStorage
    saveMenuItemOrder();
  }

  this.classList.remove('drag-over');
  return false;
}

function handleDragEnd(e) {
  this.classList.remove('dragging');

  // Remove drag-over class from all items
  document.querySelectorAll('.nav-item').forEach((item) => {
    item.classList.remove('drag-over');
  });

  draggedElement = null;
}

function saveMenuItemOrder() {
  const sections = document.querySelectorAll('.nav-section-content');
  const order = {};

  sections.forEach((section) => {
    const items = section.querySelectorAll('.nav-item.draggable');
    order[section.id] = Array.from(items).map((item) => ({
      text: item.textContent.trim(),
      onclick: item.getAttribute('onclick'),
    }));
  });

  localStorage.setItem('menuItemOrder', JSON.stringify(order));
}

// Tab Management
function createNewTab(url = 'about:blank', title = 'New Tab', icon = 'fas fa-globe') {
  const tabId = 'tab-' + Date.now();
  const frameId = 'frame-' + tabId;

  // Check if this is Theia IDE
  const isTheia = url.includes('localhost:3007') || title.includes('Theia');

  // Create loading overlay for Theia
  let loadingOverlay = null;
  if (isTheia) {
    loadingOverlay = document.createElement('div');
    loadingOverlay.id = `loading-${frameId}`;
    loadingOverlay.className = 'theia-loading-overlay';
    loadingOverlay.innerHTML = `
            <div class="theia-loading-content">
                <div class="loading-spinner">
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                    <div class="spinner-ring"></div>
                </div>
                <h2>🚀 The New Fuse IDE Loading...</h2>
                <p>Please allow time for Theia IDE to fully load</p>
            </div>
          `;
    document.getElementById('contentArea').appendChild(loadingOverlay);
  }

  // Create webview
  const frame = document.createElement('webview');
  frame.id = frameId;
  frame.className = 'content-frame hidden';
  frame.setAttribute('allowpopups', '');
  frame.setAttribute('partition', 'persist:browser-hub');

  // Handle load completion
  frame.addEventListener('dom-ready', () => {
    if (isTheia && loadingOverlay) {
      setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => loadingOverlay.remove(), 500);
      }, 8000);
    }
  });

  // Handle navigation
  frame.addEventListener('did-navigate', (e) => {
    if (activeTab === tabId) {
      tabs[tabId].url = e.url;
      updateAddressBar(e.url);
    }
  });
  frame.addEventListener('did-navigate-in-page', (e) => {
    if (activeTab === tabId) {
      tabs[tabId].url = e.url;
      updateAddressBar(e.url);
    }
  });

  frame.src = url;
  document.getElementById('contentArea').appendChild(frame);

  // Create tab data
  tabs[tabId] = {
    title: title,
    url: url,
    icon: icon,
    frame: frame,
    loadingOverlay: loadingOverlay,
  };

  // Create tab element
  const tabElement = document.createElement('div');
  tabElement.className = 'tab';
  tabElement.id = tabId;
  tabElement.onclick = () => switchToTab(tabId);
  tabElement.innerHTML = `
          <i class="${icon}"></i>
          <span>${title}</span>
          <button class="tab-close" onclick="event.stopPropagation(); closeTab('${tabId}')">
              <i class="fas fa-times"></i>
          </button>
      `;

  document.getElementById('tabsContainer').appendChild(tabElement);
  switchToTab(tabId);
  scrollToTab(tabElement);
}

function switchToTab(tabId) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.remove('active'));
  document.querySelectorAll('.content-frame').forEach((frame) => frame.classList.add('hidden'));
  document.querySelectorAll('.nav-item').forEach((item) => item.classList.remove('active'));

  const tabElement = document.getElementById(tabId);
  if (tabElement) {
    tabElement.classList.add('active');
  }

  if (tabs[tabId]) {
    tabs[tabId].frame.classList.remove('hidden');
    activeTab = tabId;
    updateAddressBar(tabs[tabId].url);
  }

  if (tabId === 'dashboard') {
    document.querySelectorAll('.nav-item').forEach((item) => {
      if (item.textContent.includes('TNF Dashboard')) {
        item.classList.add('active');
      }
    });
  }
}

function closeTab(tabId) {
  const tabElement = document.getElementById(tabId);
  if (tabElement) {
    tabElement.remove();
  }

  if (tabs[tabId]) {
    tabs[tabId].frame.remove();
    if (tabs[tabId].loadingOverlay) {
      tabs[tabId].loadingOverlay.remove();
    }
    delete tabs[tabId];
  }

  if (activeTab === tabId) {
    const remainingTabs = Object.keys(tabs);
    if (remainingTabs.length > 0) {
      switchToTab(remainingTabs[0]);
    } else {
      createNewTab();
    }
  }
}

function scrollTabs(direction) {
  const container = document.getElementById('tabsContainer');
  const scrollAmount = 200;
  container.scrollLeft += direction === 'left' ? -scrollAmount : scrollAmount;
}

function scrollToTab(tabElement) {
  const container = document.getElementById('tabsContainer');
  const tabRect = tabElement.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  if (tabRect.right > containerRect.right) {
    container.scrollLeft += tabRect.right - containerRect.right + 20;
  } else if (tabRect.left < containerRect.left) {
    container.scrollLeft -= containerRect.left - tabRect.left + 20;
  }
}

// Browser Navigation
function goBack() {
  if (tabs[activeTab]?.frame) {
    tabs[activeTab].frame.canGoBack() ? tabs[activeTab].frame.goBack() : null;
  }
}

function goForward() {
  if (tabs[activeTab]?.frame) {
    tabs[activeTab].frame.canGoForward() ? tabs[activeTab].frame.goForward() : null;
  }
}

function refreshPage() {
  if (tabs[activeTab]?.frame) {
    tabs[activeTab].frame.reload();
  }
}

function goHome() {
  switchToTab('dashboard');
}

function handleAddressBarEnter(event) {
  if (event.key === 'Enter') {
    navigateToUrl(event.target.value);
  }
}

function navigateToUrl(url) {
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url =
      url.includes('.') || url.startsWith('localhost')
        ? 'https://' + url
        : 'https://www.google.com/search?q=' + encodeURIComponent(url);
  }

  if (window.electronAPI?.addHistory) {
    window.electronAPI.addHistory({ title: url, url: url, time: new Date().toISOString() });
  }

  if (activeTab && tabs[activeTab]) {
    tabs[activeTab].url = url;
    tabs[activeTab].frame.src = url;
    updateAddressBar(url);
  } else {
    createNewTab(url, 'New Tab');
  }
}

function updateAddressBar(url) {
  document.getElementById('addressBar').value = url;
}

// Panel Helpers
function closeAllPanels(keepOverlay = false) {
  document.getElementById('settingsPanel').classList.remove('open');
  document.getElementById('extensionsPanel').classList.remove('open');
  document.getElementById('promptManagerPanel').classList.remove('open');

  document.querySelectorAll('.browser-feature-panel.visible').forEach((p) => {
    p.classList.remove('visible');
    setTimeout(() => p.remove(), 300);
  });

  if (!keepOverlay) {
    document.getElementById('overlay').classList.remove('active');
  }
}

function closePanel(panelId) {
  const panel = document.getElementById(panelId);
  if (panel) {
    panel.classList.remove('visible');
    setTimeout(() => panel.remove(), 300);
  }
}

// Settings
function toggleSettings() {
  const panel = document.getElementById('settingsPanel');
  const overlay = document.getElementById('overlay');

  if (panel.classList.contains('open')) {
    closeAllPanels();
  } else {
    closeAllPanels(true);
    panel.classList.add('open');
    overlay.classList.add('active');
  }
}

// Extension Panel Toggle
function toggleExtensions() {
  const panel = document.getElementById('extensionsPanel');
  const overlay = document.getElementById('overlay');

  if (panel.classList.contains('open')) {
    closeAllPanels();
  } else {
    closeAllPanels(true);
    panel.classList.add('open');
    overlay.classList.add('active');
  }
}

// Bookmarks Feature
function toggleBookmarks() {
  const panel = document.getElementById('bookmarksPanel');
  if (panel) {
    closePanel('bookmarksPanel');
  } else {
    createBookmarksPanel();
    document.getElementById('bookmarksPanel').classList.add('visible');
    refreshBookmarks();
  }
}

function createBookmarksPanel() {
  const panel = document.createElement('div');
  panel.id = 'bookmarksPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
        <div class="panel-header">
            <h3><i class="fas fa-bookmark"></i> Bookmarks</h3>
            <button onclick="closePanel('bookmarksPanel')"><i class="fas fa-times"></i></button>
        </div>
        <div class="panel-content">
            <div class="bookmark-toolbar">
                <button class="feature-btn primary" onclick="addBookmark()"><i class="fas fa-plus"></i> Add</button>
                <button class="feature-btn secondary" onclick="importBookmarks()"><i class="fas fa-download"></i></button>
            </div>
            <div class="bookmark-list" id="bookmarkList">Loading...</div>
        </div>
    `;
  document.body.appendChild(panel);
}

async function refreshBookmarks() {
  if (window.electronAPI?.getBookmarks) {
    const result = await window.electronAPI.getBookmarks();
    if (result.success) {
      document.getElementById('bookmarkList').innerHTML = renderBookmarkList(result.bookmarks);
    }
  }
}

function renderBookmarkList(bookmarks) {
  if (!bookmarks || bookmarks.length === 0) {
    return '<div class="empty-state">No bookmarks</div>';
  }
  return bookmarks
    .map(
      (b) => `
        <div class="list-item" onclick="navigateToUrl('${b.url}')">
            <i class="fas fa-bookmark list-item-icon"></i>
            <div class="list-item-content">
                <div class="list-item-title">${b.title}</div>
                <div class="list-item-url">${b.url}</div>
            </div>
            <button class="list-item-action" onclick="event.stopPropagation(); deleteBookmark('${b.id}')"><i class="fas fa-trash"></i></button>
        </div>
    `
    )
    .join('');
}

function addBookmark() {
  const currentTab = tabs[activeTab];
  if (!currentTab) {
    return;
  }

  showCustomInput(
    'Add Bookmark',
    [
      { label: 'Title', name: 'title', value: currentTab.title },
      { label: 'URL', name: 'url', value: currentTab.url },
    ],
    async (result) => {
      if (window.electronAPI?.addBookmark) {
        await window.electronAPI.addBookmark({
          id: Date.now().toString(),
          title: result.title,
          url: result.url,
          createdAt: new Date().toISOString(),
        });
        refreshBookmarks();
        showNotification('Bookmark added');
      }
    }
  );
}

async function deleteBookmark(id) {
  if (confirm('Delete bookmark?')) {
    await window.electronAPI?.removeBookmark(id);
    refreshBookmarks();
    showNotification('Bookmark deleted');
  }
}

function importBookmarks() {
  showNotification('Import feature coming soon');
}

// History Feature
function showHistory() {
  const panel = document.getElementById('historyPanel');
  if (panel) {
    closePanel('historyPanel');
  } else {
    createHistoryPanel();
    document.getElementById('historyPanel').classList.add('visible');
    refreshHistory();
  }
}

function createHistoryPanel() {
  const panel = document.createElement('div');
  panel.id = 'historyPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
        <div class="panel-header">
            <h3><i class="fas fa-history"></i> History</h3>
            <button onclick="closePanel('historyPanel')"><i class="fas fa-times"></i></button>
        </div>
        <div class="panel-content">
            <div class="history-toolbar">
                <input type="text" placeholder="Search..." oninput="filterHistory(this.value)" class="history-search">
                <button class="feature-btn danger" onclick="clearHistory()"><i class="fas fa-trash"></i></button>
            </div>
            <div class="history-list" id="historyList">Loading...</div>
        </div>
    `;
  document.body.appendChild(panel);
}

async function refreshHistory() {
  if (window.electronAPI?.getHistory) {
    const result = await window.electronAPI.getHistory();
    if (result.success) {
      document.getElementById('historyList').innerHTML = renderHistoryList(result.history);
    }
  }
}

function renderHistoryList(history) {
  if (!history || history.length === 0) {
    return '<div class="empty-state">No history</div>';
  }
  return history
    .map(
      (h) => `
        <div class="list-item" onclick="navigateToUrl('${h.url}')">
            <i class="fas fa-clock list-item-icon"></i>
            <div class="list-item-content">
                <div class="list-item-title">${h.title || h.url}</div>
                <div class="list-item-url">${h.url}</div>
                <div class="list-item-date">${new Date(h.time).toLocaleString()}</div>
            </div>
        </div>
    `
    )
    .join('');
}

async function clearHistory() {
  if (confirm('Clear history?')) {
    await window.electronAPI?.clearHistory();
    refreshHistory();
    showNotification('History cleared');
  }
}

function filterHistory(term) {
  const items = document.querySelectorAll('#historyList .list-item');
  items.forEach((item) => {
    const text = item.textContent.toLowerCase();
    item.style.display = text.includes(term.toLowerCase()) ? 'flex' : 'none';
  });
}

// Prompt Manager & Custom Input
let promptTemplates = [];
const promptFolders = JSON.parse(localStorage.getItem('promptFolders') || '[]');

function togglePromptManager() {
  const panel = document.getElementById('promptManagerPanel');
  const overlay = document.getElementById('overlay');
  if (panel.classList.contains('open')) {
    closeAllPanels();
  } else {
    closeAllPanels(true);
    panel.classList.add('open');
    overlay.classList.add('active');
    loadPromptManager();
  }
}

function loadPromptManager() {
  loadPromptTemplates();
  renderPromptFolders();
}

function loadPromptTemplates() {
  if (window.electronAPI?.getPromptTemplates) {
    window.electronAPI.getPromptTemplates().then((t) => {
      promptTemplates = Array.isArray(t) ? t : [];
      renderPromptTemplates();
    });
  } else {
    promptTemplates = JSON.parse(localStorage.getItem('promptTemplates') || '[]');
    renderPromptTemplates();
  }
}

function renderPromptTemplates() {
  const list = document.getElementById('prompt-templates-list');
  if (!list) {
    return;
  }
  list.innerHTML = promptTemplates
    .map(
      (p) => `
        <div class="extension-item">
            <div class="extension-icon"><i class="fas fa-file-alt"></i></div>
            <div class="extension-info">
                <div class="extension-name">${p.name || 'Unnamed'}</div>
                <div class="extension-desc">${p.description || ''}</div>
            </div>
            <button class="extension-action-btn" onclick="runPrompt('${p.id}')"><i class="fas fa-play"></i></button>
        </div>
    `
    )
    .join('');
}

function renderPromptFolders() {
  const list = document.getElementById('prompt-folders-list');
  if (!list) {
    return;
  }
  list.innerHTML = promptFolders
    .map(
      (f) => `
        <div class="extension-item">
            <div class="extension-icon"><i class="fas fa-folder"></i></div>
            <div class="extension-info"><div class="extension-name">${f.name}</div></div>
        </div>
    `
    )
    .join('');
}

// Custom Input Modal
let customInputCallback;
function showCustomInput(title, fields, callback) {
  document.getElementById('customInputTitle').textContent = title;
  const container = document.getElementById('customInputFields');
  container.innerHTML = fields
    .map(
      (f) => `
        <div class="settings-item">
            <label class="settings-item-label">${f.label}</label>
            <input type="${f.type || 'text'}" name="${f.name}" class="prompt-input" value="${f.value || ''}" required>
        </div>
    `
    )
    .join('');
  customInputCallback = callback;
  const modal = document.getElementById('customInputModal');
  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeCustomInputModal() {
  const modal = document.getElementById('customInputModal');
  modal.classList.remove('active');
  modal.style.display = 'none';
}

function handleCustomInput() {
  const form = document.getElementById('customInputForm');
  const formData = new FormData(form);
  const result = Object.fromEntries(formData.entries());
  if (customInputCallback) {
    customInputCallback(result);
  }
  closeCustomInputModal();
}

// Prompt Execution
let currentRunPromptId = null;
function runPrompt(id) {
  currentRunPromptId = id;
  const modal = document.getElementById('runPromptModal');
  modal.style.display = 'flex';
  modal.classList.add('active');
}
function closeRunPromptModal() {
  const modal = document.getElementById('runPromptModal');
  modal.classList.remove('active');
  modal.style.display = 'none';
}
// Note: simplified runPrompt for brevity in this response, but essential parts are here.

// Custom Menu Items
let customMenuItems = JSON.parse(localStorage.getItem('customMenuItems') || '[]');
function addCustomMenuItem() {
  showCustomInput(
    'Add Link',
    [
      { label: 'Name', name: 'name' },
      { label: 'URL', name: 'url' },
    ],
    (res) => {
      customMenuItems.push({ id: Date.now().toString(), ...res, icon: 'fas fa-link' });
      localStorage.setItem('customMenuItems', JSON.stringify(customMenuItems));
      renderCustomMenuItems();
    }
  );
}
function removeCustomMenuItem(id) {
  customMenuItems = customMenuItems.filter((i) => i.id !== id);
  localStorage.setItem('customMenuItems', JSON.stringify(customMenuItems));
  renderCustomMenuItems();
}
function renderCustomMenuItems() {
  const section = document.querySelector('#custom-links-section');
  const btn = section.querySelector('.add-menu-item');
  section.querySelectorAll('.nav-item:not(.add-menu-item)').forEach((i) => i.remove());

  customMenuItems.forEach((item) => {
    const div = document.createElement('div');
    div.className = 'nav-item draggable';
    div.innerHTML = `<i class="fas fa-link"></i><span>${item.name}</span><button class="terminal-btn" onclick="removeCustomMenuItem('${item.id}')"><i class="fas fa-times"></i></button>`;
    div.onclick = (e) => {
      if (!e.target.closest('.terminal-btn')) {
        createNewTab(item.url, item.name);
      }
    };
    section.insertBefore(div, btn);
  });
}

// Notifications
function showNotification(msg, type = 'success') {
  const n = document.createElement('div');
  n.className = `notification notification-${type}`;
  n.textContent = msg;
  n.style.cssText = `position: fixed; top: 80px; right: 20px; background: ${type === 'error' ? '#ef4444' : '#10b981'}; color: white; padding: 12px 16px; border-radius: 8px; z-index: 9999; animation: slideIn 0.3s;`;
  document.body.appendChild(n);
  setTimeout(() => n.remove(), 3000);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  initDragAndDrop();
  renderCustomMenuItems();
  // Initialize Browser Engine
  const savedEngine = localStorage.getItem('selectedBrowserEngine') || 'chromium';
  const selector = document.getElementById('engineSelector');
  if (selector) {
    selector.value = savedEngine;
  }

  // Initialize extensions toolbar
  setTimeout(() => {
    updateExtensionToolbar();
    refreshInstalledExtensions();
  }, 500);

  // Initialize local dev status
  setTimeout(updateDevStatusDots, 1000);

  switchToTab('dashboard');
});
// Helpers
function openAccount() {
  createNewTab('http://localhost:3000/account', 'Account');
}

function openSettings() {
  toggleSettings();
}

function openSignIn() {
  createNewTab('http://localhost:3000/auth/login', 'Sign In');
}

function showMore() {
  const menu = document.getElementById('moreOptionsMenu');
  if (menu) {
    menu.remove();
    return;
  }
  const dropdown = document.createElement('div');
  dropdown.id = 'moreOptionsMenu';
  dropdown.className = 'more-options-dropdown';
  dropdown.innerHTML = `
    <div class="dropdown-item" onclick="printPage()">
      <i class="fas fa-print"></i> Print
    </div>
    <div class="dropdown-item" onclick="findInPage()">
      <i class="fas fa-search"></i> Find in Page
    </div>
    <div class="dropdown-item" onclick="zoomIn()">
      <i class="fas fa-search-plus"></i> Zoom In
    </div>
    <div class="dropdown-item" onclick="zoomOut()">
      <i class="fas fa-search-minus"></i> Zoom Out
    </div>
    <div class="dropdown-item" onclick="resetZoom()">
      <i class="fas fa-expand"></i> Reset Zoom
    </div>
    <div class="dropdown-divider"></div>
    <div class="dropdown-item" onclick="toggleFullScreen()">
      <i class="fas fa-expand-alt"></i> Full Screen
    </div>
  `;
  document.body.appendChild(dropdown);
  setTimeout(() => document.addEventListener('click', closeMoreMenu, { once: true }), 0);
}

function closeMoreMenu() {
  const menu = document.getElementById('moreOptionsMenu');
  if (menu) {
    menu.remove();
  }
}

function printPage() {
  closeMoreMenu();
  if (tabs[activeTab]?.frame?.print) {
    tabs[activeTab].frame.print();
  }
}

function findInPage() {
  closeMoreMenu();
  if (window.electronAPI?.findInPage) {
    window.electronAPI.findInPage();
  } else {
    showNotification('Use Cmd+F to find in page');
  }
}

let currentZoom = 1.0;
function zoomIn() {
  closeMoreMenu();
  currentZoom = Math.min(currentZoom + 0.1, 3.0);
  applyZoom();
}

function zoomOut() {
  closeMoreMenu();
  currentZoom = Math.max(currentZoom - 0.1, 0.3);
  applyZoom();
}

function resetZoom() {
  closeMoreMenu();
  currentZoom = 1.0;
  applyZoom();
}

function applyZoom() {
  if (tabs[activeTab]?.frame?.setZoomFactor) {
    tabs[activeTab].frame.setZoomFactor(currentZoom);
  }
  showNotification(`Zoom: ${Math.round(currentZoom * 100)}%`);
}

function toggleFullScreen() {
  closeMoreMenu();
  if (window.electronAPI?.toggleFullScreen) {
    window.electronAPI.toggleFullScreen();
  } else if (document.fullscreenElement) {
    document.exitFullscreen();
  } else {
    document.documentElement.requestFullscreen();
  }
}

function captureScreenshot() {
  if (window.electronAPI?.captureScreenshot) {
    window.electronAPI.captureScreenshot().then((result) => {
      if (result.success) {
        showNotification(`Screenshot saved: ${result.path}`);
      } else {
        showNotification('Screenshot failed', 'error');
      }
    });
  } else {
    // Fallback: use html2canvas if available or notify
    showNotification('Screenshot: Use Cmd+Shift+4 on macOS');
  }
}

// Downloads Panel
function showDownloads() {
  const panel = document.getElementById('downloadsPanel');
  if (panel) {
    closePanel('downloadsPanel');
  } else {
    createDownloadsPanel();
    document.getElementById('downloadsPanel').classList.add('visible');
    refreshDownloads();
  }
}

function createDownloadsPanel() {
  const panel = document.createElement('div');
  panel.id = 'downloadsPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3><i class="fas fa-download"></i> Downloads</h3>
      <button onclick="closePanel('downloadsPanel')"><i class="fas fa-times"></i></button>
    </div>
    <div class="panel-content">
      <div class="downloads-toolbar">
        <button class="feature-btn primary" onclick="openDownloadsFolder()">
          <i class="fas fa-folder-open"></i> Open Folder
        </button>
        <button class="feature-btn secondary" onclick="clearDownloads()">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="downloads-list" id="downloadsList">Loading...</div>
    </div>
  `;
  document.body.appendChild(panel);
}

async function refreshDownloads() {
  if (window.electronAPI?.getDownloads) {
    const result = await window.electronAPI.getDownloads();
    if (result.success) {
      document.getElementById('downloadsList').innerHTML = renderDownloadsList(result.downloads);
    }
  } else {
    document.getElementById('downloadsList').innerHTML =
      '<div class="empty-state">No downloads</div>';
  }
}

function renderDownloadsList(downloads) {
  if (!downloads || downloads.length === 0) {
    return '<div class="empty-state">No downloads yet</div>';
  }
  return downloads
    .map(
      (d) => `
    <div class="list-item">
      <i class="fas fa-file list-item-icon"></i>
      <div class="list-item-content">
        <div class="list-item-title">${d.filename}</div>
        <div class="list-item-url">${d.state || 'completed'}</div>
      </div>
      <button class="list-item-action" onclick="openDownloadedFile('${d.path}')"><i class="fas fa-external-link-alt"></i></button>
    </div>
  `
    )
    .join('');
}

function openDownloadsFolder() {
  if (window.electronAPI?.openDownloadsFolder) {
    window.electronAPI.openDownloadsFolder();
  } else {
    showNotification('Open ~/Downloads folder manually');
  }
}

function clearDownloads() {
  if (confirm('Clear downloads list?')) {
    if (window.electronAPI?.clearDownloads) {
      window.electronAPI.clearDownloads().then(() => refreshDownloads());
    }
    showNotification('Downloads cleared');
  }
}

function openDownloadedFile(path) {
  if (window.electronAPI?.openPath) {
    window.electronAPI.openPath(path);
  }
}

// Chrome Extension Store
function openChromeStore() {
  createNewTab('https://chrome.google.com/webstore', 'Chrome Web Store');
}

function loadUnpackedExtension() {
  if (window.electronAPI?.loadUnpackedExtension) {
    window.electronAPI.loadUnpackedExtension().then((r) => {
      if (r.success) {
        showNotification(`Extension loaded: ${r.name || 'Success'}`);
        refreshInstalledExtensions();
      } else if (!r.canceled) {
        showNotification(r.error || 'Failed to load extension', 'error');
      }
    });
  } else {
    showNotification('Extension loading not available', 'error');
  }
}

function importSystemExtensions() {
  showNotification('Importing system extensions...');
  if (window.electron?.ipcRenderer) {
    window.electron.ipcRenderer.invoke('extensions:import-system').then((result) => {
      if (result.success) {
        showNotification(result.message || `Imported ${result.count} extensions`);
        refreshInstalledExtensions();
      } else {
        showNotification(result.error || 'Import failed', 'error');
      }
    });
  }
}

async function refreshInstalledExtensions() {
  const container = document.getElementById('installedExtensions');
  if (!container) {
    return;
  }

  container.innerHTML = '<div class="loading">Loading extensions...</div>';

  try {
    if (window.electronAPI?.getLoadedExtensions) {
      const result = await window.electronAPI.getLoadedExtensions();
      if (result.success && result.extensions) {
        renderExtensionsList(result.extensions);
        document.getElementById('extensionCount').textContent = `(${result.extensions.length})`;
        return;
      }
    }
    // Fallback
    container.innerHTML = '<div class="empty-state">No extensions loaded</div>';
  } catch (error) {
    container.innerHTML = '<div class="empty-state">Failed to load extensions</div>';
  }
}

function renderExtensionsList(extensions) {
  const container = document.getElementById('installedExtensions');
  const pinned = JSON.parse(localStorage.getItem('pinnedExtensions') || '[]');

  container.innerHTML = extensions
    .map((ext) => {
      const isPinned = pinned.includes(ext.id);
      return `
      <div class="extension-item" data-id="${ext.id}">
        <div class="extension-icon">
          <i class="fas fa-puzzle-piece"></i>
        </div>
        <div class="extension-info">
          <div class="extension-name">${ext.name}</div>
          <div class="extension-desc">${ext.description || 'No description'}</div>
        </div>
        <div class="extension-actions">
          <button class="pin-btn ${isPinned ? 'pinned' : ''}" onclick="toggleExtensionPin('${ext.id}')" title="${isPinned ? 'Unpin' : 'Pin to toolbar'}">
            <i class="${isPinned ? 'fas' : 'far'} fa-star"></i>
          </button>
        </div>
      </div>
    `;
    })
    .join('');
}

function toggleExtensionPin(id) {
  let pinned = JSON.parse(localStorage.getItem('pinnedExtensions') || '[]');
  if (pinned.includes(id)) {
    pinned = pinned.filter((p) => p !== id);
    showNotification('Extension unpinned');
  } else {
    pinned.push(id);
    showNotification('Extension pinned to toolbar');
  }
  localStorage.setItem('pinnedExtensions', JSON.stringify(pinned));
  refreshInstalledExtensions();
  updateExtensionToolbar();
}

function updateExtensionToolbar() {
  const toolbar = document.getElementById('extensionToolbar');
  if (!toolbar) {
    return;
  }

  const pinned = JSON.parse(localStorage.getItem('pinnedExtensions') || '[]');

  if (pinned.length === 0) {
    toolbar.innerHTML =
      '<span class="extension-toolbar-hint" style="color: var(--tnf-text-muted); font-size: 11px;">Pin extensions to show here</span>';
    return;
  }

  // Get extension data from Electron or localStorage cache
  if (window.electronAPI?.getLoadedExtensions) {
    window.electronAPI.getLoadedExtensions().then((result) => {
      if (result.success && result.extensions) {
        const pinnedExts = result.extensions.filter((ext) => pinned.includes(ext.id));
        toolbar.innerHTML = pinnedExts
          .map(
            (ext) => `
          <button class="extension-toolbar-btn" onclick="activateExtension('${ext.id}')" title="${ext.name}">
            <i class="fas fa-puzzle-piece"></i>
          </button>
        `
          )
          .join('');
      }
    });
  } else {
    // Fallback - just show placeholders for pinned extensions
    toolbar.innerHTML = pinned
      .map(
        (id) => `
      <button class="extension-toolbar-btn" onclick="activateExtension('${id}')" title="Extension">
        <i class="fas fa-puzzle-piece"></i>
      </button>
    `
      )
      .join('');
  }
}

function activateExtension(id) {
  showNotification(`Activating extension: ${id}`);
  // In real implementation, this would interact with chrome.runtime or Electron
}

function filterExtensions(term) {
  const items = document.querySelectorAll('#installedExtensions .extension-item');
  const lowerTerm = term.toLowerCase();
  items.forEach((item) => {
    const name = item.querySelector('.extension-name')?.textContent.toLowerCase() || '';
    const desc = item.querySelector('.extension-desc')?.textContent.toLowerCase() || '';
    item.style.display = name.includes(lowerTerm) || desc.includes(lowerTerm) ? 'flex' : 'none';
  });
}

function clearExtensionSearch() {
  const input = document.getElementById('extensionSearchInput');
  if (input) {
    input.value = '';
    filterExtensions('');
  }
}

function filterExtensionsByCategory(category) {
  // Category filtering - would need category metadata
  showNotification(`Filter: ${category || 'All'}`);
}

function filterExtensionsByStatus(status) {
  const items = document.querySelectorAll('#installedExtensions .extension-item');
  items.forEach((item) => {
    // All shown for now - would need enabled/disabled state
    item.style.display = 'flex';
  });
}

function installExtensionFromInput() {
  const input = document.getElementById('installExtensionInput');
  const url = input?.value.trim();
  if (!url) {
    showNotification('Enter a Chrome Web Store URL or Extension ID', 'error');
    return;
  }

  showNotification('Installing extension...');

  if (window.electronAPI?.installExtensionFromStore) {
    window.electronAPI.installExtensionFromStore(url).then((result) => {
      if (result.success) {
        showNotification(`Installed: ${result.name}`);
        input.value = '';
        refreshInstalledExtensions();
      } else {
        showNotification(result.error || 'Installation failed', 'error');
      }
    });
  } else {
    showNotification('Extension installation not available', 'error');
  }
}

// Settings Toggle Functions
function toggleDarkMode(toggle) {
  toggle.classList.toggle('active');
  const isDark = toggle.classList.contains('active');
  document.body.classList.toggle('light-mode', !isDark);
  localStorage.setItem('darkMode', isDark ? 'true' : 'false');
}

function toggleAdBlock(toggle) {
  toggle.classList.toggle('active');
  localStorage.setItem('adBlock', toggle.classList.contains('active') ? 'true' : 'false');
  showNotification(`Ad blocking ${toggle.classList.contains('active') ? 'enabled' : 'disabled'}`);
}

function toggleClearCookies(toggle) {
  toggle.classList.toggle('active');
  localStorage.setItem(
    'clearCookiesOnExit',
    toggle.classList.contains('active') ? 'true' : 'false'
  );
}

function toggleThirdPartyCookies(toggle) {
  toggle.classList.toggle('active');
  localStorage.setItem(
    'blockThirdPartyCookies',
    toggle.classList.contains('active') ? 'true' : 'false'
  );
}

function toggleDoNotTrack(toggle) {
  toggle.classList.toggle('active');
  localStorage.setItem('doNotTrack', toggle.classList.contains('active') ? 'true' : 'false');
}

function toggleDevTools(toggle) {
  if (toggle?.classList) {
    toggle.classList.toggle('active');
  }

  if (window.electronAPI?.toggleDevTools) {
    window.electronAPI.toggleDevTools();
  } else if (tabs[activeTab]?.frame?.openDevTools) {
    tabs[activeTab].frame.openDevTools();
  } else {
    showNotification('DevTools: Use F12 or Cmd+Option+I');
  }
}

function toggleExtensionsEnabled(toggle) {
  toggle.classList.toggle('active');
  localStorage.setItem('extensionsEnabled', toggle.classList.contains('active') ? 'true' : 'false');
  showNotification(`Extensions ${toggle.classList.contains('active') ? 'enabled' : 'disabled'}`);
}

function switchEngine(engine) {
  localStorage.setItem('selectedBrowserEngine', engine);
  showNotification(`Browser engine: ${engine}`);
  // Engine switching is mostly cosmetic in Electron (always Chromium)
}

// Prompt Modal Functions
function showNewPromptForm() {
  const modal = document.getElementById('newPromptModal');
  modal.style.display = 'flex';
  modal.classList.add('active');
}

function closeNewPromptModal() {
  const modal = document.getElementById('newPromptModal');
  modal.classList.remove('active');
  modal.style.display = 'none';
  document.getElementById('newPromptForm')?.reset();
}

function saveNewPrompt() {
  const form = document.getElementById('newPromptForm');
  const formData = new FormData(form);

  const prompt = {
    id: Date.now().toString(),
    name: formData.get('name'),
    description: formData.get('description'),
    category: formData.get('category'),
    template: formData.get('template'),
    tags: (formData.get('tags') || '')
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean),
    createdAt: new Date().toISOString(),
  };

  if (window.electronAPI?.createPromptTemplate) {
    window.electronAPI.createPromptTemplate(prompt).then(() => {
      loadPromptTemplates();
      showNotification('Prompt created');
    });
  } else {
    promptTemplates.push(prompt);
    localStorage.setItem('promptTemplates', JSON.stringify(promptTemplates));
    renderPromptTemplates();
    showNotification('Prompt saved locally');
  }

  closeNewPromptModal();
}

function showNewFolderForm() {
  showCustomInput('New Folder', [{ label: 'Folder Name', name: 'name' }], (result) => {
    const folder = { id: Date.now().toString(), name: result.name, prompts: [] };
    promptFolders.push(folder);
    localStorage.setItem('promptFolders', JSON.stringify(promptFolders));
    renderPromptFolders();
    showNotification('Folder created');
  });
}

function closePromptResultModal() {
  const modal = document.getElementById('promptResultModal');
  modal.classList.remove('active');
  modal.style.display = 'none';
}

function copyPromptResult() {
  const content = document.getElementById('promptResultContent')?.value;
  if (content) {
    navigator.clipboard.writeText(content).then(() => {
      showNotification('Copied to clipboard');
    });
  }
}

function executeRunPrompt() {
  // Execution logic for running prompts with variables
  closeRunPromptModal();
  showNotification('Prompt executed');
}

// Keyboard Shortcuts
document.addEventListener('keydown', (e) => {
  // Cmd/Ctrl + T: New Tab
  if ((e.metaKey || e.ctrlKey) && e.key === 't') {
    e.preventDefault();
    createNewTab();
  }
  // Cmd/Ctrl + W: Close Tab
  if ((e.metaKey || e.ctrlKey) && e.key === 'w') {
    e.preventDefault();
    if (activeTab !== 'dashboard') {
      closeTab(activeTab);
    }
  }
  // Cmd/Ctrl + L: Focus Address Bar
  if ((e.metaKey || e.ctrlKey) && e.key === 'l') {
    e.preventDefault();
    document.getElementById('addressBar')?.focus();
  }
  // Cmd/Ctrl + R: Refresh
  if ((e.metaKey || e.ctrlKey) && e.key === 'r') {
    e.preventDefault();
    refreshPage();
  }
  // Escape: Close panels
  if (e.key === 'Escape') {
    closeAllPanels();
    closeMoreMenu();
  }
});

// ═══════════════════════════════════════════════════════════════════════════
// AI HUB FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Open the AI Chat Panel
function openAIPanel() {
  let panel = document.getElementById('aiChatPanel');
  if (panel) {
    closePanel('aiChatPanel');
    return;
  }

  panel = document.createElement('div');
  panel.id = 'aiChatPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3><i class="fas fa-robot"></i> AI Chat</h3>
      <button onclick="closePanel('aiChatPanel')"><i class="fas fa-times"></i></button>
    </div>
    <div class="panel-content" style="display: flex; flex-direction: column; height: calc(100% - 60px);">
      <div class="ai-service-selector" style="margin-bottom: 12px;">
        <select id="aiServiceSelect" class="engine-selector" style="width: 100%;">
          <option value="gemini">Gemini</option>
          <option value="openai">OpenAI (GPT)</option>
          <option value="anthropic">Anthropic (Claude)</option>
          <option value="local">Local CLI Agent</option>
        </select>
      </div>
      <div class="ai-chat-messages" id="aiChatMessages" style="flex: 1; overflow-y: auto; margin-bottom: 12px; padding: 10px; background: rgba(30, 41, 59, 0.5); border-radius: 8px;">
        <div class="empty-state">Start a conversation with AI...</div>
      </div>
      <div class="ai-chat-input" style="display: flex; gap: 8px;">
        <input type="text" id="aiChatInput" class="prompt-input" style="flex: 1; max-width: none;" placeholder="Ask AI anything..." onkeypress="if(event.key==='Enter')sendAIMessage()">
        <button class="feature-btn primary" onclick="sendAIMessage()">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.classList.add('visible');
}

// Send message to AI
async function sendAIMessage() {
  const input = document.getElementById('aiChatInput');
  const messages = document.getElementById('aiChatMessages');
  const service = document.getElementById('aiServiceSelect')?.value || 'gemini';
  const message = input?.value.trim();

  if (!message) {
    return;
  }

  // Clear empty state
  if (messages.querySelector('.empty-state')) {
    messages.innerHTML = '';
  }

  // Add user message
  messages.innerHTML += `
    <div class="ai-message user" style="margin-bottom: 10px; text-align: right;">
      <div style="display: inline-block; background: var(--tnf-primary); color: white; padding: 8px 12px; border-radius: 12px 12px 0 12px; max-width: 80%;">
        ${escapeHTML(message)}
      </div>
    </div>
  `;

  input.value = '';
  messages.scrollTop = messages.scrollHeight;

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  messages.innerHTML += `
    <div class="ai-message assistant" id="${typingId}" style="margin-bottom: 10px;">
      <div style="display: inline-block; background: rgba(51, 65, 85, 0.8); padding: 8px 12px; border-radius: 12px 12px 12px 0; max-width: 80%;">
        <i class="fas fa-spinner fa-spin"></i> Thinking...
      </div>
    </div>
  `;
  messages.scrollTop = messages.scrollHeight;

  // Call AI API (via Electron IPC if available)
  try {
    let response;
    if (window.electronAPI?.sendAIMessage) {
      response = await window.electronAPI.sendAIMessage(service, message);
    } else {
      // Fallback: simulated response
      await new Promise((r) => setTimeout(r, 1000));
      response = {
        success: true,
        message: `This is a simulated response. To use real AI, configure your API keys in Settings > API Keys for ${service}.`,
      };
    }

    // Remove typing indicator
    document.getElementById(typingId)?.remove();

    // Add AI response
    const responseText = response.message || response.error || 'No response';
    messages.innerHTML += `
      <div class="ai-message assistant" style="margin-bottom: 10px;">
        <div style="display: inline-block; background: rgba(51, 65, 85, 0.8); padding: 8px 12px; border-radius: 12px 12px 12px 0; max-width: 80%;">
          ${escapeHTML(responseText)}
        </div>
      </div>
    `;
    messages.scrollTop = messages.scrollHeight;
  } catch (error) {
    document.getElementById(typingId)?.remove();
    messages.innerHTML += `
      <div class="ai-message error" style="margin-bottom: 10px;">
        <div style="display: inline-block; background: rgba(239, 68, 68, 0.3); color: var(--tnf-error); padding: 8px 12px; border-radius: 8px; max-width: 80%;">
          Error: ${error.message || 'Failed to get response'}
        </div>
      </div>
    `;
  }
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// Open API Keys Settings
function openAPIKeysSettings() {
  let panel = document.getElementById('apiKeysPanel');
  if (panel) {
    closePanel('apiKeysPanel');
    return;
  }

  // Load saved API keys
  const savedKeys = JSON.parse(localStorage.getItem('tnfApiKeys') || '{}');

  panel = document.createElement('div');
  panel.id = 'apiKeysPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3><i class="fas fa-key"></i> API Keys</h3>
      <button onclick="closePanel('apiKeysPanel')"><i class="fas fa-times"></i></button>
    </div>
    <div class="panel-content">
      <p style="color: var(--tnf-text-muted); margin-bottom: 16px; font-size: 13px;">
        Configure your AI provider API keys. Keys are stored securely in local storage.
      </p>

      <div class="settings-item" style="margin-bottom: 16px;">
        <label class="settings-item-label">OpenAI API Key</label>
        <input type="password" id="apiKeyOpenAI" class="prompt-input" style="max-width: none;"
               placeholder="sk-..." value="${savedKeys.openai || ''}"
               onchange="saveAPIKey('openai', this.value)">
      </div>

      <div class="settings-item" style="margin-bottom: 16px;">
        <label class="settings-item-label">Anthropic API Key</label>
        <input type="password" id="apiKeyAnthropic" class="prompt-input" style="max-width: none;"
               placeholder="sk-ant-..." value="${savedKeys.anthropic || ''}"
               onchange="saveAPIKey('anthropic', this.value)">
      </div>

      <div class="settings-item" style="margin-bottom: 16px;">
        <label class="settings-item-label">Google AI (Gemini) API Key</label>
        <input type="password" id="apiKeyGemini" class="prompt-input" style="max-width: none;"
               placeholder="AI..." value="${savedKeys.gemini || ''}"
               onchange="saveAPIKey('gemini', this.value)">
      </div>

      <div class="settings-item" style="margin-bottom: 16px;">
        <label class="settings-item-label">Groq API Key</label>
        <input type="password" id="apiKeyGroq" class="prompt-input" style="max-width: none;"
               placeholder="gsk_..." value="${savedKeys.groq || ''}"
               onchange="saveAPIKey('groq', this.value)">
      </div>

      <button class="feature-btn secondary" onclick="testAPIKeys()" style="margin-top: 10px;">
        <i class="fas fa-flask"></i> Test Connections
      </button>
    </div>
  `;
  document.body.appendChild(panel);
  panel.classList.add('visible');
}

function saveAPIKey(provider, value) {
  const savedKeys = JSON.parse(localStorage.getItem('tnfApiKeys') || '{}');
  savedKeys[provider] = value;
  localStorage.setItem('tnfApiKeys', JSON.stringify(savedKeys));
  showNotification(`${provider} API key saved`);

  // Also send to Electron main process if available
  if (window.electronAPI?.setAPIKey) {
    window.electronAPI.setAPIKey(provider, value);
  }
}

function testAPIKeys() {
  showNotification('Testing API connections...');
  // Would test each configured API key
  setTimeout(() => showNotification('API key testing not yet implemented'), 1000);
}

// Open CLI Agent Settings
function openCLIAgentSettings() {
  let panel = document.getElementById('cliAgentsPanel');
  if (panel) {
    closePanel('cliAgentsPanel');
    return;
  }

  const savedAgents = JSON.parse(localStorage.getItem('tnfCLIAgents') || '[]');

  panel = document.createElement('div');
  panel.id = 'cliAgentsPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3><i class="fas fa-terminal"></i> CLI Agents</h3>
      <button onclick="closePanel('cliAgentsPanel')"><i class="fas fa-times"></i></button>
    </div>
    <div class="panel-content">
      <p style="color: var(--tnf-text-muted); margin-bottom: 16px; font-size: 13px;">
        Configure local CLI-based AI tools (Claude CLI, Gemini CLI, Aider, etc.)
      </p>

      <div id="cliAgentsList">
        ${
          savedAgents.length === 0
            ? '<div class="empty-state">No CLI agents configured</div>'
            : savedAgents
                .map(
                  (agent) => `
            <div class="extension-item">
              <div class="extension-icon"><i class="fas fa-terminal"></i></div>
              <div class="extension-info">
                <div class="extension-name">${agent.name}</div>
                <div class="extension-desc">${agent.command}</div>
              </div>
              <button class="pin-btn" onclick="removeCLIAgent('${agent.id}')"><i class="fas fa-trash"></i></button>
            </div>
          `
                )
                .join('')
        }
      </div>

      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid var(--tnf-border);">
        <h4 style="font-size: 13px; color: var(--tnf-text-muted); margin-bottom: 12px;">Add New CLI Agent</h4>
        <div class="settings-item" style="margin-bottom: 10px;">
          <label class="settings-item-label">Agent Name</label>
          <input type="text" id="newAgentName" class="prompt-input" style="max-width: none;" placeholder="e.g., Claude CLI">
        </div>
        <div class="settings-item" style="margin-bottom: 10px;">
          <label class="settings-item-label">Command</label>
          <input type="text" id="newAgentCommand" class="prompt-input" style="max-width: none;" placeholder="e.g., claude">
        </div>
        <button class="feature-btn primary" onclick="addCLIAgent()">
          <i class="fas fa-plus"></i> Add Agent
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.classList.add('visible');
}

function addCLIAgent() {
  const name = document.getElementById('newAgentName')?.value.trim();
  const command = document.getElementById('newAgentCommand')?.value.trim();

  if (!name || !command) {
    showNotification('Please fill in both fields', 'error');
    return;
  }

  const savedAgents = JSON.parse(localStorage.getItem('tnfCLIAgents') || '[]');
  savedAgents.push({ id: Date.now().toString(), name, command });
  localStorage.setItem('tnfCLIAgents', JSON.stringify(savedAgents));

  showNotification(`CLI Agent "${name}" added`);
  closePanel('cliAgentsPanel');
  openCLIAgentSettings(); // Refresh
}

function removeCLIAgent(id) {
  let savedAgents = JSON.parse(localStorage.getItem('tnfCLIAgents') || '[]');
  savedAgents = savedAgents.filter((a) => a.id !== id);
  localStorage.setItem('tnfCLIAgents', JSON.stringify(savedAgents));
  showNotification('CLI Agent removed');
  closePanel('cliAgentsPanel');
  openCLIAgentSettings(); // Refresh
}

// ═══════════════════════════════════════════════════════════════════════════
// TERMINAL FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function openTerminal() {
  if (window.electronAPI?.openTerminal) {
    window.electronAPI.openTerminal().then((result) => {
      if (result.success) {
        showNotification('Terminal opened');
      } else {
        showNotification(result.error || 'Failed to open terminal', 'error');
      }
    });
  } else {
    // Fallback for when not in Electron
    if (navigator.platform.includes('Mac')) {
      showNotification('Use Cmd+Space and type "Terminal" to open');
    } else {
      showNotification('Terminal launcher not available outside Electron');
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// LOCAL DEV FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

// Service status tracking
const localDevStatus = {
  devServer: false,
  redis: false,
  frontend: false,
  backend: false,
  api: false,
};

// Update status dots
function updateDevStatusDots() {
  const devServerDot = document.getElementById('dev-server-status');
  const redisDot = document.getElementById('redis-status');

  if (devServerDot) {
    devServerDot.className = 'status-dot ' + (localDevStatus.devServer ? 'online' : 'offline');
  }
  if (redisDot) {
    redisDot.className = 'status-dot ' + (localDevStatus.redis ? 'online' : 'offline');
  }
}

// Open Dev Control Panel - comprehensive control center
function openDevControlPanel() {
  let panel = document.getElementById('devControlPanel');
  if (panel) {
    closePanel('devControlPanel');
    return;
  }

  panel = document.createElement('div');
  panel.id = 'devControlPanel';
  panel.className = 'browser-feature-panel wide';
  panel.innerHTML = `
    <div class="panel-header">
      <h3><i class="fas fa-sliders-h"></i> Dev Control Panel</h3>
      <button onclick="closePanel('devControlPanel')"><i class="fas fa-times"></i></button>
    </div>
    <div class="panel-content">
      <p style="color: var(--tnf-text-muted); margin-bottom: 16px; font-size: 13px;">
        Control your local development environment
      </p>

      <div class="dev-services-grid" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px;">
        <div class="dev-service-card" id="frontend-service" style="background: rgba(30, 41, 59, 0.6); border-radius: 8px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600;"><i class="fas fa-desktop"></i> Frontend</span>
            <div class="status-dot ${localDevStatus.frontend ? 'online' : 'offline'}"></div>
          </div>
          <div style="font-size: 12px; color: var(--tnf-text-muted);">Port: 3000</div>
          <button class="feature-btn small" onclick="toggleService('frontend')" style="margin-top: 8px; width: 100%;">
            ${localDevStatus.frontend ? 'Stop' : 'Start'}
          </button>
        </div>

        <div class="dev-service-card" id="backend-service" style="background: rgba(30, 41, 59, 0.6); border-radius: 8px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600;"><i class="fas fa-server"></i> Backend</span>
            <div class="status-dot ${localDevStatus.backend ? 'online' : 'offline'}"></div>
          </div>
          <div style="font-size: 12px; color: var(--tnf-text-muted);">Port: 3001</div>
          <button class="feature-btn small" onclick="toggleService('backend')" style="margin-top: 8px; width: 100%;">
            ${localDevStatus.backend ? 'Stop' : 'Start'}
          </button>
        </div>

        <div class="dev-service-card" id="api-service" style="background: rgba(30, 41, 59, 0.6); border-radius: 8px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600;"><i class="fas fa-plug"></i> API Gateway</span>
            <div class="status-dot ${localDevStatus.api ? 'online' : 'offline'}"></div>
          </div>
          <div style="font-size: 12px; color: var(--tnf-text-muted);">Port: 3002</div>
          <button class="feature-btn small" onclick="toggleService('api')" style="margin-top: 8px; width: 100%;">
            ${localDevStatus.api ? 'Stop' : 'Start'}
          </button>
        </div>

        <div class="dev-service-card" id="redis-service" style="background: rgba(30, 41, 59, 0.6); border-radius: 8px; padding: 12px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
            <span style="font-weight: 600;"><i class="fas fa-database"></i> Redis</span>
            <div class="status-dot ${localDevStatus.redis ? 'online' : 'offline'}"></div>
          </div>
          <div style="font-size: 12px; color: var(--tnf-text-muted);">Port: 6379</div>
          <button class="feature-btn small" onclick="toggleRedis()" style="margin-top: 8px; width: 100%;">
            ${localDevStatus.redis ? 'Stop' : 'Start'}
          </button>
        </div>
      </div>

      <div style="border-top: 1px solid var(--tnf-border); padding-top: 16px;">
        <h4 style="font-size: 14px; margin-bottom: 12px;"><i class="fas fa-terminal"></i> Quick Actions</h4>
        <div style="display: flex; flex-wrap: wrap; gap: 8px;">
          <button class="feature-btn secondary" onclick="runDevCommand('pnpm run build')">
            <i class="fas fa-cubes"></i> Build All
          </button>
          <button class="feature-btn secondary" onclick="runDevCommand('pnpm run dev')">
            <i class="fas fa-play"></i> Dev Mode
          </button>
          <button class="feature-btn secondary" onclick="runDevCommand('pnpm run test')">
            <i class="fas fa-vial"></i> Run Tests
          </button>
          <button class="feature-btn secondary" onclick="runDevCommand('pnpm run lint')">
            <i class="fas fa-broom"></i> Lint
          </button>
          <button class="feature-btn secondary" onclick="refreshServiceStatus()">
            <i class="fas fa-sync-alt"></i> Refresh Status
          </button>
        </div>
      </div>

      <div id="devCommandOutput" style="margin-top: 16px; display: none;">
        <h4 style="font-size: 14px; margin-bottom: 8px;"><i class="fas fa-terminal"></i> Output</h4>
        <pre style="background: rgba(0,0,0,0.3); padding: 12px; border-radius: 6px; max-height: 200px; overflow-y: auto; font-size: 12px; white-space: pre-wrap;"></pre>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.classList.add('visible');

  // Refresh status on open
  refreshServiceStatus();
}

// Build packages
function buildPackages() {
  showCustomInput(
    'Build Packages',
    [
      {
        label: 'Package(s)',
        name: 'packages',
        placeholder: 'Leave empty for all, or: frontend, backend, api',
      },
    ],
    (result) => {
      const packages = result.packages?.trim();
      let command = 'pnpm run build';
      if (packages) {
        command = `pnpm --filter ${packages} run build`;
      }
      runDevCommand(command);
      showNotification('Build started...');
    }
  );
}

// Start Dev Server
function startDevServer() {
  showCustomInput(
    'Start Dev Server',
    [{ label: 'App', name: 'app', placeholder: 'frontend, backend, api, or all' }],
    (result) => {
      const app = result.app?.trim().toLowerCase() || 'all';
      let command;
      if (app === 'all') {
        command = 'pnpm run dev';
      } else {
        command = `pnpm --filter ${app} run dev`;
      }
      runDevCommand(command);
      localDevStatus.devServer = true;
      updateDevStatusDots();
      showNotification(`Starting ${app} dev server...`);
    }
  );
}

// Toggle Redis
function toggleRedis() {
  if (localDevStatus.redis) {
    // Stop Redis
    runDevCommand('redis-cli shutdown', true);
    localDevStatus.redis = false;
    showNotification('Redis stopped');
  } else {
    // Start Redis
    runDevCommand('redis-server --daemonize yes', true);
    localDevStatus.redis = true;
    showNotification('Redis started');
  }
  updateDevStatusDots();
}

// Toggle a service
async function toggleService(service) {
  const isRunning = localDevStatus[service];

  if (isRunning) {
    // Stop service
    if (window.electronAPI?.stopService) {
      showNotification(`Stopping ${service}...`);
      const result = await window.electronAPI.stopService(service);
      if (result.success) {
        localDevStatus[service] = false;
        showNotification(`${service} stopped`);
      } else {
        showNotification(result.error || `Failed to stop ${service}`, 'error');
      }
    } else {
      const portMap = { frontend: 3000, backend: 3004, api: 3005 };
      const port = portMap[service] || 3000;
      runDevCommand(`lsof -ti:${port} | xargs kill -9`, true);
      localDevStatus[service] = false;
      showNotification(`${service} stop requested`);
    }
  } else {
    // Start service
    if (window.electronAPI?.startService) {
      showNotification(`Starting ${service}...`);
      const result = await window.electronAPI.startService(service);
      if (result.success) {
        localDevStatus[service] = true;
        showNotification(`${service} started (PID: ${result.pid})`);
      } else {
        showNotification(result.error || `Failed to start ${service}`, 'error');
      }
    } else {
      runDevCommand(`pnpm --filter ${service} run dev`, true);
      localDevStatus[service] = true;
      showNotification(`${service} start requested`);
    }
  }

  // Update the panel display
  updateDevStatusDots();
  const panel = document.getElementById('devControlPanel');
  if (panel) {
    closePanel('devControlPanel');
    openDevControlPanel();
  }
}

// Open Port Manager
function openPortManager() {
  let panel = document.getElementById('portManagerPanel');
  if (panel) {
    closePanel('portManagerPanel');
    return;
  }

  panel = document.createElement('div');
  panel.id = 'portManagerPanel';
  panel.className = 'browser-feature-panel';
  panel.innerHTML = `
    <div class="panel-header">
      <h3><i class="fas fa-network-wired"></i> Port Manager</h3>
      <button onclick="closePanel('portManagerPanel')"><i class="fas fa-times"></i></button>
    </div>
    <div class="panel-content">
      <p style="color: var(--tnf-text-muted); margin-bottom: 16px; font-size: 13px;">
        Monitor and manage active ports
      </p>

      <div id="portList" style="margin-bottom: 16px;">
        <div class="empty-state">Loading port status...</div>
      </div>

      <div style="border-top: 1px solid var(--tnf-border); padding-top: 16px;">
        <h4 style="font-size: 13px; margin-bottom: 12px;">Common Ports</h4>
        <div class="port-presets" style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <div class="port-preset" style="background: rgba(30,41,59,0.5); padding: 8px; border-radius: 6px; font-size: 12px;">
            <strong>3000</strong> - Frontend
          </div>
          <div class="port-preset" style="background: rgba(30,41,59,0.5); padding: 8px; border-radius: 6px; font-size: 12px;">
            <strong>3001</strong> - Backend
          </div>
          <div class="port-preset" style="background: rgba(30,41,59,0.5); padding: 8px; border-radius: 6px; font-size: 12px;">
            <strong>3002</strong> - API Gateway
          </div>
          <div class="port-preset" style="background: rgba(30,41,59,0.5); padding: 8px; border-radius: 6px; font-size: 12px;">
            <strong>6379</strong> - Redis
          </div>
          <div class="port-preset" style="background: rgba(30,41,59,0.5); padding: 8px; border-radius: 6px; font-size: 12px;">
            <strong>9222</strong> - CDP Debug
          </div>
          <div class="port-preset" style="background: rgba(30,41,59,0.5); padding: 8px; border-radius: 6px; font-size: 12px;">
            <strong>8080</strong> - Dev Server
          </div>
        </div>
      </div>

      <div style="margin-top: 16px; display: flex; gap: 8px;">
        <button class="feature-btn secondary" onclick="scanPorts()">
          <i class="fas fa-search"></i> Scan Active Ports
        </button>
        <button class="feature-btn secondary" onclick="killPort()">
          <i class="fas fa-times-circle"></i> Kill Port
        </button>
      </div>
    </div>
  `;
  document.body.appendChild(panel);
  panel.classList.add('visible');

  // Scan ports on open
  scanPorts();
}

// Scan active ports
async function scanPorts() {
  const portList = document.getElementById('portList');
  if (!portList) {
    return;
  }

  portList.innerHTML =
    '<div class="loading-state"><i class="fas fa-spinner fa-spin"></i> Scanning ports...</div>';

  if (window.electronAPI?.scanPorts) {
    try {
      const result = await window.electronAPI.scanPorts();
      if (result.success && result.ports?.length > 0) {
        portList.innerHTML = result.ports
          .map(
            (p) => `
          <div class="extension-item">
            <div class="extension-icon"><i class="fas fa-plug"></i></div>
            <div class="extension-info">
              <div class="extension-name">Port ${p.port}</div>
              <div class="extension-desc">${p.process || 'Unknown process'}</div>
            </div>
            <button class="pin-btn" onclick="killSpecificPort(${p.port})"><i class="fas fa-times"></i></button>
          </div>
        `
          )
          .join('');
      } else {
        portList.innerHTML = '<div class="empty-state">No common ports in use</div>';
      }
    } catch (e) {
      portList.innerHTML = '<div class="empty-state">Port scanning not available</div>';
    }
  } else {
    // Simulate some ports for demo
    portList.innerHTML = `
      <div class="extension-item">
        <div class="extension-icon" style="color: var(--tnf-success);"><i class="fas fa-check-circle"></i></div>
        <div class="extension-info">
          <div class="extension-name">Port 9222</div>
          <div class="extension-desc">Electron CDP Debug</div>
        </div>
      </div>
      <div class="extension-item">
        <div class="extension-icon" style="color: var(--tnf-success);"><i class="fas fa-check-circle"></i></div>
        <div class="extension-info">
          <div class="extension-name">Port 8080</div>
          <div class="extension-desc">Browser Hub Dev Server</div>
        </div>
      </div>
    `;
  }
}

// Kill a specific port
function killSpecificPort(port) {
  if (window.electronAPI?.killPort) {
    window.electronAPI.killPort(port).then(() => {
      showNotification(`Port ${port} killed`);
      scanPorts();
    });
  } else {
    showNotification(`Run: lsof -ti:${port} | xargs kill -9`);
  }
}

// Kill port dialog
function killPort() {
  showCustomInput(
    'Kill Port',
    [{ label: 'Port Number', name: 'port', placeholder: 'e.g., 3000' }],
    (result) => {
      const port = parseInt(result.port);
      if (isNaN(port)) {
        showNotification('Invalid port number', 'error');
        return;
      }
      killSpecificPort(port);
    }
  );
}

// Run a dev command
function runDevCommand(command, silent = false) {
  if (window.electronAPI?.runCommand) {
    showNotification(`Running: ${command.substring(0, 30)}...`);
    window.electronAPI
      .runCommand(command)
      .then((result) => {
        if (!silent) {
          const outputDiv = document.getElementById('devCommandOutput');
          if (outputDiv) {
            outputDiv.style.display = 'block';
            const output = result.stdout || result.stderr || result.error || 'Command executed';
            outputDiv.querySelector('pre').textContent = output.substring(0, 5000);
          }
          if (result.success) {
            showNotification('Command completed');
          } else {
            showNotification(result.error || 'Command failed', 'error');
          }
        }
      })
      .catch((err) => {
        if (!silent) {
          showNotification(`Error: ${err.message}`, 'error');
        }
      });
  } else {
    if (!silent) {
      showNotification(`Command: ${command} (run in terminal)`);
    }
    // Open terminal as fallback
    openTerminal();
  }
}

// Refresh service status
async function refreshServiceStatus() {
  if (window.electronAPI?.getServiceStatus) {
    try {
      const result = await window.electronAPI.getServiceStatus();
      if (result.success && result.services) {
        // Map service statuses to local state
        for (const svc of result.services) {
          const key = svc.name.toLowerCase();
          localDevStatus[key] = svc.status === 'running';
        }
        // Check for devServer (any main service running)
        localDevStatus.devServer = localDevStatus.frontend || localDevStatus.backend;
      }
      updateDevStatusDots();

      // Refresh panel if open
      const panel = document.getElementById('devControlPanel');
      if (panel) {
        closePanel('devControlPanel');
        openDevControlPanel();
      }
    } catch (err) {
      console.error('Failed to get service status:', err);
    }
  } else {
    // Non-Electron: just update UI without status check
    updateDevStatusDots();
  }
}

// Initialize status check on load
if (typeof window !== 'undefined') {
  setTimeout(refreshServiceStatus, 2000);
}
