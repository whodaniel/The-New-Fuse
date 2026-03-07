// Background Service Worker
// Simplified version without ES6 imports for Chrome Extension compatibility

console.log('🚀 AI Video Intelligence Suite - Background Service Worker Starting...');

// Initialize extension on install
chrome.runtime.onInstalled.addListener(async (details) => {
  console.log('Extension installed/updated:', details.reason);

  if (details.reason === 'install') {
    // First time installation
    await initializeExtension();
    console.log('✅ Extension installed and initialized');
  } else if (details.reason === 'update') {
    // Extension updated
    const manifest = chrome.runtime.getManifest();
    console.log(`Updated to version ${manifest.version}`);
  }
});

// Initialize extension settings
async function initializeExtension() {
  const defaults = {
    // User settings
    installed: Date.now(),
    tier: 'free',
    userId: generateUserId(),

    // Usage tracking
    dailyUsage: 0,
    dailyLimit: 20,
    lastResetDate: new Date().toDateString(),
    totalProcessed: 0,

    // Feature flags
    features: {
      youtubeIntegration: true,
      aiStudioAutomation: true,
      notebooklmIntegration: false, // Pro feature
      podcastCreation: false, // Pro feature
      cloudSync: false, // Pro feature
      customPrompts: false, // Pro feature
      autoDownload: true,
      retryLogic: true,
    },

    // Preferences
    preferences: {
      autoOpenNotebook: false,
      autoAudioOverview: false,
      segmentDuration: 45, // minutes
      concurrentProcesses: 1,
      defaultPrompt: 'default',
      theme: 'auto',
    },

    // Queue state
    queue: [],
    processingState: {
      isProcessing: false,
      isPaused: false,
      currentIndex: 0,
      currentVideo: null,
    },
  };

  await chrome.storage.local.set(defaults);
  console.log('✅ Extension initialized with defaults');
}

// Generate unique user ID
function generateUserId() {
  return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
}

// Message handler - routes messages to appropriate handlers
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('📨 Message received:', message.type);

  handleMessage(message, sender)
    .then((response) => {
      sendResponse({ success: true, data: response });
    })
    .catch((error) => {
      console.error('❌ Message handler error:', error);
      sendResponse({ success: false, error: error.message });
    });

  return true; // Keep channel open for async response
});

// Main message router
async function handleMessage(message, sender) {
  const { type, data } = message;

  switch (type) {
    // Queue management
    case 'QUEUE_ADD':
      return await addToQueue(data.videos);

    case 'QUEUE_ADD_SINGLE':
      return await addToQueue([data.video]);

    case 'QUEUE_REMOVE':
      return await removeFromQueue(data.videoIds);

    case 'QUEUE_CLEAR':
      return await clearQueue();

    case 'QUEUE_GET':
      return await getQueue();

    // YouTube API
    case 'YOUTUBE_AUTHENTICATE':
      return await authenticateYouTube();

    case 'YOUTUBE_CHECK_AUTH':
      return await isYouTubeAuthenticated();

    case 'YOUTUBE_GET_PLAYLISTS':
      return await getYouTubePlaylists();

    case 'YOUTUBE_GET_PLAYLIST_VIDEOS':
      return await getPlaylistVideos(data.playlistId);

    case 'YOUTUBE_GET_VIDEO_DETAILS':
      return await getVideoDetails(data.videoIds);

    case 'YOUTUBE_CREATE_PLAYLIST':
      return await createPlaylist(data.title, data.description);

    case 'YOUTUBE_SIGN_OUT':
      return await signOutYouTube();

    // Subscription management
    case 'SUBSCRIPTION_CHECK':
      return await checkSubscription();

    case 'SUBSCRIPTION_CAN_PROCESS':
      return await canProcessVideo();

    // Storage operations
    case 'STORAGE_GET':
      return await chrome.storage.local.get(data.keys);

    case 'STORAGE_SET':
      return await chrome.storage.local.set(data.items);

    // Automation control
    case 'AUTOMATION_START':
      return await startAutomation(data);

    case 'AUTOMATION_PAUSE':
      return await pauseAutomation();

    case 'AUTOMATION_RESUME':
      return await resumeAutomation();

    case 'AUTOMATION_STOP':
      return await stopAutomation();

    // AI Studio communication
    case 'AI_STUDIO_READY':
      return { ready: true };

    case 'AI_STUDIO_PROGRESS':
      return await handleProgress(data);

    case 'AI_STUDIO_COMPLETE':
      return await handleComplete(data);

    case 'AI_STUDIO_ERROR':
      return await handleError(data);

    case 'ANALYTICS_TRACK':
      console.log('📊 Analytics:', data.event, data.properties);
      return { tracked: true };

    // Valid automation messages (Relay to popup)
    case 'LOG':
    case 'STATUS_UPDATE':
    case 'PROGRESS_UPDATE':
    case 'AUTOMATION_ERROR':
    case 'AUTOMATION_COMPLETE':
      // Update badge based on message type
      if (type === 'AUTOMATION_ERROR') {
        console.error('🚨 Automation Error:', message.error);
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Red for error
      } else if (type === 'PROGRESS_UPDATE' && message.current !== undefined) {
        chrome.action.setBadgeText({ text: `${message.current}/${message.total}` });
      } else if (type === 'LOG') {
        console.log('📝 Content Log:', message.message);
      }

      // forward to popup (ignore error if popup closed)
      chrome.runtime.sendMessage(message).catch(() => {});
      return { success: true };

    default:
      console.warn('⚠️ Unknown message type:', type);
      return { warning: `Unknown message type: ${type}` };
  }
}

