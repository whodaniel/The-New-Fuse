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
  reports: [],
  activeTab: 'queueTab',
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

  // Single video input
  singleVideoUrl: document.getElementById('singleVideoUrl'),
  addSingleVideoBtn: document.getElementById('addSingleVideoBtn'),
  singleVideoPreview: document.getElementById('singleVideoPreview'),
  previewThumb: document.getElementById('previewThumb'),
  previewTitle: document.getElementById('previewTitle'),
  previewChannel: document.getElementById('previewChannel'),
  processNowBtn: document.getElementById('processNowBtn'),

  // Playlists
  sourcePlaylist: document.getElementById('sourcePlaylist'),
  destPlaylist: document.getElementById('destPlaylist'),
  refreshPlaylists: document.getElementById('refreshPlaylists'),
  createPlaylist: document.getElementById('createPlaylist'),
  playlistVideoCount: document.getElementById('playlistVideoCount'),

  // Processing level
  processingLevel: document.getElementById('processingLevel'),
  processingDescription: document.getElementById('processingDescription'),

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

  // History elements
  historyTab: document.getElementById('historyTab'),
  queueTab: document.getElementById('queueTab'),
  historyList: document.getElementById('historyList'),
  historyEmpty: document.getElementById('historyEmpty'),
  refreshHistory: document.getElementById('refreshHistory'),
  exportAllReportsBtn: document.getElementById('exportAllReportsBtn'),
  tabBtns: document.querySelectorAll('.tab-btn:not(.dashboard-link)'),
};

// Initialize popup
async function init() {
  console.log('Initializing popup...');

  try {
    // Check authentication
    const isAuth = await checkAuthentication();

    if (isAuth) {
      await loadUserData();

      // Check if there's an active processing queue
      const { processingState } = await chrome.storage.local.get('processingState');

      // Only show processing view if actively processing AND not completed
      // Also check if processing state is recent (within last hour) to avoid stale states
      const oneHourAgo = Date.now() - 60 * 60 * 1000;
      const isRecentProcessing =
        processingState && processingState.lastUpdated && processingState.lastUpdated > oneHourAgo;
      const isActivelyProcessing =
        processingState &&
        processingState.isProcessing &&
        processingState.currentIndex < processingState.totalCount &&
        isRecentProcessing;

      if (isActivelyProcessing) {
        // Show processing view by default when actively processing
        console.log('Showing processing view - active processing detected');
        showProcessingView();
      } else {
        // Show main interface for queue selection (default)
        console.log('Showing main interface - default view');
        // Clear stale processing state
        if (processingState && processingState.isProcessing) {
          await chrome.storage.local.set({
            processingState: {
              isProcessing: false,
              isPaused: false,
              currentIndex: 0,
              totalCount: 0,
              currentVideo: null,
            },
          });
        }
        await loadPlaylists();
        showMainInterface();
      }
    } else {
      showAuthPanel();
    }

    // Update sign out button visibility
    updateSignOutButtonVisibility(isAuth);

    // Set up event listeners
    setupEventListeners();

    // Load initial reports to show status indicators
    await loadReports();

    // Load processing state if active (for updates)
    await checkProcessingState();

    console.log('✅ Popup initialized');
  } catch (error) {
    console.error('Failed to initialize popup:', error);
    showError('Failed to initialize. Please refresh.');
  }
}

