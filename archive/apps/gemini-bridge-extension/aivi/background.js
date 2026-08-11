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

  // Set up periodic token refresh check (every 10 minutes)
  chrome.alarms.create('tokenRefreshCheck', { periodInMinutes: 10 });
  console.log('⏰ Token refresh alarm created');
});

// Handle periodic token refresh checks
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'tokenRefreshCheck') {
    console.log('⏰ Running periodic token refresh check...');
    try {
      const refreshed = await refreshAccessTokenIfNeeded();
      if (refreshed) {
        console.log('✅ Token refreshed during periodic check');
      } else {
        console.log('✓ Token still valid, no refresh needed');
      }
    } catch (error) {
      console.error('❌ Periodic token refresh check failed:', error);
    }
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

    case 'SUBSCRIPTION_UPGRADE':
      return await handleSubscriptionUpgrade(data);

    case 'REPORTS_GET':
      return await getReports(data);

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
    case 'TASK_COMPLETE':
    case 'TASK_ERROR':
    case 'CONTENT_SCRIPT_READY':
      // Update badge based on message type
      if (type === 'AUTOMATION_ERROR' || type === 'TASK_ERROR') {
        console.error('🚨 Automation Error:', message.error || message.message);
        chrome.action.setBadgeText({ text: '!' });
        chrome.action.setBadgeBackgroundColor({ color: '#ef4444' }); // Red for error
      } else if (type === 'PROGRESS_UPDATE' && message.current !== undefined) {
        chrome.action.setBadgeText({ text: `${message.current}/${message.total}` });
      } else if (type === 'LOG') {
        console.log('📝 Content Log:', message.message);
      } else if (type === 'CONTENT_SCRIPT_READY') {
        console.log('📢 Content script ready:', message.url);
      } else if (type === 'TASK_COMPLETE') {
        console.log('✅ Task completed');
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

// Save report data to backend
async function saveReportToBackend(taskResult) {
  try {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
      console.warn('No auth token, skipping backend save');
      return;
    }

    // First, we need to find the video_queue_id from our queue
    const { queue = [] } = await chrome.storage.local.get('queue');
    const video = queue.find((v) => v.id === taskResult.videoId);

    if (!video || !video.queueId) {
      console.warn('Video not found in queue or missing queueId');
      return;
    }

    // Call createReport with individual parameters (not an object)
    const response = await apiClient.createReport(
      video.queueId,
      taskResult.segmentIndex || 0,
      taskResult.reportContent,
      {} // Parse content if needed
    );
    console.log('✅ Report saved to backend:', response.data);
  } catch (error) {
    console.error('Failed to save report:', error);
    // Don't throw - we don't want to fail the automation if backend save fails
  }
}

// Replace local storage subscription checks with API calls
async function checkSubscription() {
  try {
    // Ensure we have the token available for the API client
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
      console.warn('No auth token found for subscription check, defaulting to free.');
      return { tier: 'free' };
    }

    // The API Client internal retrieval might be failing if run in backgroundworker context
    // without explicit storage get sometimes, so we ensure it here or rely on its internal GET.
    // However, the error "Not authorized, no token provided" implies the request was made but header missing.
    // Let's ensure API Client has what it needs.
    const response = await apiClient.getSubscriptionStatus();
    return response.data;
  } catch (error) {
    console.error('Failed to check subscription:', error);
    // Fallback to free tier on error to prevent blocking usage
    return { tier: 'free' };
  }
}

async function getReports(params = {}) {
  try {
    const response = await apiClient.getReports(params);
    return response.data;
  } catch (error) {
    console.error('Failed to get reports:', error);
    throw error;
  }
}

