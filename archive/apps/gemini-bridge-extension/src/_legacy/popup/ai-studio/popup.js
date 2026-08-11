// Popup UI Logic
// Main controller for the extension popup interface

console.log('🎬 AI Video Intelligence Suite - Popup initializing...');

// State management
let state = {
  authenticated: false,
  playlists: [],
  selectedPlaylist: null,
  videos: [],
  filteredVideos: [],
  selectedVideos: new Set(),
  processing: false,
  subscription: null,
  user: null,
};

// DOM elements
const elements = {
  // Panels
  authPanel: document.getElementById('authPanel'),
  mainInterface: document.getElementById('mainInterface'),
  processingView: document.getElementById('processingView'),

  // Auth
  authBtn: document.getElementById('authBtn'),

  // Header
  userEmail: document.getElementById('userEmail'),
  tierBadge: document.getElementById('tierBadge'),
  settingsBtn: document.getElementById('settingsBtn'),

  // Usage stats
  usageStats: document.getElementById('usageStats'),
  dailyUsage: document.getElementById('dailyUsage'),
  dailyLimit: document.getElementById('dailyLimit'),
  usageProgress: document.getElementById('usageProgress'),
  upgradePrompt: document.getElementById('upgradePrompt'),

  // Playlists
  sourcePlaylist: document.getElementById('sourcePlaylist'),
  destPlaylist: document.getElementById('destPlaylist'),
  refreshPlaylists: document.getElementById('refreshPlaylists'),
  createPlaylist: document.getElementById('createPlaylist'),
  playlistVideoCount: document.getElementById('playlistVideoCount'),

  // Filters
  searchFilter: document.getElementById('searchFilter'),
  clearFilter: document.getElementById('clearFilter'),
  filterWatched: document.getElementById('filterWatched'),
  filterDuplicates: document.getElementById('filterDuplicates'),
  filterShort: document.getElementById('filterShort'),

  // Video list
  videoList: document.getElementById('videoList'),
  videoListEmpty: document.getElementById('videoListEmpty'),
  videoCount: document.getElementById('videoCount'),
  selectAll: document.getElementById('selectAll'),
  deselectAll: document.getElementById('deselectAll'),
  selectedCount: document.getElementById('selectedCount'),

  // Actions
  processBtn: document.getElementById('processBtn'),
  bulkImportBtn: document.getElementById('bulkImportBtn'),
  exportQueueBtn: document.getElementById('exportQueueBtn'),

  // Processing view
  backToQueue: document.getElementById('backToQueue'),
  processedCount: document.getElementById('processedCount'),
  totalCount: document.getElementById('totalCount'),
  successRate: document.getElementById('successRate'),
  estimatedTime: document.getElementById('estimatedTime'),
  processProgress: document.getElementById('processProgress'),
  progressPercent: document.getElementById('progressPercent'),
  currentVideoThumb: document.getElementById('currentVideoThumb'),
  currentVideoTitle: document.getElementById('currentVideoTitle'),
  currentVideoStatus: document.getElementById('currentVideoStatus'),
  currentVideoProgress: document.getElementById('currentVideoProgress'),
  processLogs: document.getElementById('processLogs'),
  clearLogs: document.getElementById('clearLogs'),
  pauseBtn: document.getElementById('pauseBtn'),
  resumeBtn: document.getElementById('resumeBtn'),
  stopBtn: document.getElementById('stopBtn'),

  // Footer
  totalProcessed: document.getElementById('totalProcessed'),

  // Modals
  subscriptionModal: document.getElementById('subscriptionModal'),
  settingsModal: document.getElementById('settingsModal'),
};

// Initialize popup
async function init() {
  console.log('Initializing popup...');

  try {
    // Check authentication
    const isAuth = await checkAuthentication();

    if (isAuth) {
      await loadUserData();
      await loadPlaylists();
      showMainInterface();
    } else {
      showAuthPanel();
    }

    // Set up event listeners
    setupEventListeners();

    // Load processing state if active
    await checkProcessingState();

    console.log('✅ Popup initialized');
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to initialize. Please refresh.');
  }
}

// Check if user is authenticated
async function checkAuthentication() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_CHECK_AUTH',
    });

    // response.data is { authenticated: true/false }
    state.authenticated = response.success && response.data && response.data.authenticated === true;
    return state.authenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