// Queue management functions
import apiClient from './services/api-client.js';

// Replace local storage subscription checks with API calls
async function checkSubscription() {
  try {
    const response = await apiClient.getSubscriptionStatus();
    return response.data;
  } catch (error) {
    console.error('Failed to check subscription:', error);
    return { tier: 'free' };
  }
}

async function addToQueue(videos) {
  try {
    const response = await apiClient.addToQueue(videos);

    // Sync local queue for UI
    const { queue = [] } = await chrome.storage.local.get('queue');
    const updatedQueue = [...queue, ...videos];
    await chrome.storage.local.set({ queue: updatedQueue });

    console.log(
      `✅ Added ${videos.length} video(s) to queue via API. Total: ${updatedQueue.length}`
    );
    return updatedQueue;
  } catch (error) {
    if (error.message && error.message.includes('Daily quota exceeded')) {
      // Show upgrade prompt
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Daily Limit Reached',
        message: 'Upgrade to Pro for unlimited processing.',
      });
      // Return empty or error to stop processing logic
      throw error;
    }
    console.error('API Queue Error:', error);
    throw error;
  }
}

async function removeFromQueue(videoIds) {
  const { queue = [] } = await chrome.storage.local.get('queue');
  const updatedQueue = queue.filter((v) => !videoIds.includes(v.id));
  await chrome.storage.local.set({ queue: updatedQueue });
  return updatedQueue;
}

async function clearQueue() {
  await chrome.storage.local.set({ queue: [] });
  return [];
}

async function getQueue() {
  const { queue = [] } = await chrome.storage.local.get('queue');
  return queue;
}

// Automation control functions

// Main orchestrator - manages the entire automation flow
let automationRunning = false;
let automationPaused = false;
let pendingTaskResolve = null;

// Listen for task completion from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'TASK_COMPLETE' || message.type === 'TASK_ERROR') {
    console.log('📩 Task result:', message);
    if (pendingTaskResolve) {
      pendingTaskResolve(message);
      pendingTaskResolve = null;
    }
  }

  if (message.type === 'CONTENT_SCRIPT_READY') {
    console.log('📢 Content script ready on:', message.url);
  }
});

// Create a new AI Studio tab and wait for it to be ready
async function createNewAIStudioTab() {
  console.log('🆕 Creating new AI Studio tab...');

  const tab = await chrome.tabs.create({
    url: 'https://aistudio.google.com/app/prompts/new_chat?model=gemini-3-flash-preview',
    active: true,
  });

  // Wait for tab to load
  await new Promise((resolve) => {
    const checkReady = setInterval(async () => {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { action: 'PING' });
        if (response?.alive) {
          clearInterval(checkReady);
          resolve();
        }
      } catch (e) {
        // Content script not ready yet
      }
    }, 1000);

    // Timeout after 30 seconds
    setTimeout(() => {
      clearInterval(checkReady);
      resolve();
    }, 30000);
  });

  // Extra wait for UI to be fully ready
  await new Promise((r) => setTimeout(r, 2000));

  return tab;
}

