/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
// Content script for bridging communication between custom AI Studio apps (in usercontent.goog iframes)
// and the Chrome Extension
console.log('[AI Video Suite] Iframe Bridge: Content script loaded in iframe');

// Detect if we're in the custom "The New Fuse - AI Library" app
const isCustomApp = () => {
  return (
    window.location.hostname.endsWith('.usercontent.goog') ||
    document.title.includes('The New Fuse') ||
    document.title.includes('AI Library') ||
    document.querySelector('[data-app-name*="fuse"]') !== null
  );
};

// Extract queue data directly from the DOM
// This bypasses the app's extension check which relies on a flag we can't set due to CSP
const extractQueueFromDOM = () => {
  console.log('[AI Video Suite] Extracting queue from DOM...');

  const queue = [];

  // Try to find queue table rows
  const tableRows = document.querySelectorAll(
    'table tbody tr, [class*="queue"] tr, [class*="video"] tr'
  );
  tableRows.forEach((row, index) => {
    const cells = row.querySelectorAll('td');
    // Look for YouTube URL in the row
    const rowText = row.textContent || '';
    const urlMatch = rowText.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
    if (urlMatch) {
      queue.push({
        id: `dom-${index}`,
        url: `https://www.youtube.com/watch?v=${urlMatch[1]}`,
        title: cells[0]?.textContent?.trim() || `Video ${index + 1}`,
        status: 'pending',
      });
    }
  });

  // Also try textarea with bulk import URLs
  const textareas = document.querySelectorAll('textarea');
  textareas.forEach((textarea) => {
    const text = textarea.value || '';
    const lines = text.split('\n').filter((line) => line.trim());
    lines.forEach((line, index) => {
      const urlMatch = line.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
      if (urlMatch) {
        // Avoid duplicates
        const url = `https://www.youtube.com/watch?v=${urlMatch[1]}`;
        if (!queue.some((q) => q.url === url)) {
          queue.push({
            id: `textarea-${index}`,
            url: url,
            title: `Video ${queue.length + 1}`,
            status: 'pending',
          });
        }
      }
    });
  });

  // Try to find any elements containing YouTube URLs
  if (queue.length === 0) {
    const allText = document.body.innerText;
    const allMatches =
      allText.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/g) || [];
    const uniqueIds = [...new Set(allMatches.map((m) => m.match(/([a-zA-Z0-9_-]+)$/)?.[1]))];
    uniqueIds.forEach((videoId, index) => {
      if (videoId) {
        queue.push({
          id: `body-${index}`,
          url: `https://www.youtube.com/watch?v=${videoId}`,
          title: `Video ${index + 1}`,
          status: 'pending',
        });
      }
    });
  }

  console.log('[AI Video Suite] Extracted queue from DOM:', queue.length, 'videos');
  return queue;
};

// Handle sync directly when button is clicked
const handleSyncDirectly = () => {
  console.log('[AI Video Suite] Handling sync directly (bypassing app check)...');

  const queue = extractQueueFromDOM();

  if (queue.length === 0) {
    console.log('[AI Video Suite] No videos found in DOM, cannot sync');
    // Show a message to the user
    showNotification('No videos found to sync. Please add YouTube URLs first.', 'warning');
    return false;
  }

  // Store in chrome.storage.local
  chrome.storage.local.set(
    {
      videoQueue: queue,
      reverseOrder: false,
      segmentDuration: 45,
      customAppDetected: true,
      syncSource: 'directExtraction',
      syncTimestamp: Date.now(),
    },
    () => {
      console.log('[AI Video Suite] Queue synced directly:', queue.length, 'videos');
      showNotification(`✓ Synced ${queue.length} videos to extension!`, 'success');

      // Notify background script
      chrome.runtime.sendMessage({
        type: 'LOG',
        message: `Queue synced directly: ${queue.length} videos`,
        level: 'success',
      });
    }
  );

  return true;
};

// Show notification in the page
const showNotification = (message, type = 'info') => {
  // Try to find an existing notification area or create one
  let notifArea = document.querySelector('#extension-notification-area');
  if (!notifArea) {
    notifArea = document.createElement('div');
    notifArea.id = 'extension-notification-area';
    notifArea.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 999999;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    `;
    document.body.appendChild(notifArea);
  }

  const notif = document.createElement('div');
  const bgColors = {
    success: 'linear-gradient(135deg, #10b981, #059669)',
    warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
    error: 'linear-gradient(135deg, #ef4444, #dc2626)',
    info: 'linear-gradient(135deg, #3b82f6, #2563eb)',
  };
  notif.style.cssText = `
    background: ${bgColors[type] || bgColors.info};
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    margin-bottom: 10px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    font-size: 14px;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;
  notif.textContent = message;
  notifArea.appendChild(notif);

  setTimeout(() => {
    notif.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notif.remove(), 300);
  }, 4000);
};

// Add CSS animation
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  @keyframes slideOut {
    from { transform: translateX(0); opacity: 1; }
    to { transform: translateX(100%); opacity: 0; }
  }