// Load user data
async function loadUserData() {
  try {
    // Get subscription status
    const subResponse = await chrome.runtime.sendMessage({
      type: 'SUBSCRIPTION_CHECK',
    });

    if (subResponse.success) {
      state.subscription = subResponse.data;
      updateSubscriptionUI();
    }

    // Get user stats
    const stats = await chrome.storage.local.get([
      'dailyUsage',
      'dailyLimit',
      'totalProcessed',
      'userId',
    ]);

    state.user = stats;
    updateStatsUI();

    // Get user email
    chrome.identity.getProfileUserInfo((userInfo) => {
      if (userInfo && userInfo.email) {
        state.userEmail = userInfo.email;
        if (elements.userEmail) {
          elements.userEmail.textContent = userInfo.email;
        }
        const settingsEmail = document.getElementById('settingsEmail');
        if (settingsEmail) {
          settingsEmail.textContent = userInfo.email;
        }
      }
    });
  } catch (error) {
    console.error('Failed to load user data:', error);
  }
}

// Load playlists
async function loadPlaylists() {
  try {
    showLoading(elements.sourcePlaylist, 'Loading playlists...');

    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_GET_PLAYLISTS',
    });

    if (response.success) {
      state.playlists = response.data;
      populatePlaylistDropdowns();
    } else {
      throw new Error(response.error || 'Failed to load playlists');
    }
  } catch (error) {
    console.error('Failed to load playlists:', error);
    showError('Failed to load playlists. Please try again.');
  }
}

// Populate playlist dropdowns
function populatePlaylistDropdowns() {
  // Source playlist
  elements.sourcePlaylist.innerHTML = '<option value="">Select a playlist...</option>';

  state.playlists.forEach((playlist) => {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = `${playlist.title} (${playlist.videoCount} videos)`;
    elements.sourcePlaylist.appendChild(option);
  });

  // Destination playlist
  elements.destPlaylist.innerHTML = '<option value="">Select destination...</option>';

  state.playlists.forEach((playlist) => {
    const option = document.createElement('option');
    option.value = playlist.id;
    option.textContent = playlist.title;
    elements.destPlaylist.appendChild(option);
  });
}

// Load videos from selected playlist
async function loadPlaylistVideos(playlistId) {
  try {
    showLoading(elements.videoList, 'Loading videos...');

    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_GET_PLAYLIST_VIDEOS',
      data: { playlistId },
    });

    if (response.success) {
      state.videos = response.data;

      // Get video details (duration, etc.)
      const videoIds = state.videos.map((v) => v.id);
      const detailsResponse = await chrome.runtime.sendMessage({
        type: 'YOUTUBE_GET_VIDEO_DETAILS',
        data: { videoIds },
      });

      if (detailsResponse.success) {
        // Merge details with videos
        state.videos = state.videos.map((video) => {
          const details = detailsResponse.data.find((d) => d.id === video.id);
          return { ...video, ...details };
        });
      }

      applyFilters();
      renderVideoList();
    } else {
      throw new Error(response.error || 'Failed to load videos');
    }
  } catch (error) {
    console.error('Failed to load videos:', error);
    showError('Failed to load videos. Please try again.');
  }
}

// Apply filters to video list
function applyFilters() {
  let filtered = [...state.videos];

  // Search filter
  const searchTerm = elements.searchFilter.value.toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(
      (video) =>
        video.title.toLowerCase().includes(searchTerm) ||
        video.channelTitle.toLowerCase().includes(searchTerm)
    );
  }

  // Duration filter (only videos > 10 min)
  if (elements.filterShort.checked) {
    filtered = filtered.filter((video) => video.duration > 600);
  }

  // TODO: Add watched and duplicates filters when we have that data

  state.filteredVideos = filtered;
  elements.videoCount.textContent = filtered.length;
}

// Render video list
function renderVideoList() {
  if (state.filteredVideos.length === 0) {
    elements.videoList.classList.add('hidden');
    elements.videoListEmpty.classList.remove('hidden');
    return;
  }

  elements.videoList.classList.remove('hidden');
  elements.videoListEmpty.classList.add('hidden');

  elements.videoList.innerHTML = state.filteredVideos
    .map(
      (video) => `
    <div class="video-item ${state.selectedVideos.has(video.id) ? 'selected' : ''}" 
         data-video-id="${video.id}">
      <label class="video-checkbox">
        <input type="checkbox" 
               ${state.selectedVideos.has(video.id) ? 'checked' : ''}
               data-video-id="${video.id}">
      </label>
      <div class="video-thumbnail">
        <img src="${video.thumbnail}" alt="${video.title}">
        <span class="video-duration">${formatDuration(video.duration)}</span>
      </div>
      <div class="video-info">
        <h4 class="video-title">${escapeHtml(video.title)}</h4>
        <p class="video-channel">${escapeHtml(video.channelTitle)}</p>
        <div class="video-meta">
          <span>${formatNumber(video.viewCount)} views</span>
          ${video.likeCount ? `<span>👍 ${formatNumber(video.likeCount)}</span>` : ''}
        </div>
      </div>
    </div>
  `
    )
    .join('');

  // Add click handlers to checkboxes
  elements.videoList.querySelectorAll('input[type="checkbox"]').forEach((checkbox) => {
    checkbox.addEventListener('change', handleVideoSelection);
  });

  // Add click handlers to video items
  elements.videoList.querySelectorAll('.video-item').forEach((item) => {
    item.addEventListener('click', (e) => {
      if (e.target.type !== 'checkbox') {
        const checkbox = item.querySelector('input[type="checkbox"]');
        checkbox.checked = !checkbox.checked;
        checkbox.dispatchEvent(new Event('change'));
      }
    });
  });

  updateSelectionUI();
}