// Send a task to a content script and wait for completion
async function sendTaskAndWait(tabId, task, timeout = 700000) {
  return new Promise((resolve, reject) => {
    pendingTaskResolve = resolve;

    chrome.tabs.sendMessage(tabId, { action: 'EXECUTE_TASK', task }).catch((err) => {
      console.error('Failed to send task:', err);
      resolve({ error: err.message });
    });

    // Timeout
    setTimeout(() => {
      if (pendingTaskResolve) {
        pendingTaskResolve = null;
        resolve({ timeout: true });
      }
    }, timeout);
  });
}

// Close a tab safely
async function closeTab(tabId) {
  try {
    await chrome.tabs.remove(tabId);
  } catch (e) {
    console.log('Tab already closed');
  }
}

// Main automation function - orchestrates the entire workflow
async function startAutomation(config) {
  console.log('🎬 Starting automation orchestrator');

  const queue = config.queue || [];
  const segmentDuration = (config.segmentDuration || 45) * 60; // Convert to seconds

  if (queue.length === 0) {
    console.log('⚠️ Empty queue');
    return { error: 'No videos in queue' };
  }

  automationRunning = true;
  automationPaused = false;

  // Update processing state
  await chrome.storage.local.set({
    processingState: {
      isProcessing: true,
      isPaused: false,
      currentIndex: 0,
      totalCount: queue.length,
      currentVideo: null,
      config: config,
    },
  });

  chrome.action.setBadgeText({ text: `0/${queue.length}` });
  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

  // Process each video
  for (let videoIndex = 0; videoIndex < queue.length; videoIndex++) {
    if (!automationRunning) {
      console.log('🛑 Automation stopped');
      break;
    }

    while (automationPaused) {
      await new Promise((r) => setTimeout(r, 1000));
    }

    const video = queue[videoIndex];
    console.log(`\n========================================`);
    console.log(`📹 Video ${videoIndex + 1}/${queue.length}: ${video.title}`);
    console.log(`========================================\n`);

    // Update state
    await chrome.storage.local.set({
      processingState: {
        isProcessing: true,
        isPaused: false,
        currentIndex: videoIndex,
        totalCount: queue.length,
        currentVideo: video,
      },
    });

    chrome.action.setBadgeText({ text: `${videoIndex + 1}/${queue.length}` });

    // Broadcast progress to popup
    chrome.runtime
      .sendMessage({
        type: 'PROGRESS_UPDATE',
        current: videoIndex + 1,
        total: queue.length,
        videoTitle: video.title,
        videoUrl: video.url,
      })
      .catch(() => {});

    try {
      // STEP 1: Get video duration (if not already known)
      let duration = video.duration || 0;

      if (!duration) {
        console.log('📏 Getting video duration...');
        const durationTab = await createNewAIStudioTab();

        const durationResult = await sendTaskAndWait(
          durationTab.id,
          {
            type: 'GET_DURATION',
            url: video.url,
          },
          60000
        ); // 1 minute timeout for duration check

        await closeTab(durationTab.id);

        if (durationResult.duration) {
          duration = durationResult.duration;
          console.log(`📏 Duration: ${Math.floor(duration / 60)} minutes`);
        } else {
          console.log('⚠️ Could not get duration, processing as single segment');
          duration = 0; // Will process as single segment
        }
      }

      // STEP 2: Calculate segments (max 45 minutes each)
      const segments = [];
      if (duration > segmentDuration) {
        let currentStart = 0;
        let segIndex = 0;
        while (currentStart < duration) {
          const segEnd = Math.min(currentStart + segmentDuration, duration);
          segments.push({
            index: segIndex++,
            startTime: currentStart,
            endTime: segEnd,
          });
          currentStart = segEnd;
        }
        console.log(`📂 Splitting into ${segments.length} segments`);
      } else {
        // Single segment (entire video)
        segments.push({ index: 0, startTime: 0, endTime: null });
      }

      // STEP 3: Process each segment
      for (const segment of segments) {
        if (!automationRunning) break;
        while (automationPaused) {
          await new Promise((r) => setTimeout(r, 1000));
        }

        const segmentLabel =
          segments.length > 1 ? ` (Segment ${segment.index + 1}/${segments.length})` : '';

        console.log(`🎯 Processing${segmentLabel}...`);

        // Create a NEW tab for this segment
        const processTab = await createNewAIStudioTab();

        // Send processing task
        const processResult = await sendTaskAndWait(processTab.id, {
          type: 'PROCESS_SEGMENT',
          url: video.url,
          title: video.title,
          videoId: video.id,
          startTime: segment.startTime,
          endTime: segment.endTime,
          segmentIndex: segment.index,
        });

        // Close the tab after processing
        await closeTab(processTab.id);

        if (processResult.success) {
          console.log(`✅ Segment ${segment.index + 1} complete`);
        } else if (processResult.error) {
          console.log(`❌ Segment error: ${processResult.error}`);
        } else if (processResult.timeout) {
          console.log(`⏰ Segment timeout`);
        }

        // Brief pause between segments
        await new Promise((r) => setTimeout(r, 2000));
      }

      console.log(`✅ Video ${videoIndex + 1} complete: ${video.title}`);
    } catch (error) {
      console.error(`❌ Error processing video: ${error.message}`);
      // Continue with next video
    }

    // Pause between videos
    await new Promise((r) => setTimeout(r, 3000));
  }

  // Automation complete
  automationRunning = false;

  await chrome.storage.local.set({
    processingState: {
      isProcessing: false,
      isPaused: false,
      currentIndex: queue.length,
      totalCount: queue.length,
    },
  });

  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' });

  // Clear badge after 5 seconds
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);

  // Notify
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: '🎉 Automation Complete!',
    message: `Processed ${queue.length} videos successfully.`,
  });

  console.log('🎉 All videos processed!');
  return { completed: true };
}