// Update sign out button visibility based on auth status
function updateSignOutButtonVisibility(isAuthenticated) {
  const signOutBtn = document.getElementById('signOutBtn');
  const settingsEmail = document.getElementById('settingsEmail');

  if (signOutBtn) {
    if (isAuthenticated) {
      signOutBtn.classList.remove('hidden');
      signOutBtn.style.display = 'inline-block';
    } else {
      signOutBtn.classList.add('hidden');
      signOutBtn.style.display = 'none';
    }
  }

  // Also update settings email display
  if (settingsEmail) {
    if (isAuthenticated && state.userEmail) {
      settingsEmail.textContent = state.userEmail;
    } else {
      settingsEmail.textContent = 'Not signed in';
    }
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
    // Get user profile to check email
    const { userProfile } = await chrome.storage.local.get('userProfile');
    if (userProfile && userProfile.email) {
      state.userEmail = userProfile.email;
    }

    // Get subscription status
    const subResponse = await chrome.runtime.sendMessage({
      type: 'SUBSCRIPTION_CHECK',
    });

    if (subResponse.success && subResponse.data) {
      // Backend returns { subscription: { tier, ... }, features: { dailyLimit, ... } }
      // Normalize to a flat structure for easier access
      const subscriptionData = subResponse.data.subscription || {};
      const featuresData = subResponse.data.features || {};

      state.subscription = {
        tier: subscriptionData.tier || 'free',
        features: featuresData,
        ...subscriptionData,
      };

      console.log('📊 Subscription status:', state.subscription.tier, 'Features:', featuresData);

      // Update user limits from subscription if available (backend source of truth)
      if (featuresData) {
        state.user = {
          ...state.user,
          dailyUsage: featuresData.dailyUsage,
          dailyLimit: featuresData.dailyLimit,
        };
        // Also save to local storage for persistence
        await chrome.storage.local.set({
          dailyUsage: featuresData.dailyUsage,
          dailyLimit: featuresData.dailyLimit,
          tier: state.subscription.tier,
        });
      }

      updateSubscriptionUI();
    }

    // Get user stats (from updated local storage)
    const stats = await chrome.storage.local.get([
      'dailyUsage',
      'dailyLimit',
      'totalProcessed',
      'userId',
    ]);

    // Merge stats, but don't overwrite if we just got fresh data from API
    state.user = { ...stats, ...state.user };
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

  // Set up processing level descriptions
  const processingDescriptions = {
    transcript:
      'Extract YouTube captions only. FREE, instant results. Best for quick text search and basic summaries.',
    flash:
      'Analyze transcript with Gemini Flash. ~$0.0008/video. Good balance of speed, cost, and quality.',
    pro: 'Deep analysis with Gemini Pro. ~$0.01/video. Detailed insights, technical breakdowns, and research connections.',
    ai_studio:
      'Full video analysis using your Google AI Studio account. Best quality, uses segments for long videos.',
  };

  // Filter processing options by tier
  const processingLevelSelect = document.getElementById('processingLevel');
  const processingDescription = document.getElementById('processingDescription');

  if (processingLevelSelect && processingDescription && state.subscription) {
    const tier = state.subscription.tier || 'free';

    // Define which options are available per tier
    const tierOptions = {
      free: ['transcript', 'ai_studio'], // Free users: transcript only or use their own Gemini account
      pro: ['transcript', 'flash', 'pro', 'ai_studio'], // Pro: all options
      tnf: ['transcript', 'flash', 'pro', 'ai_studio'], // TNF: all options
    };

    const availableOptions = tierOptions[tier] || tierOptions.free;

    // Remove unavailable options
    Array.from(processingLevelSelect.options).forEach((option) => {
      if (!availableOptions.includes(option.value)) {
        option.disabled = true;
        option.textContent += ' (Pro/TNF only)';
      }
    });

    // Update description when processing level changes
    processingLevelSelect.addEventListener('change', (e) => {
      const level = e.target.value;
      processingDescription.textContent = processingDescriptions[level];
    });
  }
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
        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
          <h4 class="video-title">${escapeHtml(video.title)}</h4>
          ${isVideoProcessed(video.id) ? '<span class="status-badge status-processed">Analyzed</span>' : ''}
        </div>
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

// Update subscription UI
function updateSubscriptionUI() {
  if (!state.subscription) return;

  const { tier, features } = state.subscription;
  const effectiveTier = tier || 'free';

  // Update tier badge (with safety check)
  if (elements.tierBadge) {
    elements.tierBadge.textContent = effectiveTier.toUpperCase();
    elements.tierBadge.className = `tier-badge tier-${effectiveTier}`;
  }

  // Show/hide usage stats and upgrade prompt based on tier
  const usageStats = document.getElementById('usageStats');
  const upgradePrompt = document.getElementById('upgradePrompt');

  if (effectiveTier === 'free') {
    if (usageStats) usageStats.classList.remove('hidden');
    if (upgradePrompt) upgradePrompt.classList.remove('hidden');
  } else {
    // Pro/TNF users - hide usage stats and upgrade button
    if (usageStats) usageStats.classList.add('hidden');
    if (upgradePrompt) upgradePrompt.classList.add('hidden');
  }

  // Also update settings modal tier display
  const settingsTier = document.getElementById('settingsTier');
  if (settingsTier) {
    settingsTier.textContent = effectiveTier.toUpperCase();
  }
}

// Update stats UI
function updateStatsUI() {
  if (!state.user) return;

  const usage = state.user.dailyUsage !== undefined ? state.user.dailyUsage : 0;
  let limit = state.user.dailyLimit;

  // Handle Infinity or missing limit
  if (limit === null || limit === undefined) limit = 20;

  elements.dailyUsage.textContent = usage;
  elements.dailyLimit.textContent = limit === Infinity || limit >= 1000000 ? '∞' : limit;
  elements.totalProcessed.textContent = `${state.user.totalProcessed || 0} videos processed`;

  // Update progress bar
  let percentage = 0;
  if (limit === Infinity || limit >= 1000000) {
    percentage = 0; // Infinite limit means validly 0 usage relative to capacity
  } else {
    percentage = (usage / limit) * 100;
  }
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
  const settings = await chrome.storage.local.get(['preferences', 'userProfile']);

  if (settings.preferences) {
    document.getElementById('segmentDuration').value = settings.preferences.segmentDuration || 45;
    document.getElementById('concurrentProcesses').value =
      settings.preferences.concurrentProcesses || 1;
    document.getElementById('autoOpenNotebook').checked =
      settings.preferences.autoOpenNotebook || false;
    document.getElementById('autoAudioOverview').checked =
      settings.preferences.autoAudioOverview || false;
  }

  if (settings.userProfile) {
    document.getElementById('settingsEmail').textContent = settings.userProfile.email || '-';
    document.getElementById('settingsTier').textContent =
      state.subscription?.tier?.toUpperCase() || 'FREE';
    document.getElementById('settingsMemberSince').textContent =
      new Date(settings.userProfile.created_at).toLocaleDateString() || '-';
  }
}

// Check processing state for updates
async function checkProcessingState() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'STORAGE_GET',
      data: { keys: ['processingState'] },
    });

    if (response.success && response.data.processingState) {
      const processingState = response.data.processingState;

      if (processingState.isProcessing) {
        updateProcessingUI(processingState);

        // If we're showing main interface but processing is active, switch to processing view
        if (!elements.processingView.classList.contains('hidden') === false) {
          showProcessingView();
        }
      }
    }
  } catch (error) {
    console.log('No active processing');
  }
}