// Handle video selection
function handleVideoSelection(e) {
  const videoId = e.target.dataset.videoId;

  if (e.target.checked) {
    state.selectedVideos.add(videoId);
  } else {
    state.selectedVideos.delete(videoId);
  }

  updateSelectionUI();
}

// Update selection UI
function updateSelectionUI() {
  const count = state.selectedVideos.size;
  elements.selectedCount.textContent = count;
  elements.processBtn.disabled = count === 0;

  // Update video item classes
  document.querySelectorAll('.video-item').forEach((item) => {
    const videoId = item.dataset.videoId;
    if (state.selectedVideos.has(videoId)) {
      item.classList.add('selected');
    } else {
      item.classList.remove('selected');
    }
  });
}

// Start processing
async function startProcessing() {
  try {
    // Check subscription limits
    const canProcess = await chrome.runtime.sendMessage({
      type: 'SUBSCRIPTION_CAN_PROCESS',
    });

    if (!canProcess.success || !canProcess.data) {
      showUpgradeModal();
      return;
    }

    // Get selected videos
    const selectedVideoData = state.filteredVideos.filter((v) => state.selectedVideos.has(v.id));

    // Add to queue
    await chrome.runtime.sendMessage({
      type: 'QUEUE_ADD',
      data: { videos: selectedVideoData },
    });

    // Start automation
    const response = await chrome.runtime.sendMessage({
      type: 'AUTOMATION_START',
      data: {
        queue: selectedVideoData,
        segmentDuration: 45,
        destPlaylist: elements.destPlaylist.value,
      },
    });

    if (response.success) {
      showProcessingView();
      trackEvent('automation_started', { videoCount: selectedVideoData.length });
    } else {
      throw new Error(response.error || 'Failed to start automation');
    }
  } catch (error) {
    console.error('Failed to start processing:', error);
    showError('Failed to start processing. Please try again.');
  }
}

// Check processing state
async function checkProcessingState() {
  const { processingState } = await chrome.storage.local.get('processingState');

  if (processingState && processingState.isProcessing) {
    showProcessingView();
  }
}

// Update subscription UI
function updateSubscriptionUI() {
  if (!state.subscription) return;

  const { tier, features } = state.subscription;

  // Update tier badge (with safety check)
  if (tier && elements.tierBadge) {
    elements.tierBadge.textContent = tier.toUpperCase();
    elements.tierBadge.className = `tier-badge tier-${tier}`;
  }

  // Show/hide usage stats for free tier
  if (tier === 'free' && elements.usageStats) {
    elements.usageStats.classList.remove('hidden');
  } else if (elements.usageStats) {
    elements.usageStats.classList.add('hidden');
  }
}

// Update stats UI
function updateStatsUI() {
  if (!state.user) return;

  elements.dailyUsage.textContent = state.user.dailyUsage || 0;
  elements.dailyLimit.textContent = state.user.dailyLimit || 20;
  elements.totalProcessed.textContent = `${state.user.totalProcessed || 0} videos processed`;

  // Update progress bar
  const percentage = ((state.user.dailyUsage || 0) / (state.user.dailyLimit || 20)) * 100;
  elements.usageProgress.style.width = `${Math.min(percentage, 100)}%`;
}

// Show/hide panels
function showAuthPanel() {
  elements.authPanel.classList.remove('hidden');
  elements.mainInterface.classList.add('hidden');
  elements.processingView.classList.add('hidden');
}

function showMainInterface() {
  elements.authPanel.classList.add('hidden');
  elements.mainInterface.classList.remove('hidden');
  elements.processingView.classList.add('hidden');
}

function showProcessingView() {
  elements.authPanel.classList.add('hidden');
  elements.mainInterface.classList.add('hidden');
  elements.processingView.classList.remove('hidden');
}