async function pauseAutomation() {
  automationPaused = true;

  const { processingState } = await chrome.storage.local.get('processingState');
  if (processingState) {
    processingState.isPaused = true;
    await chrome.storage.local.set({ processingState });
  }

  chrome.action.setBadgeText({ text: '⏸' });
  chrome.action.setBadgeBackgroundColor({ color: '#f59e0b' });

  return { paused: true };
}

async function resumeAutomation() {
  automationPaused = false;

  const { processingState } = await chrome.storage.local.get('processingState');
  if (processingState) {
    processingState.isPaused = false;
    await chrome.storage.local.set({ processingState });

    const idx = processingState.currentIndex || 0;
    const total = processingState.totalCount || 0;
    chrome.action.setBadgeText({ text: `${idx}/${total}` });
  }

  chrome.action.setBadgeBackgroundColor({ color: '#6366f1' });

  return { resumed: true };
}

async function stopAutomation() {
  automationRunning = false;
  automationPaused = false;

  await chrome.storage.local.set({
    processingState: {
      isProcessing: false,
      isPaused: false,
      currentIndex: 0,
      currentVideo: null,
    },
  });

  chrome.action.setBadgeText({ text: '' });

  return { stopped: true };
}

// Event handlers
async function handleProgress(data) {
  const { processingState } = await chrome.storage.local.get('processingState');
  processingState.currentIndex = data.currentIndex;
  processingState.currentVideo = data.currentVideo;
  await chrome.storage.local.set({ processingState });
  return { updated: true };
}

async function handleComplete(data) {
  console.log('🎉 Automation complete!', data);

  const { totalProcessed = 0 } = await chrome.storage.local.get('totalProcessed');
  await chrome.storage.local.set({
    totalProcessed: totalProcessed + (data.processedCount || 0),
    processingState: {
      isProcessing: false,
      isPaused: false,
      currentIndex: 0,
      currentVideo: null,
    },
  });

  // Update badge to show completion
  chrome.action.setBadgeText({ text: '✓' });
  chrome.action.setBadgeBackgroundColor({ color: '#10b981' }); // Success green

  // Clear badge after 5 seconds
  setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);

  // Notify user
  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon128.png',
    title: 'Automation Complete!',
    message: `Processed ${data.processedCount} videos successfully.`,
  });

  return { completed: true };
}

async function handleError(data) {
  console.error('❌ Error:', data);
  return { error: data.error };
}