// Update processing UI
function updateProcessingUI(processingState) {
  const { currentIndex, totalCount, currentVideo } = processingState;

  elements.processedCount.textContent = currentIndex || 0;
  elements.totalCount.textContent = totalCount || 0;

  const percentage = totalCount > 0 ? (currentIndex / totalCount) * 100 : 0;
  elements.processProgress.style.width = `${percentage}%`;
  elements.progressPercent.textContent = `${Math.round(percentage)}%`;

  if (currentVideo) {
    elements.currentVideoThumb.src = currentVideo.thumbnail || '';
    elements.currentVideoTitle.textContent = currentVideo.title || 'Unknown';
    elements.currentVideoStatus.textContent = `Processing... (${currentIndex + 1}/${totalCount})`;
  }
}

// Set up event listeners
function setupEventListeners() {
  // Auth
  elements.authBtn?.addEventListener('click', async () => {
    try {
      elements.authBtn.disabled = true;
      elements.authBtn.innerHTML = '<span class="spinner"></span> Signing in...';

      const response = await chrome.runtime.sendMessage({
        type: 'YOUTUBE_AUTHENTICATE',
      });

      if (response.success) {
        state.authenticated = true;
        await loadUserData();
        await loadPlaylists();
        showMainInterface();
        updateSignOutButtonVisibility(true);
      } else {
        throw new Error(response.error || 'Authentication failed');
      }
    } catch (error) {
      console.error('Auth failed:', error);
      showError('Authentication failed. Please try again.');
    } finally {
      elements.authBtn.disabled = false;
      elements.authBtn.innerHTML = `
        <svg class="google-logo" viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
        </svg>
        Sign in with Google
      `;
    }
  });

  // Playlist selection
  elements.sourcePlaylist?.addEventListener('change', async (e) => {
    const playlistId = e.target.value;
    if (playlistId) {
      state.selectedPlaylist = playlistId;
      state.selectedVideos.clear();
      updateSelectionUI();
      await loadPlaylistVideos(playlistId);
    }
  });

  elements.refreshPlaylists?.addEventListener('click', async () => {
    elements.refreshPlaylists.classList.add('spinning');
    await loadPlaylists();
    setTimeout(() => {
      elements.refreshPlaylists.classList.remove('spinning');
    }, 1000);
  });

  elements.createPlaylist?.addEventListener('click', async () => {
    const title = prompt('Enter playlist name:');
    if (title) {
      try {
        // Show creating feedback
        elements.createPlaylist.disabled = true;
        elements.createPlaylist.textContent = 'Creating...';

        const response = await chrome.runtime.sendMessage({
          type: 'YOUTUBE_CREATE_PLAYLIST',
          data: { title, description: 'Created by AI Video Intelligence' },
        });

        if (response.success && response.data && response.data.id) {
          console.log('Playlist created:', response.data);
          showError(`Playlist "${title}" created successfully!`);

          // Small delay to ensure YouTube API has registered the playlist
          await new Promise((r) => setTimeout(r, 1000));

          // Refresh playlists and select the new one
          await loadPlaylists();

          // Set the newly created playlist as selected destination
          if (elements.destPlaylist) {
            elements.destPlaylist.value = response.data.id;
          }
        } else {
          throw new Error(response.error || 'Unknown error creating playlist');
        }
      } catch (error) {
        console.error('Failed to create playlist:', error);
        showError('Failed to create playlist: ' + (error.message || 'Unknown error'));
      } finally {
        // Reset button state
        elements.createPlaylist.disabled = false;
        elements.createPlaylist.textContent = '+';
      }
    }
  });

  // Filters
  elements.searchFilter?.addEventListener('input', () => {
    applyFilters();
    renderVideoList();
  });

  elements.clearFilter?.addEventListener('click', () => {
    elements.searchFilter.value = '';
    elements.filterWatched.checked = false;
    elements.filterDuplicates.checked = false;
    elements.filterShort.checked = false;
    applyFilters();
    renderVideoList();
  });

  elements.filterWatched?.addEventListener('change', () => {
    applyFilters();
    renderVideoList();
  });

  elements.filterDuplicates?.addEventListener('change', () => {
    applyFilters();
    renderVideoList();
  });

  elements.filterShort?.addEventListener('change', () => {
    applyFilters();
    renderVideoList();
  });

  // Selection buttons
  elements.selectAll?.addEventListener('click', () => {
    state.filteredVideos.forEach((video) => {
      state.selectedVideos.add(video.id);
    });
    renderVideoList();
    updateSelectionUI();
  });

  elements.deselectAll?.addEventListener('click', () => {
    state.selectedVideos.clear();
    renderVideoList();
    updateSelectionUI();
  });

  // Actions
  elements.processBtn?.addEventListener('click', startProcessing);
  elements.bulkImportBtn?.addEventListener('click', bulkImportToNotebookLM);
  elements.exportQueueBtn?.addEventListener('click', exportQueue);

  // Processing view
  elements.backToQueue?.addEventListener('click', () => {
    showMainInterface();
  });

  elements.pauseBtn?.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'AUTOMATION_PAUSE' });
    elements.pauseBtn.classList.add('hidden');
    elements.resumeBtn.classList.remove('hidden');
  });

  elements.resumeBtn?.addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'AUTOMATION_RESUME' });
    elements.resumeBtn.classList.add('hidden');
    elements.pauseBtn.classList.remove('hidden');
  });

  elements.stopBtn?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to stop processing?')) {
      await chrome.runtime.sendMessage({ type: 'AUTOMATION_STOP' });
      showMainInterface();
    }
  });

  elements.clearLogs?.addEventListener('click', () => {
    elements.processLogs.innerHTML = '';
  });

  // Settings
  elements.settingsBtn?.addEventListener('click', showSettingsModal);

  document.getElementById('signOutBtn')?.addEventListener('click', async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await chrome.runtime.sendMessage({ type: 'YOUTUBE_SIGN_OUT' });
      state.authenticated = false;
      state.userEmail = null;

      // Close modal
      elements.settingsModal.classList.add('hidden');

      // Reset state
      state.playlists = [];
      state.user = null;
      state.subscription = null;

      // Update UI
      updateSignOutButtonVisibility(false);
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

  // Settings save
  document.getElementById('clearCacheBtn')?.addEventListener('click', async () => {
    await chrome.storage.local.remove(['queue', 'processingState']);
    showError('Cache cleared successfully');
  });

  document.getElementById('exportDataBtn')?.addEventListener('click', exportAllData);

  // Single video URL input
  elements.singleVideoUrl?.addEventListener('input', debounce(handleSingleVideoUrlInput, 500));
  elements.singleVideoUrl?.addEventListener('paste', () => {
    // Handle paste event immediately
    setTimeout(() => handleSingleVideoUrlInput(), 100);
  });

  elements.addSingleVideoBtn?.addEventListener('click', addSingleVideoToQueue);
  elements.processNowBtn?.addEventListener('click', processSingleVideoNow);

  // Tabs
  elements.tabBtns.forEach((btn) => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
  });

  elements.refreshHistory?.addEventListener('click', async () => {
    elements.refreshHistory.classList.add('spinning');
    await loadReports();
    elements.refreshHistory.classList.remove('spinning');
  });

  elements.exportAllReportsBtn?.addEventListener('click', exportAllReports);
}