// Show upgrade modal
function showUpgradeModal() {
  elements.subscriptionModal.classList.remove('hidden');
}

// Show settings modal
function showSettingsModal() {
  elements.settingsModal.classList.remove('hidden');
  loadSettings();
}

// Load settings
async function loadSettings() {
  const settings = await chrome.storage.local.get(['preferences', 'userId', 'tier', 'installed']);

  if (settings.preferences) {
    document.getElementById('segmentDuration').value = settings.preferences.segmentDuration || 45;
    document.getElementById('concurrentProcesses').value =
      settings.preferences.concurrentProcesses || 1;
    document.getElementById('autoOpenNotebook').checked =
      settings.preferences.autoOpenNotebook || false;
    document.getElementById('autoAudioOverview').checked =
      settings.preferences.autoAudioOverview || false;
  }

  document.getElementById('settingsEmail').textContent = state.userEmail || '-';
  document.getElementById('settingsTier').textContent = settings.tier || 'free';

  if (settings.installed) {
    const date = new Date(settings.installed);
    document.getElementById('settingsMemberSince').textContent = date.toLocaleDateString();
  }
}

// Save settings
async function saveSettings() {
  const preferences = {
    segmentDuration: parseInt(document.getElementById('segmentDuration').value),
    concurrentProcesses: parseInt(document.getElementById('concurrentProcesses').value),
    autoOpenNotebook: document.getElementById('autoOpenNotebook').checked,
    autoAudioOverview: document.getElementById('autoAudioOverview').checked,
  };

  await chrome.storage.local.set({ preferences });
  showSuccess('Settings saved!');
}

// Event listeners setup
function setupEventListeners() {
  // Authentication
  elements.authBtn.addEventListener('click', async () => {
    try {
      // Disable button to prevent double clicks
      elements.authBtn.disabled = true;
      elements.authBtn.style.opacity = '0.7';
      const originalText = elements.authBtn.innerHTML;
      elements.authBtn.innerHTML =
        '<div class="spinner" style="width:20px;height:20px;border-width:2px;margin:0"></div>';

      const response = await chrome.runtime.sendMessage({
        type: 'YOUTUBE_AUTHENTICATE',
      });

      if (response.success) {
        await loadUserData();
        await loadPlaylists();
        showMainInterface();
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth failed:', error);

      if (error.message.includes('User did not approve') || error.message.includes('closed')) {
        // User cancelled, just reset button
      } else {
        showError('Authentication failed. Please try again.');
      }
    } finally {
      // Reset button
      elements.authBtn.disabled = false;
      elements.authBtn.style.opacity = '1';
      elements.authBtn.innerHTML = `
          <svg class="google-logo" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          <span>Sign in with Google</span>
      `;
    }
  });

  // ... other Listeners ...

  // Playlist selection
  elements.sourcePlaylist.addEventListener('change', (e) => {
    const playlistId = e.target.value;
    if (playlistId) {
      state.selectedPlaylist = playlistId;
      loadPlaylistVideos(playlistId);
    }
  });

  // ... (keeping other listeners essentially the same if they are correct) ...

  // Refresh playlists
  elements.refreshPlaylists.addEventListener('click', loadPlaylists);

  // Create playlist
  elements.createPlaylist.addEventListener('click', async () => {
    const title = prompt('Enter playlist name:');
    if (title) {
      try {
        const response = await chrome.runtime.sendMessage({
          type: 'YOUTUBE_CREATE_PLAYLIST',
          data: { title, description: 'Created by AI Video Intelligence Suite' },
        });

        if (response.success) {
          showSuccess('Playlist created!');
          await loadPlaylists();
        }
      } catch (error) {
        showError('Failed to create playlist');
      }
    }
  });

  // Filters
  elements.searchFilter.addEventListener(
    'input',
    debounce(() => {
      applyFilters();
      renderVideoList();
    }, 300)
  );

  elements.clearFilter.addEventListener('click', () => {
    elements.searchFilter.value = '';
    elements.filterWatched.checked = false;
    elements.filterDuplicates.checked = false;
    elements.filterShort.checked = false;
    applyFilters();
    renderVideoList();
  });

  [elements.filterWatched, elements.filterDuplicates, elements.filterShort].forEach((filter) => {
    filter.addEventListener('change', () => {
      applyFilters();
      renderVideoList();
    });
  });

  // Selection
  elements.selectAll.addEventListener('click', () => {
    state.filteredVideos.forEach((video) => state.selectedVideos.add(video.id));
    renderVideoList();
  });

  elements.deselectAll.addEventListener('click', () => {
    state.selectedVideos.clear();
    renderVideoList();
  });

  // Actions
  elements.processBtn.addEventListener('click', startProcessing);

  elements.bulkImportBtn.addEventListener('click', () => {
    // TODO: Implement NotebookLM bulk import
    showInfo('NotebookLM integration coming soon!');
  });

  elements.exportQueueBtn.addEventListener('click', exportQueue);

  // Processing controls
  elements.backToQueue.addEventListener('click', showMainInterface);

  elements.pauseBtn.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'AUTOMATION_PAUSE' });
    elements.pauseBtn.classList.add('hidden');
    elements.resumeBtn.classList.remove('hidden');
  });

  elements.resumeBtn.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'AUTOMATION_RESUME' });
    elements.resumeBtn.classList.add('hidden');
    elements.pauseBtn.classList.remove('hidden');
  });

  elements.stopBtn.addEventListener('click', async () => {
    if (confirm('Are you sure you want to stop processing?')) {
      await chrome.runtime.sendMessage({ type: 'AUTOMATION_STOP' });
      showMainInterface();
    }
  });

  elements.clearLogs.addEventListener('click', () => {
    elements.processLogs.innerHTML = '';
  });

  // Settings
  elements.settingsBtn.addEventListener('click', showSettingsModal);

  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await chrome.runtime.sendMessage({ type: 'YOUTUBE_SIGN_OUT' });
      state.authenticated = false;

      // Close modal
      elements.settingsModal.classList.add('hidden');

      // Reset state
      state.playlists = [];
      state.user = null;

      showAuthPanel();
    }
  });

  // Modal close buttons
  document.querySelectorAll('.modal-close').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const modalId = e.target.dataset.modal;
      document.getElementById(modalId).classList.add('hidden');
    });
  });

  // Modal overlays
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      e.target.closest('.modal').classList.add('hidden');
    });
  });

  // Upgrade buttons
  document.querySelectorAll('[data-tier]').forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      const tier = e.target.dataset.tier;
      await chrome.runtime.sendMessage({
        type: 'SUBSCRIPTION_UPGRADE',
        data: { tier },
      });
    });
  });

  elements.upgradePrompt?.addEventListener('click', showUpgradeModal);
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'PROGRESS_UPDATE') {
    updateProcessingProgress(message.data);
  }
  sendResponse({ received: true });
});