// Context menu (right-click) integration
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'processVideo',
    title: 'Process with AI Video Intelligence',
    contexts: ['link'],
    targetUrlPatterns: ['*://www.youtube.com/watch?v=*', '*://youtu.be/*'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'processVideo') {
    const videoId = extractVideoId(info.linkUrl);
    if (videoId) {
      await addToQueue([
        {
          id: videoId,
          url: info.linkUrl,
          title: info.selectionText || 'YouTube Video',
          addedFrom: 'contextMenu',
        },
      ]);

      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Video Added to Queue',
        message: 'Video has been added to your processing queue.',
      });
    }
  }
});

function extractVideoId(url) {
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
  return match ? match[1] : null;
}

// YouTube API Functions
let youtubeAccessToken = null;
let youtubeTokenExpiry = null;

async function authenticateYouTube() {
  try {
    console.log('🔐 Authenticating with YouTube...');

    // Clear any existing cached token first to ensure fresh auth
    // This is crucial for account switching
    if (youtubeAccessToken) {
      try {
        await chrome.identity.removeCachedAuthToken({ token: youtubeAccessToken });
        console.log('🧹 Cleared previous cached token');
      } catch (e) {
        console.warn('⚠️ Could not clear cached token:', e);
      }
    }

    // Check if we should skip native auth based on previous failures
    const { preferWebAuth } = await chrome.storage.local.get('preferWebAuth');

    if (preferWebAuth) {
      console.log('⚡️ Skipping native auth due to previous failure, using Web Flow directly');
      return await authenticateWithWebFlow();
    }

    // Attempt 1: Native Chrome Identity (Preferred)
    try {
      const token = await chrome.identity.getAuthToken({ interactive: true });
      if (token) {
        return await handleAuthSuccess(token);
      }
    } catch (nativeError) {
      console.warn('⚠️ Native auth failed, trying Web Flow:', nativeError);

      // Remember to skip native next time
      await chrome.storage.local.set({ preferWebAuth: true });

      // Always fallback to Web Flow if native fails.
      // This is safer for dev/unpacked extensions where native specific errors vary.
      return await authenticateWithWebFlow();
    }

    throw new Error('Authentication failed');
  } catch (error) {
    console.error('❌ YouTube authentication failed:', error);
    console.error('ℹ️ Current Extension ID:', chrome.runtime.id);
    console.error('ℹ️ Please ensure this ID is authorized in Google Cloud Console.');

    // Reset web auth preference to allow retrying native auth if it was a transient issue
    if (
      error.message &&
      (error.message.includes('User did not approve') ||
        error.message.includes('Authorization page could not be loaded'))
    ) {
      await chrome.storage.local.remove('preferWebAuth');
    }

    throw error;
  }
}

async function authenticateWithWebFlow() {
  console.log('🌐 Starting Web Auth Flow...');
  const manifest = chrome.runtime.getManifest();
  // Use the client ID from the manifest
  const clientId = manifest.oauth2.client_id;
  const redirectUri = chrome.identity.getRedirectURL();
  const scopes = encodeURIComponent(manifest.oauth2.scopes.join(' '));

  console.log('ℹ️ OAUTH SETUP INFO:');
  console.log('   Client ID:', clientId);
  console.log('   Required Redirect URI:', redirectUri);
  console.log('   Action: Add this Redirect URI to your Google Cloud Console for this Client ID.');

  const authUrl = `https://accounts.google.com/o/oauth2/auth?client_id=${clientId}&response_type=token&redirect_uri=${redirectUri}&scope=${scopes}`;

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (redirectUrl) {
    // Extract token from URL
    const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
    const token = params.get('access_token');

    if (token) {
      return await handleAuthSuccess(token);
    }
  }

  throw new Error('Web auth flow failed to return token');
}

async function handleAuthSuccess(token) {
  youtubeAccessToken = token;
  youtubeTokenExpiry = Date.now() + 3600 * 1000; // 1 hour

  // Fetch user profile to detect account switches
  let userProfile = null;
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      userProfile = await response.json();
      console.log(`✅ Authenticated as: ${userProfile.email}`);
    }
  } catch (e) {
    console.warn('⚠️ Could not fetch user profile:', e);
  }

  // Check if this is a different account than before
  const stored = await chrome.storage.local.get('lastAuthAccount');
  if (stored.lastAuthAccount && userProfile && stored.lastAuthAccount !== userProfile.email) {
    console.log(`🔄 Account switched from ${stored.lastAuthAccount} to ${userProfile.email}`);
    // Clear any cached data from the previous account
    await chrome.storage.local.remove(['cachedPlaylists', 'cachedVideos']);
  }

  await chrome.storage.local.set({
    youtubeToken: token,
    youtubeTokenExpiry: youtubeTokenExpiry,
    userProfile: userProfile,
    lastAuthAccount: userProfile?.email,
  });

  console.log('✅ YouTube authentication successful');
  return { authenticated: true, token: token, userProfile };
}