`;
document.head.appendChild(style);

// Intercept clicks on "Sync to Extension" button
document.addEventListener(
  'click',
  (e) => {
    const target = e.target;
    const buttonText = (target.textContent || '').toLowerCase();
    const isButton = target.tagName === 'BUTTON' || target.closest('button');

    if (isButton && buttonText.includes('sync') && buttonText.includes('extension')) {
      console.log('[AI Video Suite] Intercepted Sync to Extension click!');

      // Prevent the default app behavior which would show the error
      e.preventDefault();
      e.stopPropagation();
      e.stopImmediatePropagation();

      // Handle the sync ourselves
      handleSyncDirectly();

      return false;
    }
  },
  true
); // Use capture phase to intercept before the app

// Listen for messages from the custom app (sent via window.postMessage)
window.addEventListener('message', (event) => {
  // Only process messages from the same window (the app's own postMessage)
  if (event.source !== window) return;

  console.log('[AI Video Suite] Iframe received message:', event.data?.type);

  // Handle SYNC_TO_EXTENSION from the custom app
  if (event.data?.type === 'SYNC_TO_EXTENSION') {
    const { videoQueue, reverseOrder, segmentDuration } = event.data.data || {};

    console.log('[AI Video Suite] Syncing queue from custom app:', {
      videoCount: videoQueue?.length || 0,
      reverseOrder,
      segmentDuration,
    });

    // Store in chrome.storage.local
    chrome.storage.local.set(
      {
        videoQueue: videoQueue || [],
        reverseOrder: reverseOrder || false,
        segmentDuration: segmentDuration || 45,
        customAppDetected: true,
        syncTimestamp: Date.now(),
      },
      () => {
        console.log('[AI Video Suite] Queue synced to extension storage');

        // Send confirmation back to the app
        window.postMessage(
          {
            type: 'EXTENSION_SYNC_CONFIRMED',
            success: true,
            message: `Successfully synced ${videoQueue?.length || 0} videos to extension!`,
          },
          '*'
        );

        // Notify background script
        chrome.runtime.sendMessage({
          type: 'LOG',
          message: `Queue synced from custom app: ${videoQueue?.length || 0} videos`,
          level: 'success',
        });

        // Also send a status update that the popup can display
        chrome.runtime.sendMessage({
          type: 'STATUS_UPDATE',
          message: `Queue ready: ${videoQueue?.length || 0} videos from AI Library`,
        });
      }
    );

    return;
  }

  // Handle START_AUTOMATION from the custom app
  if (event.data?.type === 'START_AUTOMATION') {
    console.log('[AI Video Suite] Automation start requested from custom app');

    chrome.runtime.sendMessage({
      type: 'START_AUTOMATION',
      source: 'customApp',
    });

    return;
  }

  // Handle PAUSE_AUTOMATION from the custom app
  if (event.data?.type === 'PAUSE_AUTOMATION') {
    chrome.runtime.sendMessage({
      type: 'PAUSE_AUTOMATION',
    });
    return;
  }

  // Handle STOP_AUTOMATION from the custom app
  if (event.data?.type === 'STOP_AUTOMATION') {
    chrome.runtime.sendMessage({
      type: 'STOP_AUTOMATION',
    });
    return;
  }
});

// Listen for messages FROM the extension (to send to the app)
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[AI Video Suite] Iframe received message from extension:', message.type);

  // Forward status updates to the custom app
  if (
    message.type === 'STATUS_UPDATE' ||
    message.type === 'PROGRESS_UPDATE' ||
    message.type === 'LOG' ||
    message.type === 'AUTOMATION_COMPLETE' ||
    message.type === 'AUTOMATION_ERROR'
  ) {
    window.postMessage(
      {
        type: 'FROM_EXTENSION',
        originalType: message.type,
        data: message,
      },
      '*'
    );

    sendResponse({ received: true });
    return true;
  }

  return false;
});

// Inject a page script to set the extension flag and provide helper functions
// ALWAYS inject this, not just for detected custom apps
// NOTE: Uses postMessage instead of inline script to comply with CSP
const signalExtensionReady = () => {
  // Send EXTENSION_READY message that the app can listen for
  // This is CSP-compliant since we're using postMessage, not inline scripts
  window.postMessage(
    {
      type: 'EXTENSION_READY',
      connected: true,
      extensionName: 'AI Video Intelligence Suite',
      capabilities: ['sync', 'automation', 'status_updates'],
    },
    '*'
  );

  window.postMessage(
    {
      type: 'EXTENSION_BRIDGE_READY',
      connected: true,
    },
    '*'
  );

  console.log('[AI Video Suite] Extension ready signal sent via postMessage');
};

// Respond to connection check requests
window.addEventListener('message', (event) => {
  if (event.source !== window) return;

  if (event.data?.type === 'CHECK_EXTENSION_CONNECTION') {
    window.postMessage(
      {
        type: 'EXTENSION_CONNECTION_STATUS',
        connected: true,
        extensionName: 'AI Video Intelligence Suite',
      },
      '*'
    );
  }
});

// ALWAYS signal extension ready - don't wait for custom app detection
console.log(
  '[AI Video Suite] Iframe Bridge: Signaling extension ready to',
  window.location.hostname
);
signalExtensionReady();

// Signal again after a short delay to catch late-loading apps
setTimeout(signalExtensionReady, 500);
setTimeout(signalExtensionReady, 1500);

// Also listen for the original app's sync attempts and relay them to window.top
document.addEventListener(
  'click',
  (e) => {
    const target = e.target;
    const buttonText = target.textContent?.toLowerCase() || '';

    // If user clicks a button with "sync" and "extension" in the text
    if (buttonText.includes('sync') && buttonText.includes('extension')) {
      console.log('[AI Video Suite] Sync button click detected, ensuring bridge is active');

      // Signal extension ready again
      signalExtensionReady();
    }
  },
  true
);

console.log('[AI Video Suite] Iframe Bridge: Initialization complete on', window.location.hostname);

/******/ })()
;
//# sourceMappingURL=iframe-bridge.js.map