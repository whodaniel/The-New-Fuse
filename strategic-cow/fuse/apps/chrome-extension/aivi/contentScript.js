// Content script for automating Google AI Studio
console.log('AI Studio Automator: Content script loaded');

// Selectors for AI Studio elements
const SELECTORS = {
  ADD_BUTTON:
    'button[aria-label*="Add"], button[aria-label*="add"], span.material-symbols-outlined',
  YT_OPTION: 'span, button, div',
  URL_INPUT: 'input[type="text"]',
  TIME_INPUT: 'input[type="text"], input[type="number"]',
  SAVE_BUTTON: 'button',
  PROMPT_AREA: 'textarea, div[contenteditable="true"]',
  RUN_BUTTON: 'button[aria-label*="Run"], button[aria-label*="run"]',
  COPY_BUTTON: 'button[aria-label*="Copy"], button[aria-label*="copy"]',
};

// Automation state
let automationState = {
  isRunning: false,
  isPaused: false,
  currentQueue: [],
  currentIndex: 0,
  segmentDuration: 45 * 60, // 45 minutes in seconds
  currentVideo: null,
};

// Prompt template
const PROMPT_TEMPLATE = `Extract all key points of information from this video. Focus specifically on AI-related concepts, technical innovations, and implementation details. Provide a dense, structured bulleted list of the provided key information in a downloadable .md format.`;

// Utility: Wait for element
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkElement = () => {
      const elements = document.querySelectorAll(selector);

      for (let el of elements) {
        if (el.offsetParent !== null) {
          // Check if visible
          resolve(el);
          return;
        }
      }

      if (Date.now() - startTime > timeout) {
        reject(new Error(`Element ${selector} not found within ${timeout}ms`));
        return;
      }

      setTimeout(checkElement, 100);
    };

    checkElement();
  });
}

// Utility: Click element
async function clickElement(element, description = '') {
  return new Promise((resolve) => {
    sendLog(`Clicking: ${description || element.tagName}`, 'info');
    element.click();
    setTimeout(resolve, 500);
  });
}

// Utility: Type text
async function typeText(element, text) {
  element.value = text;
  element.dispatchEvent(new Event('input', { bubbles: true }));
  element.dispatchEvent(new Event('change', { bubbles: true }));
  await sleep(300);
}

// Utility: Sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Send log to popup
function sendLog(message, level = 'info') {
  console.log(`[Automator] ${message}`);
  chrome.runtime.sendMessage({
    type: 'LOG',
    message: message,
    level: level,
  });
}

// Send status update
function sendStatus(message) {
  chrome.runtime.sendMessage({
    type: 'STATUS_UPDATE',
    message: message,
  });
}

// Send progress update
function sendProgress(current, total, videoUrl) {
  chrome.runtime.sendMessage({
    type: 'PROGRESS_UPDATE',
    current: current,
    total: total,
    videoUrl: videoUrl,
  });
}

// Main automation function for a single video segment
async function automateSegment(url, startTime = 0, endTime = null) {
  try {
    sendLog(
      `Processing segment: ${url} (${startTime}s - ${endTime ? endTime + 's' : 'end'})`,
      'info'
    );

    // Step 1: Click Add button
    sendLog('Looking for Add button...', 'info');
    await sleep(1000);

    // Find the add button (look for material icon or button)
    const addButtons = Array.from(document.querySelectorAll('button, span'));
    const addButton = addButtons.find(
      (el) =>
        el.textContent.includes('note_add') ||
        el.textContent.includes('add') ||
        el.getAttribute('aria-label')?.toLowerCase().includes('add')
    );

    if (!addButton) {
      throw new Error('Add button not found');
    }

    await clickElement(addButton, 'Add button');
    await sleep(1200);

    // Step 2: Select YouTube Video option
    sendLog('Looking for YouTube Video option...', 'info');
    const ytButtons = Array.from(document.querySelectorAll('span, button, div'));
    const ytButton = ytButtons.find(
      (el) => el.textContent.trim() === 'YouTube Video' || el.textContent.includes('YouTube')
    );

    if (!ytButton) {
      throw new Error('YouTube Video option not found');
    }

    await clickElement(ytButton, 'YouTube Video option');
    await sleep(1500);

    // Step 3: Fill in the modal
    sendLog('Filling in video details...', 'info');
    const inputs = document.querySelectorAll('mat-dialog-container input, [role="dialog"] input');

    if (inputs.length < 1) {
      throw new Error('Modal inputs not found');
    }

    // Fill URL
    await typeText(inputs[0], url);

    // Fill start time if available
    if (inputs.length >= 2 && startTime > 0) {
      await typeText(inputs[1], `${startTime}s`);
    }

    // Fill end time if available
    if (inputs.length >= 3 && endTime) {
      await typeText(inputs[2], `${endTime}s`);
    }

    await sleep(500);

    // Step 4: Click Save
    sendLog('Saving video...', 'info');
    const buttons = Array.from(
      document.querySelectorAll('mat-dialog-container button, [role="dialog"] button')
    );
    const saveButton = buttons.find(
      (b) =>
        b.textContent.trim().toLowerCase().includes('save') ||
        b.textContent.trim().toLowerCase().includes('add')
    );

    if (!saveButton) {
      throw new Error('Save button not found');
    }

    await clickElement(saveButton, 'Save button');
    await sleep(2500);

    // Step 5: Add prompt
    sendLog('Adding prompt...', 'info');
    const textAreas = document.querySelectorAll('textarea');
    const promptArea = Array.from(textAreas).find(
      (ta) =>
        ta.placeholder?.toLowerCase().includes('type') ||
        ta.placeholder?.toLowerCase().includes('prompt')
    );

    if (!promptArea) {
      throw new Error('Prompt textarea not found');
    }

    await typeText(promptArea, PROMPT_TEMPLATE);
    await sleep(800);

    // Step 6: Click Run
    sendLog('Running analysis...', 'info');
    const runButtons = Array.from(document.querySelectorAll('button'));
    const runButton = runButtons.find(
      (b) =>
        b.getAttribute('aria-label')?.toLowerCase().includes('run') ||
        b.textContent.toLowerCase().includes('run')
    );

    if (!runButton) {
      throw new Error('Run button not found');
    }

    await clickElement(runButton, 'Run button');

    // Wait for completion
    await waitForCompletion();

    sendLog('Segment completed successfully', 'success');
  } catch (error) {
    sendLog(`Error in segment automation: ${error.message}`, 'error');
    throw error;
  }
}