async function isYouTubeAuthenticated() {
  try {
    const now = Date.now();

    // 1. Check Memory Cache
    if (youtubeAccessToken && youtubeTokenExpiry && now < youtubeTokenExpiry) {
      return { authenticated: true };
    }

    // 2. Check Local Storage
    const stored = await chrome.storage.local.get([
      'youtubeToken',
      'youtubeTokenExpiry',
      'preferWebAuth',
    ]);

    // If token exists and is valid
    if (stored.youtubeToken && stored.youtubeTokenExpiry) {
      if (now < stored.youtubeTokenExpiry) {
        // Sync to memory cache (this was missing before!)
        youtubeAccessToken = stored.youtubeToken;
        youtubeTokenExpiry = stored.youtubeTokenExpiry;
        console.log(
          '✅ Found valid stored token. Expires in:',
          Math.floor((stored.youtubeTokenExpiry - now) / 1000),
          's'
        );
        return { authenticated: true };
      } else {
        console.log('⚠️ Stored token expired. Now:', now, 'Expiry:', stored.youtubeTokenExpiry);
      }
    }

    // 3. If we have a token but it's expired, clear it and cached data
    if (stored.youtubeToken) {
      console.log('⚠️ Cached token expired, clearing auth data');
      await chrome.storage.local.remove([
        'youtubeToken',
        'youtubeTokenExpiry',
        'cachedPlaylists',
        'cachedVideos',
      ]);
      youtubeAccessToken = null;
      youtubeTokenExpiry = null;
      return { authenticated: false, reason: 'expired' };
    }

    // 4. Fallback: Try Silent Native Auth (ONLY if not Web Preferring)
    if (!stored.preferWebAuth) {
      try {
        const token = await chrome.identity.getAuthToken({ interactive: false });
        if (token) {
          await handleAuthSuccess(token);
          return { authenticated: true };
        }
      } catch (e) {
        // Native silent failed - expected
      }
    }

    return { authenticated: false };
  } catch (error) {
    console.error('Error checking YouTube auth:', error);
    return { authenticated: false };
  }
}

async function getYouTubePlaylists() {
  try {
    console.log('📋 Fetching YouTube playlists...');

    // Ensure we have a valid token
    const authStatus = await isYouTubeAuthenticated();
    if (!authStatus.authenticated) {
      await authenticateYouTube();
    }

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,contentDetails&mine=true&maxResults=50',
      {
        headers: {
          Authorization: `Bearer ${youtubeAccessToken}`,
          Accept: 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    const playlists = data.items.map((item) => ({
      id: item.id,
      title: item.snippet.title,
      description: item.snippet.description,
      itemCount: item.contentDetails.itemCount,
      thumbnail: item.snippet.thumbnails?.default?.url,
    }));

    console.log(`✅ Loaded ${playlists.length} playlists`);
    return playlists;
  } catch (error) {
    console.error('❌ Failed to load playlists:', error);
    throw error;
  }
}

async function getPlaylistVideos(playlistId) {
  try {
    console.log(`📹 Fetching videos from playlist: ${playlistId}`);

    // Ensure we have a valid token
    const authStatus = await isYouTubeAuthenticated();
    if (!authStatus.authenticated) {
      await authenticateYouTube();
    }

    let videos = [];
    let nextPageToken = '';

    do {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId=${playlistId}&maxResults=50&pageToken=${nextPageToken}`,
        {
          headers: {
            Authorization: `Bearer ${youtubeAccessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`YouTube API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      const pageItems = data.items.map((item) => ({
        id: item.contentDetails.videoId,
        playlistItemId: item.id,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnail: item.snippet.thumbnails?.default?.url,
        publishedAt: item.snippet.publishedAt,
        url: `https://www.youtube.com/watch?v=${item.contentDetails.videoId}`,
      }));

      videos = [...videos, ...pageItems];
      nextPageToken = data.nextPageToken;

      console.log(`Fetched page, total videos so far: ${videos.length}`);
    } while (nextPageToken);

    console.log(`✅ Loaded total ${videos.length} videos`);
    return videos;
  } catch (error) {
    console.error('❌ Failed to load playlist videos:', error);
    throw error;
  }
}