// Update processing progress
function updateProcessingProgress(data) {
  if (!data) return;

  elements.processedCount.textContent = data.processedCount || 0;
  elements.totalCount.textContent = data.totalCount || 0;

  const percentage = ((data.processedCount || 0) / (data.totalCount || 1)) * 100;
  elements.processProgress.style.width = `${percentage}%`;
  elements.progressPercent.textContent = `${Math.round(percentage)}%`;

  if (data.currentVideo) {
    elements.currentVideoTitle.textContent = data.currentVideo.title;
    elements.currentVideoStatus.textContent = data.status || 'Processing...';
    if (data.currentVideo.thumbnail) {
      elements.currentVideoThumb.src = data.currentVideo.thumbnail;
    }
  }

  if (data.log) {
    addLog(data.log);
  }
}

// Add log entry
function addLog(message, type = 'info') {
  const timestamp = new Date().toLocaleTimeString();
  const logEntry = document.createElement('div');
  logEntry.className = `log-entry log-${type}`;
  logEntry.textContent = `[${timestamp}] ${message}`;
  elements.processLogs.appendChild(logEntry);
  elements.processLogs.scrollTop = elements.processLogs.scrollHeight;
}

// Export queue
async function exportQueue() {
  const selectedVideos = state.filteredVideos.filter((v) => state.selectedVideos.has(v.id));
  const data = JSON.stringify(selectedVideos, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `queue_${Date.now()}.json`;
  a.click();

  URL.revokeObjectURL(url);
}

// Utility functions
function showLoading(element, message = 'Loading...') {
  element.innerHTML = `<div class="loading-state"><div class="spinner"></div><p>${message}</p></div>`;
}

function showError(message) {
  // TODO: Implement toast notifications
  alert(message);
}

function showSuccess(message) {
  // TODO: Implement toast notifications
  console.log('✅', message);
}

function showInfo(message) {
  // TODO: Implement toast notifications
  alert(message);
}

function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function formatNumber(num) {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num;
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

async function trackEvent(event, properties) {
  await chrome.runtime.sendMessage({
    type: 'ANALYTICS_TRACK',
    data: { event, properties },
  });
}

// Initialize on load
document.addEventListener('DOMContentLoaded', init);

console.log('✅ Popup script loaded');