// Tab Switching
function switchTab(tabId) {
  state.activeTab = tabId;

  // Update button states
  elements.tabBtns.forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.tab === tabId);
  });

  // Update content visibility
  elements.queueTab.classList.toggle('hidden', tabId !== 'queueTab');
  elements.historyTab.classList.toggle('hidden', tabId !== 'historyTab');

  if (tabId === 'historyTab') {
    renderHistoryList();
  }
}

// Check if video is processed
function isVideoProcessed(videoId) {
  return state.reports.some((r) => r.youtube_video_id === videoId);
}

// Load reports from backend
async function loadReports() {
  try {
    const response = await chrome.runtime.sendMessage({
      type: 'REPORTS_GET',
      data: { limit: 100 },
    });

    if (response.success && response.data) {
      state.reports = response.data.reports || [];
      renderHistoryList();
      // Also re-render video list if we're in the queue tab to show status badges
      if (state.activeTab === 'queueTab' && state.videos.length > 0) {
        renderVideoList();
      }
    }
  } catch (error) {
    console.error('Failed to load reports:', error);
  }
}

// Render history list
function renderHistoryList() {
  if (!elements.historyList) return;

  if (state.reports.length === 0) {
    elements.historyList.classList.add('hidden');
    elements.historyEmpty.classList.remove('hidden');
    return;
  }

  elements.historyList.classList.remove('hidden');
  elements.historyEmpty.classList.add('hidden');

  elements.historyList.innerHTML = state.reports
    .map(
      (report) => `
    <div class="history-item">
      <div class="history-thumb">
        <img src="https://i.ytimg.com/vi/${report.youtube_video_id}/mqdefault.jpg" alt="${report.video_title}">
      </div>
      <div class="history-info">
        <h4 class="history-title">${escapeHtml(report.video_title)}</h4>
        <div class="history-meta">
          <span class="history-date">${new Date(report.created_at).toLocaleDateString()}</span>
          <span class="report-badge">Report Available</span>
        </div>
      </div>
      <button class="btn btn-sm btn-ghost view-report-btn" data-report-id="${report.id}">View</button>
    </div>
  `
    )
    .join('');

  // Add handlers for view report
  elements.historyList.querySelectorAll('.view-report-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const reportId = e.target.dataset.reportId;
      window.open(`https://aivideointel.thenewfuse.com/reports/${reportId}`, '_blank');
    });
  });
}