async function signOutYouTube() {
  try {
    // Remove cached token from Chrome's identity API
    if (youtubeAccessToken) {
      await chrome.identity.removeCachedAuthToken({ token: youtubeAccessToken });
    }

    // Clear all cached tokens (important for account switching)
    try {
      const allTokens = await chrome.identity.getAllCachedAuthTokens();
      for (const tokenInfo of allTokens) {
        await chrome.identity.removeCachedAuthToken({ token: tokenInfo.token });
      }
    } catch (e) {
      // getAllCachedAuthTokens might not be available in all Chrome versions
      console.warn('⚠️ Could not clear all cached tokens:', e);
    }

    // Clear memory cache
    youtubeAccessToken = null;
    youtubeTokenExpiry = null;

    // Clear storage - remove ALL auth-related keys
    await chrome.storage.local.remove([
      'youtubeToken',
      'youtubeTokenExpiry',
      'preferWebAuth',
      'userProfile',
      'lastAuthAccount',
    ]);

    console.log('✅ Signed out from YouTube - all auth data cleared');
    return { signedOut: true };
  } catch (error) {
    console.error('❌ Error signing out:', error);
    throw error;
  }
}

async function getVideoDetails(videoIds) {
  try {
    if (!videoIds || videoIds.length === 0) return [];

    console.log(`📹 Fetching details for ${videoIds.length} videos`);

    // Ensure auth
    const authStatus = await isYouTubeAuthenticated();
    if (!authStatus.authenticated) {
      await authenticateYouTube();
    }

    // YouTube API limits to 50 IDs per request
    const chunks = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      chunks.push(videoIds.slice(i, i + 50));
    }

    let allDetails = [];

    for (const chunk of chunks) {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=contentDetails,statistics,snippet&id=${chunk.join(',')}`,
        {
          headers: {
            Authorization: `Bearer ${youtubeAccessToken}`,
            Accept: 'application/json',
          },
        }
      );

      if (!response.ok) continue;

      const data = await response.json();
      if (data.items) {
        allDetails = [...allDetails, ...data.items];
      }
    }

    return allDetails.map((item) => ({
      id: item.id,
      duration: parseDuration(item.contentDetails.duration),
      viewCount: item.statistics.viewCount,
      likeCount: item.statistics.likeCount,
      channelTitle: item.snippet.channelTitle,
    }));
  } catch (error) {
    console.error('❌ Failed to get video details:', error);
    return []; // Return empty array on error to prevent TypeError in popup
  }
}

function parseDuration(duration) {
  if (!duration) return 0;
  const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1]) || 0;
  const minutes = parseInt(match[2]) || 0;
  const seconds = parseInt(match[3]) || 0;
  return hours * 3600 + minutes * 60 + seconds;
}

async function createPlaylist(title, description) {
  try {
    const authStatus = await isYouTubeAuthenticated();
    if (!authStatus.authenticated) {
      await authenticateYouTube();
    }

    const response = await fetch(
      'https://www.googleapis.com/youtube/v3/playlists?part=snippet,status',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${youtubeAccessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          snippet: {
            title: title,
            description: description,
          },
          status: {
            privacyStatus: 'private',
          },
        }),
      }
    );

    if (!response.ok) throw new Error('Failed to create playlist');

    const data = await response.json();
    return { id: data.id, title: data.snippet.title };
  } catch (error) {
    console.error('❌ Failed to create playlist:', error);
    throw error;
  }
}

// Subscription Management Functions

async function canProcessVideo() {
  try {
    const {
      tier = 'free',
      dailyUsage = 0,
      dailyLimit = 20,
    } = await chrome.storage.local.get(['tier', 'dailyUsage', 'dailyLimit']);

    // Pro and Enterprise have unlimited processing
    if (tier === 'pro' || tier === 'enterprise') {
      return true;
    }

    // Free tier has daily limits
    return dailyUsage < dailyLimit;
  } catch (error) {
    console.error('Error checking processing limits:', error);
    return false;
  }
}

console.log('✅ Background service worker initialized');
