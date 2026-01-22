/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
// YouTube Content Script
// Enhances YouTube pages with quick-add functionality

console.log('📺 YouTube content script loaded');

// Add quick-add button to videos
function addQuickAddButtons() {
  // Find all video elements
  const videoElements = document.querySelectorAll(
    'ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer'
  );

  videoElements.forEach((element) => {
    // Skip if already has button
    if (element.querySelector('.ai-suite-quick-add')) {
      return;
    }

    // Get video ID
    const videoId = getVideoId(element);
    if (!videoId) return;

    // Create quick-add button
    const button = createQuickAddButton(videoId, element);

    // Add to video element
    const menuContainer =
      element.querySelector('#menu') || element.querySelector('ytd-menu-renderer');
    if (menuContainer) {
      menuContainer.insertBefore(button, menuContainer.firstChild);
    }
  });
}

// Get video ID from element
function getVideoId(element) {
  const link =
    element.querySelector('a#video-title') || element.querySelector('a.yt-simple-endpoint');

  if (!link) return null;

  const href = link.getAttribute('href');
  if (!href) return null;

  const match = href.match(/[?&]v=([^&]+)/);
  return match ? match[1] : null;
}

// Create quick-add button
function createQuickAddButton(videoId, videoElement) {
  const button = document.createElement('button');
  button.className = 'ai-suite-quick-add';
  button.innerHTML = '➕ AI Queue';
  button.title = 'Add to AI processing queue';

  // Style button
  Object.assign(button.style, {
    padding: '6px 12px',
    marginRight: '8px',
    background: '#6366f1',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
    transition: 'all 0.2s',
  });

  // Hover effect
  button.addEventListener('mouseenter', () => {
    button.style.background = '#4f46e5';
    button.style.transform = 'translateY(-1px)';
  });

  button.addEventListener('mouseleave', () => {
    button.style.background = '#6366f1';
    button.style.transform = 'translateY(0)';
  });

  // Click handler
  button.addEventListener('click', async (e) => {
    e.preventDefault();
    e.stopPropagation();

    // Get video details
    const videoData = extractVideoData(videoElement, videoId);

    // Send to background script
    const response = await chrome.runtime.sendMessage({
      type: 'QUEUE_ADD_SINGLE',
      data: { video: videoData },
    });

    if (response.success) {
      // Visual feedback
      button.innerHTML = '✓ Added';
      button.style.background = '#10b981';

      setTimeout(() => {
        button.innerHTML = '➕ AI Queue';
        button.style.background = '#6366f1';
      }, 2000);
    } else {
      button.innerHTML = '✗ Error';
      button.style.background = '#ef4444';

      setTimeout(() => {
        button.innerHTML = '➕ AI Queue';
        button.style.background = '#6366f1';
      }, 2000);
    }
  });

  return button;
}

// Extract video data from element
function extractVideoData(element, videoId) {
  const titleElement = element.querySelector('#video-title');
  const channelElement =
    element.querySelector('#channel-name a') || element.querySelector('ytd-channel-name a');
  const thumbnailElement = element.querySelector('img');
  const metadataElement = element.querySelector('#metadata-line');

  return {
    id: videoId,
    title: titleElement?.textContent?.trim() || 'Unknown',
    channelTitle: channelElement?.textContent?.trim() || 'Unknown',
    thumbnail: thumbnailElement?.src || '',
    url: `https://www.youtube.com/watch?v=${videoId}`,
    publishedAt: Date.now(), // Approximate
  };
}

// Add context menu for selected videos
function setupContextMenu() {
  document.addEventListener('contextmenu', (e) => {
    const videoElement = e.target.closest(
      'ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer'
    );

    if (videoElement) {
      const videoId = getVideoId(videoElement);
      if (videoId) {
        // Store video ID for context menu
        sessionStorage.setItem('contextMenuVideoId', videoId);
      }
    }
  });
}

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GET_SELECTED_VIDEOS') {
    const selectedVideos = getSelectedVideos();
    sendResponse({ success: true, videos: selectedVideos });
  }

  if (message.type === 'HIGHLIGHT_VIDEO') {
    highlightVideo(message.data.videoId);
    sendResponse({ success: true });
  }
});

// Get currently selected videos (if multi-select is active)
function getSelectedVideos() {
  const selected = document.querySelectorAll('.ai-suite-selected');
  return Array.from(selected).map((element) => {
    const videoId = getVideoId(element);
    return extractVideoData(element, videoId);
  });
}

// Highlight a video
function highlightVideo(videoId) {
  const videoElements = document.querySelectorAll(
    'ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer'
  );

  videoElements.forEach((element) => {
    const id = getVideoId(element);
    if (id === videoId) {
      element.style.outline = '2px solid #6366f1';
      element.style.outlineOffset = '2px';

      setTimeout(() => {
        element.style.outline = '';
        element.style.outlineOffset = '';
      }, 2000);
    }
  });
}

// Add multi-select functionality
function setupMultiSelect() {
  let isMultiSelectMode = false;

  // Listen for Ctrl/Cmd key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Shift') {
      isMultiSelectMode = true;
      document.body.style.cursor = 'crosshair';
    }
  });

  document.addEventListener('keyup', (e) => {
    if (e.key === 'Shift') {
      isMultiSelectMode = false;
      document.body.style.cursor = '';
    }
  });

  // Click handler for multi-select
  document.addEventListener(
    'click',
    (e) => {
      if (!isMultiSelectMode) return;

      const videoElement = e.target.closest(
        'ytd-video-renderer, ytd-grid-video-renderer, ytd-playlist-video-renderer'
      );

      if (videoElement) {
        e.preventDefault();
        e.stopPropagation();

        // Toggle selection
        videoElement.classList.toggle('ai-suite-selected');

        if (videoElement.classList.contains('ai-suite-selected')) {
          videoElement.style.background = 'rgba(99, 102, 241, 0.1)';
          videoElement.style.outline = '2px solid #6366f1';
        } else {
          videoElement.style.background = '';
          videoElement.style.outline = '';
        }
      }
    },
    true
  );
}

// Initialize
function init() {
  console.log('Initializing YouTube enhancements...');

  // Add quick-add buttons
  addQuickAddButtons();

  // Setup context menu
  setupContextMenu();

  // Setup multi-select
  setupMultiSelect();

  // Watch for new videos (infinite scroll)
  const observer = new MutationObserver(() => {
    addQuickAddButtons();
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('✅ YouTube enhancements ready');
}

// Wait for page to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

console.log('✅ YouTube content script ready');

/******/ })()
;
//# sourceMappingURL=youtube-integration.js.map