// Wait for AI Studio to complete processing using MutationObserver
async function waitForCompletion() {
  sendLog('Waiting for AI to complete...', 'info');

  return new Promise((resolve, reject) => {
    const timeout = 600000; // 10 minutes max wait
    const startTime = Date.now();

    // Create a MutationObserver to watch for completion indicators
    const observer = new MutationObserver((mutations) => {
      // Check for copy button or download button
      const copyButtons = document.querySelectorAll('button');
      const hasCopyButton = Array.from(copyButtons).some((b) => {
        const ariaLabel = b.getAttribute('aria-label')?.toLowerCase() || '';
        const text = b.textContent.toLowerCase();
        return (
          ariaLabel.includes('copy') ||
          ariaLabel.includes('download') ||
          text.includes('copy') ||
          text.includes('download') ||
          b.querySelector('[data-icon="content_copy"]') !== null
        );
      });

      // Check if run button is re-enabled
      const runButtons = Array.from(document.querySelectorAll('button'));
      const runButton = runButtons.find((b) =>
        b.getAttribute('aria-label')?.toLowerCase().includes('run')
      );
      const runEnabled =
        runButton && !runButton.disabled && !runButton.classList.contains('disabled');

      if (hasCopyButton || runEnabled) {
        observer.disconnect();
        sendLog('AI processing complete - completion indicator detected', 'success');
        resolve({ hasCopyButton, runEnabled });
      }

      // Timeout check
      if (Date.now() - startTime > timeout) {
        observer.disconnect();
        sendLog('Timeout waiting for completion (10 min)', 'warning');
        resolve({ timeout: true });
      }
    });

    // Start observing the document for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['disabled', 'aria-disabled', 'class'],
    });

    // Also do periodic checks as backup
    const intervalCheck = setInterval(() => {
      if (Date.now() - startTime > timeout) {
        clearInterval(intervalCheck);
        observer.disconnect();
        sendLog('Timeout waiting for completion', 'warning');
        resolve({ timeout: true });
      }
    }, 5000);
  });
}