// Export all reports as a combined file for NotebookLM
async function exportAllReports() {
  try {
    if (state.reports.length === 0) {
      showError('No reports to export');
      return;
    }

    elements.exportAllReportsBtn.disabled = true;
    elements.exportAllReportsBtn.textContent = 'Preparing export...';

    // Fetch full content for all reports if possible, or just build from what we have
    // For now, let's just create a combined markdown file with titles and links
    // A better way would be to fetch all report contents, but that might be heavy

    let combinedMD = '# AI Video Analysis Reports\n\n';
    combinedMD += `Generated on: ${new Date().toLocaleString()}\n\n`;
    combinedMD += `---\n\n`;

    state.reports.forEach((report) => {
      combinedMD += `## ${report.video_title}\n`;
      combinedMD += `- Video ID: ${report.youtube_video_id}\n`;
      combinedMD += `- Analysed: ${new Date(report.created_at).toLocaleString()}\n`;
      combinedMD += `- [View Full Report](https://aivideointel.thenewfuse.com/reports/${report.id})\n\n`;
      // If we had the content_markdown in the summary, we'd add it here
      if (report.content_markdown) {
        combinedMD += report.content_markdown + '\n\n';
      }
      combinedMD += `---\n\n`;
    });

    const dataBlob = new Blob([combinedMD], { type: 'text/markdown' });
    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aivideointel-reports-${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showError('Reports exported! You can now upload this file to NotebookLM.');
  } catch (error) {
    console.error('Export failed:', error);
    showError('Failed to export reports');
  } finally {
    elements.exportAllReportsBtn.disabled = false;
    elements.exportAllReportsBtn.textContent = 'Download All Reports (MD)';
  }
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

    // Get processing level
    const processingLevel = document.getElementById('processingLevel')?.value || 'ai_studio';

    // Get preferences
    const { preferences } = await chrome.storage.local.get('preferences');

    // Start automation
    showProcessingView();

    const response = await chrome.runtime.sendMessage({
      type: 'AUTOMATION_START',
      data: {
        queue: selectedVideoData,
        processingLevel: processingLevel,
        segmentDuration: preferences?.segmentDuration || 45,
        concurrentProcesses: preferences?.concurrentProcesses || 1,
      },
    });

    if (response.success) {
      console.log('Automation started');
    } else {
      throw new Error(response.error || 'Failed to start automation');
    }
  } catch (error) {
    console.error('Failed to start processing:', error);
    showError('Failed to start processing. Please try again.');
    showMainInterface();
  }
}