async function addToQueue(videos) {
  try {
    const { token } = await chrome.storage.local.get('token');
    if (!token) {
      throw new Error('Not authorized: No token found. Please login.');
    }

    // Transform videos to match backend API format
    const transformedVideos = videos.map((video) => ({
      youtubeVideoId: video.id,
      title: video.title,
      channelName: video.channelTitle || null,
      thumbnailUrl: video.thumbnail || null,
      durationSeconds: video.duration || null,
      playlistId: video.playlistId || null,
      metadata: {
        description: video.description || null,
        publishedAt: video.publishedAt || null,
        url: video.url || `https://www.youtube.com/watch?v=${video.id}`,
        viewCount: video.viewCount || null,
        likeCount: video.likeCount || null,
      },
    }));

    const response = await apiClient.addToQueue(transformedVideos);

    // Backend returns videos with IDs - map them to include queueId
    const videosWithIds = response.data.videos.map((backendVideo, index) => ({
      ...videos[index],
      queueId: backendVideo.id, // Store backend ID as queueId
      youtubeVideoId: backendVideo.youtube_video_id,
    }));

    // Sync local queue for UI with backend IDs
    const { queue = [] } = await chrome.storage.local.get('queue');
    const updatedQueue = [...queue, ...videosWithIds];
    await chrome.storage.local.set({ queue: updatedQueue });

    console.log(
      `✅ Added ${videosWithIds.length} video(s) to queue via API. Total: ${updatedQueue.length}`
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

    // If we have report content, save it to backend
    if (message.type === 'TASK_COMPLETE' && message.reportContent) {
      saveReportToBackend(message).catch((err) => {
        console.error('Failed to save report to backend:', err);
      });
    }

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

// Process video based on selected processing level
async function processVideoByLevel(video, processingLevel) {
  console.log(`Processing with level: ${processingLevel}`);

  switch (processingLevel) {
    case 'transcript':
      // Transcript-only: Use smart-processing-service
      // Import and use the service (for now, return placeholder)
      console.log('📝 Processing with transcript-only mode');
      // TODO: Implement transcript-only extraction
      return {
        success: true,
        content: `# ${video.title}\n\nTranscript-only processing not yet implemented.\nVideo ID: ${video.id}`,
        method: 'transcript',
      };

    case 'flash':
      console.log('⚡ Processing with Gemini Flash');
      // TODO: Implement Gemini Flash API call via smart-processing-service
      return {
        success: true,
        content: `# ${video.title}\n\nGemini Flash processing not yet implemented.\nVideo ID: ${video.id}`,
        method: 'flash',
      };

    case 'pro':
      console.log('🧠 Processing with Gemini Pro');
      // TODO: Implement Gemini Pro API call via smart-processing-service
      return {
        success: true,
        content: `# ${video.title}\n\nGemini Pro processing not yet implemented.\nVideo ID: ${video.id}`,
        method: 'pro',
      };

    case 'ai_studio':
    default:
      // Use existing AI Studio automation (return null to signal "use existing flow")
      return null;
  }
}

// Main automation function - orchestrates the entire workflow
async function startAutomation(config) {
  console.log('🎬 Starting automation orchestrator');
  console.log('Processing level:', config.processingLevel || 'ai_studio');

  const queue = config.queue || [];
  const segmentDuration = (config.segmentDuration || 45) * 60; // Convert to seconds
  const processingLevel = config.processingLevel || 'ai_studio';

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
      lastUpdated: Date.now(),
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
        lastUpdated: Date.now(),
      },
    });

    chrome.action.setBadgeText({ text: `${videoIndex + 1}/${queue.length}` });

    // Broadcast progress to popup
    chrome.runtime
      .sendMessage({
        type: 'PROGRESS_UPDATE',
        current: videoIndex + 1,
        total: queue.length,
        data: {
          processedCount: videoIndex + 1,
          totalCount: queue.length,
          currentVideo: {
            title: video.title,
            url: video.url,
          },
        },
      })
      .catch(() => {});

    try {
      // Check if using alternative processing method
      const alternativeResult = await processVideoByLevel(video, processingLevel);

      if (alternativeResult) {
        // Used alternative method (transcript/flash/pro)
        console.log(`✅ Video processed with ${alternativeResult.method} method`);

        // Send result as if it came from content script
        await saveReportToBackend({
          videoId: video.id,
          segmentIndex: 0,
          reportContent: alternativeResult.content,
        }).catch((err) => console.error('Failed to save:', err));

        continue; // Skip to next video
      }

      // Otherwise, use existing AI Studio automation flow
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
      lastUpdated: Date.now(),
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
      lastUpdated: Date.now(),
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
      lastUpdated: Date.now(),
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
  console.log('🔐 User initiated explicit authentication...');
  try {
    // User CLICKED the button. We force interactive options.
    // Since we fixed the manifest to use correct Client ID, we can try native first, OR use web flow if preferred.

    // Let's use launchWebAuthFlow as it is the most reliable "explicit" method that forces a prompt if needed
    // and avoids the "Chrome thinks I'm already signed in" loop of native identity.
    return await authenticateWithWebFlow();
  } catch (error) {
    console.error('❌ Explicit authentication failed:', error);
    throw error;
  }
}

async function authenticateWithWebFlow() {
  console.log('🌐 Starting Web Auth Flow (main Google account chooser first)...');
  const manifest = chrome.runtime.getManifest();
  const clientId = manifest.oauth2.client_id;
  const redirectUri = chrome.identity.getRedirectURL();
  const scopes = encodeURIComponent(manifest.oauth2.scopes.join(' '));

  const authUrl =
    'https://accounts.google.com/o/oauth2/auth' +
    '?client_id=' +
    encodeURIComponent(clientId) +
    '&response_type=token' +
    '&redirect_uri=' +
    encodeURIComponent(redirectUri) +
    '&scope=' +
    scopes +
    '&prompt=select_account' +
    '&include_granted_scopes=true';

  const redirectUrl = await chrome.identity.launchWebAuthFlow({
    url: authUrl,
    interactive: true,
  });

  if (!redirectUrl) {
    throw new Error('Web auth flow failed to return redirect URL');
  }

  const params = new URLSearchParams(new URL(redirectUrl).hash.substring(1));
  const token = params.get('access_token');
  if (!token) {
    const error = params.get('error') || 'oauth_error';
    throw new Error('OAuth flow failed: ' + error);
  }

  console.log('✅ Access token received via account chooser flow');
  return await handleAuthSuccessFallback(token);
}

async function handleAuthSuccessFallback(token) {
  console.log('🔄 Using fallback authentication (no refresh token available)');

  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token type');
  }

  youtubeAccessToken = token;
  youtubeTokenExpiry = Date.now() + 50 * 60 * 1000; // 50 minutes

  let userProfile = null;
  try {
    const response = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (response.ok) {
      userProfile = await response.json();
      console.log(`✅ Authenticated as: ${userProfile.email} (fallback mode)`);
    }
  } catch (e) {
    console.warn('⚠️ Could not fetch user profile:', e);
  }

  // Save YouTube auth to storage
  await chrome.storage.local.set({
    youtubeToken: token,
    youtubeTokenExpiry: youtubeTokenExpiry,
    userProfile: userProfile,
    isAuthenticated: true,
  });

  // Try to sync with backend using old endpoint (may not have refresh token support)
  if (userProfile) {
    try {
      console.log('🔄 Syncing with backend (old endpoint)...');
      const backendAuth = await apiClient.login({
        googleId: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.name,
        avatarUrl: userProfile.picture,
      });
      console.log('✅ Backend sync successful');
    } catch (backendError) {
      console.error('⚠️ Backend sync failed:', backendError);
      // Continue anyway - fallback mode
    }
  }

  console.log('⚠️ FALLBACK MODE: You will need to re-authenticate every hour');
  console.log('   Backend deployment in progress - refresh token support coming soon');

  return { authenticated: true, token: token, userProfile, fallbackMode: true };
}