// Attempt to download the generated report
async function downloadReport(videoId, segmentIndex = 0) {
  try {
    sendLog('Attempting to download report...', 'info');

    // Look for download/copy button
    const buttons = Array.from(document.querySelectorAll('button'));
    const downloadBtn = buttons.find((b) => {
      const ariaLabel = b.getAttribute('aria-label')?.toLowerCase() || '';
      const text = b.textContent.toLowerCase();
      return ariaLabel.includes('download') || text.includes('download');
    });

    const copyBtn = buttons.find((b) => {
      const ariaLabel = b.getAttribute('aria-label')?.toLowerCase() || '';
      return ariaLabel.includes('copy') || b.querySelector('[data-icon="content_copy"]');
    });

    if (downloadBtn) {
      await clickElement(downloadBtn, 'Download button');
      sendLog(`Report downloaded for video ${videoId}`, 'success');
      return true;
    } else if (copyBtn) {
      await clickElement(copyBtn, 'Copy button');
      sendLog(`Report copied to clipboard for video ${videoId}`, 'success');

      // Try to trigger download via clipboard content
      try {
        const clipboardText = await navigator.clipboard.readText();
        const blob = new Blob([clipboardText], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Report_${videoId}_Segment${segmentIndex}.md`;
        a.click();
        URL.revokeObjectURL(url);
        sendLog(`Auto-saved as Report_${videoId}_Segment${segmentIndex}.md`, 'success');
      } catch (clipError) {
        sendLog('Could not auto-save from clipboard', 'warning');
      }

      return true;
    }

    sendLog('No download/copy button found', 'warning');
    return false;
  } catch (error) {
    sendLog(`Download error: ${error.message}`, 'error');
    return false;
  }
}

// Process a single video (potentially in multiple segments) with retry logic
async function processVideo(videoData, retryCount = 0) {
  const { url, id } = videoData;
  const maxRetries = 3;

  automationState.currentVideo = videoData;

  sendLog(
    `Starting video ${id || 'unknown'}: ${url} (Attempt ${retryCount + 1}/${maxRetries + 1})`,
    'info'
  );
  sendStatus(`Processing video ${id || 'unknown'}`);

  try {
    // For now, process the entire video in one go
    // TODO: Add duration detection and segmentation
    await automateSegment(url, 0, null);

    // Wait a bit for UI to stabilize
    await sleep(2000);

    // Try to download the report
    await downloadReport(id, 0);

    sendLog(`Completed video ${id || 'unknown'}`, 'success');
    return true;
  } catch (error) {
    sendLog(`Error processing video ${id}: ${error.message}`, 'error');

    // Retry logic with exponential backoff
    if (retryCount < maxRetries) {
      const waitTime = Math.pow(2, retryCount) * 2000; // 2s, 4s, 8s
      sendLog(`Retrying in ${waitTime / 1000} seconds...`, 'warning');
      await sleep(waitTime);

      return await processVideo(videoData, retryCount + 1);
    } else {
      sendLog(`Failed after ${maxRetries + 1} attempts`, 'error');

      // Ask user if they want to continue
      const shouldContinue = confirm(
        `Video ${id || 'unknown'} failed after ${maxRetries + 1} attempts:\n${error.message}\n\n` +
          `Continue with next video?`
      );

      if (!shouldContinue) {
        throw new Error('User cancelled automation');
      }

      return false;
    }
  }
}

// Main automation loop
async function runAutomation() {
  sendLog('Starting automation loop', 'info');

  while (automationState.currentIndex < automationState.currentQueue.length) {
    if (!automationState.isRunning) {
      sendLog('Automation stopped', 'warning');
      break;
    }

    while (automationState.isPaused) {
      await sleep(1000);
    }

    const video = automationState.currentQueue[automationState.currentIndex];

    try {
      sendProgress(
        automationState.currentIndex + 1,
        automationState.currentQueue.length,
        video.url
      );

      const success = await processVideo(video);

      if (success) {
        sendLog(`✓ Video ${video.id} processed successfully`, 'success');
      } else {
        sendLog(`⚠ Video ${video.id} skipped after retries`, 'warning');
      }

      automationState.currentIndex++;

      // Wait between videos to avoid rate limiting
      sendLog('Waiting 3 seconds before next video...', 'info');
      await sleep(3000);
    } catch (error) {
      sendLog(`Fatal error: ${error.message}`, 'error');
      automationState.isRunning = false;
      chrome.runtime.sendMessage({
        type: 'AUTOMATION_ERROR',
        error: error.message,
      });
      break;
    }
  }

  if (automationState.currentIndex >= automationState.currentQueue.length) {
    sendLog('🎉 All videos processed!', 'success');
    chrome.runtime.sendMessage({ type: 'AUTOMATION_COMPLETE' });
  }

  automationState.isRunning = false;
}

// Message listener
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'START_AUTOMATION') {
    const { queue, reverseOrder, segmentDuration } = message.data;

    automationState.currentQueue = reverseOrder ? [...queue].reverse() : queue;
    automationState.segmentDuration = segmentDuration * 60; // Convert to seconds
    automationState.currentIndex = 0;
    automationState.isRunning = true;
    automationState.isPaused = false;

    sendLog(`Queue loaded: ${automationState.currentQueue.length} videos`, 'info');
    runAutomation();
  } else if (message.action === 'PAUSE_AUTOMATION') {
    automationState.isPaused = true;
    sendLog('Automation paused', 'warning');
  } else if (message.action === 'RESUME_AUTOMATION') {
    automationState.isPaused = false;
    sendLog('Automation resumed', 'info');
  } else if (message.action === 'STOP_AUTOMATION') {
    automationState.isRunning = false;
    automationState.isPaused = false;
    sendLog('Automation stopped', 'error');
  }

  sendResponse({ success: true });
});

// Listen for messages from url-extractor.html
window.addEventListener('message', (event) => {
  if (event.data.type === 'SYNC_TO_EXTENSION') {
    const { videoQueue, reverseOrder, segmentDuration } = event.data.data;

    chrome.storage.local.set({
      videoQueue: videoQueue,
      reverseOrder: reverseOrder,
      segmentDuration: segmentDuration,
    });

    sendLog(`Queue synced from URL extractor: ${videoQueue.length} videos`, 'success');
  }
});

sendLog('Content script initialized and ready', 'success');