// Bulk import to NotebookLM
async function bulkImportToNotebookLM() {
  try {
    const selectedVideoData = state.filteredVideos.filter((v) => state.selectedVideos.has(v.id));

    if (selectedVideoData.length === 0) {
      showError('Please select videos to import');
      return;
    }

    // Open NotebookLM with selected videos
    const videoUrls = selectedVideoData.map((v) => v.url).join('\n');

    // Copy to clipboard
    await navigator.clipboard.writeText(videoUrls);

    // Open NotebookLM
    chrome.tabs.create({
      url: 'https://notebooklm.google.com',
      active: true,
    });

    showError(
      `${selectedVideoData.length} video URLs copied to clipboard. Paste them into NotebookLM. Tip: Use the 'History' tab to download full text reports!`
    );
  } catch (error) {
    console.error('Failed to import to NotebookLM:', error);
    showError('Failed to import. Please try again.');
  }
}

// Export queue
async function exportQueue() {
  try {
    const { queue } = await chrome.storage.local.get('queue');

    if (!queue || queue.length === 0) {
      showError('Queue is empty');
      return;
    }

    const dataStr = JSON.stringify(queue, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `video-queue-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export queue:', error);
    showError('Failed to export queue');
  }
}

// Export all data
async function exportAllData() {
  try {
    const allData = await chrome.storage.local.get(null);
    const dataStr = JSON.stringify(allData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const url = URL.createObjectURL(dataBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aivi-data-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Failed to export data:', error);
    showError('Failed to export data');
  }
}

// Utility functions
function formatDuration(seconds) {
  if (!seconds) return '--:--';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

function formatNumber(num) {
  if (!num) return '0';
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
}

function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function showLoading(element, message = 'Loading...') {
  element.innerHTML = `
    <div class="loading-state">
      <div class="spinner"></div>
      <p>${message}</p>
    </div>
  `;
}

function showError(message) {
  // Simple error toast
  const toast = document.createElement('div');
  toast.className = 'toast toast-error';
  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.remove();
  }, 3000);
}

// Debounce utility
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

// Extract video ID from YouTube URL
function extractVideoId(url) {
  if (!url) return null;

  // Handle various YouTube URL formats
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/|youtube\.com\/shorts\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

// State for single video preview
let currentPreviewVideo = null;

// Handle single video URL input
async function handleSingleVideoUrlInput() {
  const url = elements.singleVideoUrl?.value?.trim();
  const videoId = extractVideoId(url);

  if (!videoId) {
    // Hide preview if no valid video ID
    elements.singleVideoPreview?.classList.add('hidden');
    currentPreviewVideo = null;
    return;
  }

  try {
    // Fetch video details
    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_GET_VIDEO_DETAILS',
      data: { videoIds: [videoId] },
    });

    if (response.success && response.data && response.data.length > 0) {
      const video = response.data[0];

      // Store preview video for later use
      currentPreviewVideo = {
        id: videoId,
        title: video.channelTitle ? `Video from ${video.channelTitle}` : 'YouTube Video',
        channelTitle: video.channelTitle || 'Unknown Channel',
        thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        duration: video.duration,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        url: `https://www.youtube.com/watch?v=${videoId}`,
      };

      // We need to get the title from a different API call or use a placeholder
      // For now, fetch snippet data
      await fetchVideoSnippet(videoId);

      // Show preview
      updateVideoPreview();
    } else {
      // Video not found or error
      elements.singleVideoPreview?.classList.add('hidden');
      currentPreviewVideo = null;
    }
  } catch (error) {
    console.error('Failed to fetch video details:', error);
    elements.singleVideoPreview?.classList.add('hidden');
    currentPreviewVideo = null;
  }
}