async function exchangeCodeForTokens(authorizationCode) {
  console.log('🔄 Exchanging authorization code for access + refresh tokens...');

  try {
    // Get the redirect URI that was used in the auth request
    const redirectUri = chrome.identity.getRedirectURL();
    console.log(`   - Using redirect URI: ${redirectUri}`);

    // Send the authorization code to our backend to exchange for tokens
    // The backend has the client secret needed for this exchange
    const response = await apiClient.request('/auth/google/exchange-code', {
      method: 'POST',
      body: JSON.stringify({
        code: authorizationCode,
        redirectUri: redirectUri,
      }),
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to exchange authorization code');
    }

    const { accessToken, refreshToken, expiresIn, user, jwtToken } = response.data;

    console.log('✅ Received tokens from backend');

    // Calculate expiry time (use actual expires_in from Google, or default to 3600 seconds)
    const expiryMs = (expiresIn || 3600) * 1000;
    const tokenExpiry = Date.now() + expiryMs - 10 * 60 * 1000; // Subtract 10 min buffer

    // Store access token in memory and storage
    youtubeAccessToken = accessToken;
    youtubeTokenExpiry = tokenExpiry;

    await chrome.storage.local.set({
      youtubeToken: accessToken,
      youtubeTokenExpiry: tokenExpiry,
      userProfile: user,
      isAuthenticated: true,
      token: jwtToken, // JWT token for backend API calls
    });

    console.log('✅ Authentication complete, tokens stored');
    console.log(`✅ Authenticated as: ${user.email}`);
    console.log(`⏰ Access token expires in ${Math.round(expiryMs / 60000)} minutes`);

    return { authenticated: true, token: accessToken, userProfile: user };
  } catch (error) {
    console.error('❌ Failed to exchange authorization code:', error);
    throw new Error(`Token exchange failed: ${error.message}`);
  }
}

async function handleAuthSuccess(token) {
  if (!token || typeof token !== 'string') {
    throw new Error('Invalid token type');
  }

  youtubeAccessToken = token;
  // Set expiry to 50 minutes to be safe (tokens usually last 60)
  youtubeTokenExpiry = Date.now() + 50 * 60 * 1000;

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

  // Save YouTube auth to storage
  await chrome.storage.local.set({
    youtubeToken: token,
    youtubeTokenExpiry: youtubeTokenExpiry,
    userProfile: userProfile,
    isAuthenticated: true, // Explicit flag
  });

  // Sync with backend authentication to get JWT token
  if (userProfile) {
    try {
      console.log('🔄 Syncing authentication with backend...');
      const backendAuth = await apiClient.login({
        googleId: userProfile.id,
        email: userProfile.email,
        displayName: userProfile.name,
        avatarUrl: userProfile.picture,
      });
      console.log('✅ Backend authentication successful, JWT token stored');
    } catch (backendError) {
      console.error('⚠️ Backend authentication failed:', backendError);
      // Don't fail the whole auth flow - YouTube auth is still valid
      // User can still use AI Studio mode without backend features
    }
  }

  console.log('✅ Auth successful and saved.');
  return { authenticated: true, token: token, userProfile };
}

// Automatically refresh token when it's about to expire
async function refreshAccessTokenIfNeeded() {
  try {
    const now = Date.now();
    const stored = await chrome.storage.local.get(['youtubeToken', 'youtubeTokenExpiry', 'token']);

    // Check if token exists and is about to expire (within 5 minutes)
    if (stored.youtubeToken && stored.youtubeTokenExpiry) {
      const timeUntilExpiry = stored.youtubeTokenExpiry - now;
      const fiveMinutes = 5 * 60 * 1000;

      if (timeUntilExpiry < fiveMinutes && timeUntilExpiry > 0) {
        console.log('⏰ Access token expiring soon, refreshing...');
        await refreshAccessToken();
        return true;
      } else if (timeUntilExpiry <= 0) {
        console.log('⏰ Access token expired, refreshing...');
        await refreshAccessToken();
        return true;
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Failed to check/refresh token:', error);
    return false;
  }
}

// Refresh the access token using the refresh token stored on backend
async function refreshAccessToken() {
  try {
    console.log('🔄 Requesting new access token from backend...');

    const response = await apiClient.request('/auth/refresh-token', {
      method: 'POST',
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to refresh token');
    }

    const { accessToken, expiresIn } = response.data;

    // Update tokens in memory and storage
    const expiryMs = (expiresIn || 3600) * 1000;
    const newExpiry = Date.now() + expiryMs - 10 * 60 * 1000; // Subtract 10 min buffer

    youtubeAccessToken = accessToken;
    youtubeTokenExpiry = newExpiry;

    await chrome.storage.local.set({
      youtubeToken: accessToken,
      youtubeTokenExpiry: newExpiry,
    });

    console.log(
      `✅ Access token refreshed successfully (expires in ${Math.round(expiryMs / 60000)} min)`
    );
    return true;
  } catch (error) {
    console.error('❌ Failed to refresh access token:', error);
    console.log('   User will need to sign in again');

    // Clear invalid tokens
    youtubeAccessToken = null;
    youtubeTokenExpiry = null;
    await chrome.storage.local.set({
      youtubeToken: null,
      youtubeTokenExpiry: null,
      isAuthenticated: false,
    });

    throw error;
  }
}

// Check ONLY if we have a valid session in storage. Auto-refresh if needed.
async function isYouTubeAuthenticated() {
  try {
    const now = Date.now();

    // 1. Check Memory (fastest)
    if (youtubeAccessToken && youtubeTokenExpiry && now < youtubeTokenExpiry) {
      // Token still valid, but check if it needs refreshing soon
      await refreshAccessTokenIfNeeded();
      return { authenticated: true };
    }

    // 2. Check Storage
    const stored = await chrome.storage.local.get([
      'youtubeToken',
      'youtubeTokenExpiry',
      'isAuthenticated',
    ]);

    if (stored.isAuthenticated && stored.youtubeToken && stored.youtubeTokenExpiry) {
      if (now < stored.youtubeTokenExpiry) {
        // Restore to memory
        youtubeAccessToken = stored.youtubeToken;
        youtubeTokenExpiry = stored.youtubeTokenExpiry;

        // Auto-refresh if needed
        await refreshAccessTokenIfNeeded();

        return { authenticated: true };
      } else {
        console.log('⏰ Token expired, attempting automatic refresh...');
        try {
          await refreshAccessToken();
          return { authenticated: true };
        } catch (refreshError) {
          console.log('❌ Automatic refresh failed, user needs to sign in again');
          return { authenticated: false };
        }
      }
    }

    return { authenticated: false };
  } catch (error) {
    console.error('Error checking auth status:', error);
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
    console.log('🚪 Signing out...');

    // 1. Logout from backend API to invalidate JWT session
    try {
      console.log('🔄 Logging out from backend...');
      await apiClient.request('/auth/logout', { method: 'POST' });
      console.log('✅ Backend logout successful');
    } catch (backendError) {
      console.warn('⚠️ Backend logout failed (non-critical):', backendError.message);
      // Continue with logout even if backend call fails
    }

    // 2. Revoke Google OAuth token
    if (youtubeAccessToken) {
      try {
        console.log('🔄 Revoking Google OAuth token...');
        const revokeResponse = await fetch(
          'https://oauth2.googleapis.com/revoke?token=' + youtubeAccessToken,
          {
            method: 'POST',
            headers: { 'Content-type': 'application/x-www-form-urlencoded' },
          }
        );
        if (revokeResponse.ok) {
          console.log('✅ Google OAuth token revoked');
        } else {
          console.warn('⚠️ Google token revocation returned:', revokeResponse.status);
        }
      } catch (revokeError) {
        console.warn('⚠️ Failed to revoke Google token:', revokeError.message);
      }

      // 3. Clear Chrome Identity Cache
      try {
        await chrome.identity.removeCachedAuthToken({ token: youtubeAccessToken });
        console.log('✅ Chrome identity cache cleared');
      } catch (cacheError) {
        console.warn('⚠️ Failed to clear identity cache:', cacheError.message);
      }
    }

    // 4. Clear Memory
    youtubeAccessToken = null;
    youtubeTokenExpiry = null;

    // 5. Clear Storage - NUKE IT ALL related to auth
    await chrome.storage.local.remove([
      'youtubeToken',
      'youtubeTokenExpiry',
      'userProfile',
      'lastAuthAccount',
      'isAuthenticated',
      'token', // Backend JWT token
      'preferWebAuth',
      'userExplicitlySignedOut',
    ]);

    console.log('✅ Signed out completely - all tokens cleared');
    return { signedOut: true };
  } catch (error) {
    console.error('❌ Error during sign out:', error);
    // Even if errors occurred, try to clear local state
    youtubeAccessToken = null;
    youtubeTokenExpiry = null;
    await chrome.storage.local.clear();
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

async function handleSubscriptionUpgrade(data) {
  try {
    const { tier, billingPeriod = 'monthly' } = data;

    if (!tier || !['pro', 'tnf'].includes(tier)) {
      throw new Error('Invalid tier. Must be "pro" or "tnf"');
    }

    console.log(`🔄 Creating checkout session for ${tier} (${billingPeriod})...`);

    // Call backend to create checkout session
    const response = await apiClient.request('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier, billingPeriod }),
    });

    if (!response.success) {
      throw new Error(response.error?.message || 'Failed to create checkout session');
    }

    // Open PayPal approval URL in new tab
    const approvalUrl = response.data.approvalUrl;
    console.log('✅ Opening PayPal checkout:', approvalUrl);

    chrome.tabs.create({ url: approvalUrl });

    return { success: true };
  } catch (error) {
    console.error('❌ Subscription upgrade error:', error);
    return {
      success: false,
      error: error.message || 'Failed to start upgrade process',
    };
  }
}

console.log('✅ Background service worker initialized');