// Fetch video snippet (title, description, etc.)
async function fetchVideoSnippet(videoId) {
  try {
    // Use the playlist video details endpoint which includes snippet
    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_GET_VIDEO_DETAILS',
      data: { videoIds: [videoId] },
    });

    if (response.success && response.data && response.data.length > 0) {
      const details = response.data[0];
      if (currentPreviewVideo) {
        currentPreviewVideo.channelTitle = details.channelTitle || currentPreviewVideo.channelTitle;
        currentPreviewVideo.duration = details.duration;
        currentPreviewVideo.viewCount = details.viewCount;
      }
    }
  } catch (error) {
    console.error('Failed to fetch video snippet:', error);
  }
}

// Update video preview UI
function updateVideoPreview() {
  if (!currentPreviewVideo) {
    elements.singleVideoPreview?.classList.add('hidden');
    return;
  }

  if (elements.previewThumb) {
    elements.previewThumb.src = currentPreviewVideo.thumbnail;
  }
  if (elements.previewTitle) {
    // Try to get title, fallback to video ID
    elements.previewTitle.textContent =
      currentPreviewVideo.title || `Video: ${currentPreviewVideo.id}`;
  }
  if (elements.previewChannel) {
    const duration = currentPreviewVideo.duration
      ? formatDuration(currentPreviewVideo.duration)
      : '';
    const views = currentPreviewVideo.viewCount
      ? formatNumber(currentPreviewVideo.viewCount) + ' views'
      : '';
    elements.previewChannel.textContent = [currentPreviewVideo.channelTitle, duration, views]
      .filter(Boolean)
      .join(' • ');
  }

  elements.singleVideoPreview?.classList.remove('hidden');
}

// Add single video to queue
async function addSingleVideoToQueue() {
  if (!currentPreviewVideo) {
    showError('Please enter a valid YouTube URL first');
    return;
  }

  try {
    elements.addSingleVideoBtn.disabled = true;
    elements.addSingleVideoBtn.textContent = 'Adding...';

    // Add to queue
    await chrome.runtime.sendMessage({
      type: 'QUEUE_ADD',
      data: { videos: [currentPreviewVideo] },
    });

    showError(`Added "${currentPreviewVideo.title || currentPreviewVideo.id}" to queue`);

    // Clear input and preview
    if (elements.singleVideoUrl) {
      elements.singleVideoUrl.value = '';
    }
    elements.singleVideoPreview?.classList.add('hidden');
    currentPreviewVideo = null;
  } catch (error) {
    console.error('Failed to add video to queue:', error);
    showError('Failed to add video: ' + (error.message || 'Unknown error'));
  } finally {
    elements.addSingleVideoBtn.disabled = false;
    elements.addSingleVideoBtn.textContent = 'Add';
  }
}

// Process single video immediately
async function processSingleVideoNow() {
  if (!currentPreviewVideo) {
    showError('Please enter a valid YouTube URL first');
    return;
  }

  try {
    // Check subscription limits
    const canProcess = await chrome.runtime.sendMessage({
      type: 'SUBSCRIPTION_CAN_PROCESS',
    });

    if (!canProcess.success || !canProcess.data) {
      showUpgradeModal();
      return;
    }

    elements.processNowBtn.disabled = true;
    elements.processNowBtn.textContent = 'Starting...';

    const videoToProcess = { ...currentPreviewVideo };

    // Add to queue first
    await chrome.runtime.sendMessage({
      type: 'QUEUE_ADD',
      data: { videos: [videoToProcess] },
    });

    // Get processing level
    const processingLevel = document.getElementById('processingLevel')?.value || 'ai_studio';

    // Get preferences
    const { preferences } = await chrome.storage.local.get('preferences');

    // Start automation
    showProcessingView();

    const response = await chrome.runtime.sendMessage({
      type: 'AUTOMATION_START',
      data: {
        queue: [videoToProcess],
        processingLevel: processingLevel,
        segmentDuration: preferences?.segmentDuration || 45,
        concurrentProcesses: preferences?.concurrentProcesses || 1,
      },
    });

    if (response.success) {
      console.log('Single video processing started');

      // Clear input and preview
      if (elements.singleVideoUrl) {
        elements.singleVideoUrl.value = '';
      }
      elements.singleVideoPreview?.classList.add('hidden');
      currentPreviewVideo = null;
    } else {
      throw new Error(response.error || 'Failed to start processing');
    }
  } catch (error) {
    console.error('Failed to process video:', error);
    showError('Failed to process video: ' + (error.message || 'Unknown error'));
    showMainInterface();
  } finally {
    elements.processNowBtn.disabled = false;
    elements.processNowBtn.textContent = 'Process Now';
  }
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message) => {
  switch (message.type) {
    case 'PROGRESS_UPDATE':
      updateProcessingUI({
        currentIndex: message.current - 1,
        totalCount: message.total,
        currentVideo: message.data?.currentVideo,
      });
      break;

    case 'LOG':
      if (elements.processLogs) {
        const logEntry = document.createElement('div');
        logEntry.className = 'log-entry';
        logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message.message}`;
        elements.processLogs.appendChild(logEntry);
        elements.processLogs.scrollTop = elements.processLogs.scrollHeight;
      }
      break;

    case 'AUTOMATION_COMPLETE':
      showMainInterface();
      showError('Processing complete!');
      break;

    case 'AUTOMATION_ERROR':
      showError(message.error || 'Automation error occurred');
      break;
  }
});

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init);

console.log('✅ Popup script loaded');
