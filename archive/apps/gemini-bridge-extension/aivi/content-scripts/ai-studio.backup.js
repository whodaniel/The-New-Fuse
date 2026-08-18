// Content script for automating Google AI Studio
// FIXED VERSION: Added safeguards for chrome API availability

console.log('AI Studio Automator: Content script loaded on', window.location.href);

// ============================================
// SAFEGUARD: Check if chrome API is available
// ============================================
const chromeAvailable = typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id;

if (!chromeAvailable) {
  console.log('[Automator] Chrome extension context not available, script will not run.');
  // Exit early if not in proper extension context
} else {
  // ============================================
  // CONFIGURATION
  // ============================================
  const MAX_SEGMENT_DURATION = 45 * 60; // 45 minutes in seconds
  const PROMPT_TEMPLATE = `Extract all key points of information from this video. Focus specifically on AI-related concepts, technical innovations, and implementation details. Provide a dense, structured bulleted list of the provided key information in a downloadable .md format.`;

  // ============================================
  // UTILITY FUNCTIONS
  // ============================================
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function safeSendMessage(message) {
    if (!chromeAvailable) return;
    try {
      chrome.runtime.sendMessage(message).catch(() => {});
    } catch (e) {
      console.log('[Automator] Could not send message (context may be invalid)');
    }
  }

  function sendLog(message, level = 'info') {
    console.log(`[Automator] ${message}`);
    safeSendMessage({ type: 'LOG', message, level });
  }

  function sendProgress(current, total, videoTitle) {
    safeSendMessage({
      type: 'PROGRESS_UPDATE',
      current,
      total,
      videoTitle,
    });
  }

  async function clickElement(element, description = '') {
    sendLog(`Clicking: ${description || element.tagName}`, 'info');
    element.click();
    await sleep(500);
  }

  async function typeText(element, text) {
    element.value = text;
    element.dispatchEvent(new Event('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));
    await sleep(300);
  }

  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0 && secs > 0) return `${mins}m${secs}s`;
    if (mins > 0) return `${mins}m`;
    return `${secs}s`;
  }

  // ============================================
  // PHASE 1: GET VIDEO DURATION
  // ============================================

  async function getVideoDuration(url) {
    sendLog(`Getting duration for: ${url}`, 'info');

    if (!window.location.href.includes('new_chat') && !window.location.href.includes('prompts/')) {
      sendLog('Not on a chat page, cannot get duration', 'error');
      return null;
    }

    await sleep(2000);

    const textareas = document.querySelectorAll('textarea');
    let promptArea = Array.from(textareas).find(
      (ta) =>
        ta.placeholder?.toLowerCase().includes('type') ||
        ta.placeholder?.toLowerCase().includes('prompt')
    );
    if (!promptArea && textareas.length > 0) promptArea = textareas[0];

    if (!promptArea) {
      sendLog('Could not find prompt input for duration check', 'error');
      return null;
    }

    const query = `What is the duration of this YouTube video? ${url}\n\nPlease respond with just the duration in the format "X hours Y minutes" or "Y minutes" or "Y minutes Z seconds".`;
    await typeText(promptArea, query);
    await sleep(500);

    const runBtn =
      document.querySelector('button[aria-label*="Run" i]') ||
      Array.from(document.querySelectorAll('button')).find((b) =>
        b.textContent?.toLowerCase().includes('run')
      );

    if (!runBtn) {
      sendLog('Run button not found for duration check', 'error');
      return null;
    }

    await clickElement(runBtn, 'Run button');
    await sleep(8000);

    const responseText = document.body.innerText;
    const durationMatch =
      responseText.match(/(\d+)\s*hours?\s*(\d+)?\s*minutes?/i) ||
      responseText.match(/(\d+)\s*minutes?\s*(\d+)?\s*seconds?/i) ||
      responseText.match(/(\d+):(\d+):(\d+)/) ||
      responseText.match(/(\d+):(\d+)/);

    if (durationMatch) {
      let totalSeconds = 0;

      if (durationMatch[0].includes('hour')) {
        const hours = parseInt(durationMatch[1]) || 0;
        const mins = parseInt(durationMatch[2]) || 0;
        totalSeconds = (hours * 60 + mins) * 60;
      } else if (durationMatch[0].includes('minute')) {
        const mins = parseInt(durationMatch[1]) || 0;
        const secs = parseInt(durationMatch[2]) || 0;
        totalSeconds = mins * 60 + secs;
      } else if (durationMatch.length === 4) {
        totalSeconds =
          parseInt(durationMatch[1]) * 3600 +
          parseInt(durationMatch[2]) * 60 +
          parseInt(durationMatch[3]);
      } else if (durationMatch.length === 3) {
        totalSeconds = parseInt(durationMatch[1]) * 60 + parseInt(durationMatch[2]);
      }

      sendLog(`Detected duration: ${Math.floor(totalSeconds / 60)} minutes`, 'success');
      return totalSeconds;
    }

    sendLog('Could not parse duration from response', 'warning');
    return null;
  }

  // ============================================
  // PHASE 2: ADD VIDEO TO CHAT
  // ============================================

  async function addYouTubeVideo(url, startTime = 0, endTime = null) {
    sendLog(
      `Adding video: ${url} (${formatTime(startTime)} - ${endTime ? formatTime(endTime) : 'end'})`,
      'info'
    );

    await sleep(1500);

    let insertBtn = document.querySelector(
      'button[aria-label="Insert images, videos, audio, or files"]'
    );
    if (!insertBtn) {
      const buttons = Array.from(document.querySelectorAll('button'));
      insertBtn = buttons.find(
        (b) =>
          b.querySelector('span')?.textContent?.includes('note_add') ||
          b.textContent.includes('note_add')
      );
    }

    if (!insertBtn) {
      throw new Error('Insert button not found');
    }

    await clickElement(insertBtn, 'Insert button');
    await sleep(1200);

    const menuItems = Array.from(document.querySelectorAll('button'));
    const ytBtn = menuItems.find((el) => el.textContent?.includes('YouTube Video'));
    if (!ytBtn) {
      throw new Error('YouTube Video option not found');
    }

    await clickElement(ytBtn, 'YouTube Video option');
    await sleep(1500);

    let dialog = null;
    for (let i = 0; i < 15; i++) {
      dialog = document.querySelector('mat-dialog-container, [role="dialog"]');
      if (dialog) break;
      await sleep(300);
    }

    if (!dialog) {
      throw new Error('Video settings dialog not found');
    }

    const inputs = dialog.querySelectorAll('input');
    if (inputs.length < 1) {
      throw new Error('No inputs found in dialog');
    }

    await typeText(inputs[0], url);

    if (inputs.length >= 2 && startTime > 0) {
      await typeText(inputs[1], formatTime(startTime));
    }

    if (inputs.length >= 3 && endTime) {
      await typeText(inputs[2], formatTime(endTime));
    }

    await sleep(500);

    const dialogButtons = Array.from(dialog.querySelectorAll('button'));
    const saveBtn = dialogButtons.find((b) => b.textContent?.toLowerCase().includes('save'));
    if (!saveBtn) {
      throw new Error('Save button not found');
    }

    await clickElement(saveBtn, 'Save button');
    await sleep(3000);

    sendLog('Video added successfully', 'success');
  }

  // ============================================
  // PHASE 3: RUN ANALYSIS
  // ============================================

  async function runAnalysis() {
    sendLog('Adding prompt and running analysis...', 'info');

    const textareas = document.querySelectorAll('textarea');
    let promptArea = Array.from(textareas).find(
      (ta) =>
        ta.placeholder?.toLowerCase().includes('type') ||
        ta.placeholder?.toLowerCase().includes('prompt')
    );
    if (!promptArea && textareas.length > 0) promptArea = textareas[0];
    if (!promptArea) {
      promptArea = document.querySelector('div[contenteditable="true"]');
    }

    if (!promptArea) {
      throw new Error('Prompt input not found');
    }

    await typeText(promptArea, PROMPT_TEMPLATE);
    await sleep(800);

    let runBtn = document.querySelector('button[aria-label*="Run" i]');
    if (!runBtn) {
      const buttons = Array.from(document.querySelectorAll('button'));
      runBtn = buttons.find(
        (b) =>
          b.textContent?.toLowerCase().includes('run') ||
          b.getAttribute('aria-label')?.toLowerCase().includes('run')
      );
    }

    if (!runBtn) {
      throw new Error('Run button not found');
    }

    await clickElement(runBtn, 'Run button');
    sendLog('Analysis started...', 'info');
  }

  // ============================================
  // PHASE 4: WAIT FOR COMPLETION
  // ============================================

  async function waitForCompletion(timeout = 600000) {
    sendLog('Waiting for AI to complete processing...', 'info');

    return new Promise((resolve) => {
      const startTime = Date.now();
      let lastLogTime = startTime;

      const checkComplete = setInterval(() => {
        const now = Date.now();

        if (now - lastLogTime > 30000) {
          const elapsed = Math.floor((now - startTime) / 1000);
          sendLog(`Still processing... (${elapsed}s elapsed)`, 'info');
          lastLogTime = now;
        }

        const buttons = document.querySelectorAll('button');

        const hasCopyBtn = Array.from(buttons).some((b) => {
          const aria = b.getAttribute('aria-label')?.toLowerCase() || '';
          return aria.includes('copy') && !aria.includes('cancel');
        });

        const responseDiv = document.querySelector(
          'ms-gemini-response, [class*="response"], .markdown-body'
        );
        const hasSubstantialContent = responseDiv && responseDiv.textContent?.length > 500;

        const runBtn = Array.from(buttons).find((b) =>
          b.getAttribute('aria-label')?.toLowerCase().includes('run')
        );
        const runEnabled = runBtn && !runBtn.disabled && !runBtn.classList.contains('disabled');

        if ((hasCopyBtn && hasSubstantialContent) || (runEnabled && hasSubstantialContent)) {
          clearInterval(checkComplete);
          sendLog('Processing complete!', 'success');
          resolve({ complete: true });
        }

        if (now - startTime > timeout) {
          clearInterval(checkComplete);
          sendLog('Timeout waiting for completion (10 min)', 'warning');
          resolve({ timeout: true });
        }
      }, 3000);
    });
  }

  // ============================================
  // PHASE 5: DOWNLOAD REPORT
  // ============================================

  async function downloadReport(videoId, segmentIndex = 0) {
    sendLog('Attempting to download report...', 'info');

    const buttons = Array.from(document.querySelectorAll('button'));

    const downloadBtn = buttons.find((b) =>
      b.getAttribute('aria-label')?.toLowerCase().includes('download')
    );

    if (downloadBtn) {
      await clickElement(downloadBtn, 'Download button');
      sendLog('Report downloaded', 'success');
      return true;
    }

    const copyBtn = buttons.find((b) => {
      const aria = b.getAttribute('aria-label')?.toLowerCase() || '';
      return aria.includes('copy') && !aria.includes('cancel');
    });

    if (copyBtn) {
      await clickElement(copyBtn, 'Copy button');
      await sleep(500);

      try {
        const text = await navigator.clipboard.readText();
        if (text && text.length > 100) {
          const blob = new Blob([text], { type: 'text/markdown' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `Report_${videoId}_Segment${segmentIndex}_${Date.now()}.md`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          sendLog('Report saved as markdown file', 'success');
          return true;
        }
      } catch (e) {
        sendLog('Could not auto-save report from clipboard', 'warning');
      }
    }

    return false;
  }

  // ============================================
  // MAIN: PROCESS SINGLE TASK
  // ============================================

  async function processTask(task) {
    const { type, url, title, startTime, endTime, videoId, segmentIndex } = task;

    sendLog(`\n=== Processing Task: ${type} ===`, 'info');

    try {
      switch (type) {
        case 'GET_DURATION':
          const duration = await getVideoDuration(url);
          safeSendMessage({
            type: 'TASK_COMPLETE',
            taskType: 'GET_DURATION',
            url: url,
            duration: duration,
          });
          break;

        case 'PROCESS_SEGMENT':
          await addYouTubeVideo(url, startTime || 0, endTime);
          await runAnalysis();
          const result = await waitForCompletion();

          if (result.complete) {
            await downloadReport(videoId, segmentIndex);
          }

          safeSendMessage({
            type: 'TASK_COMPLETE',
            taskType: 'PROCESS_SEGMENT',
            url: url,
            segmentIndex: segmentIndex,
            success: result.complete,
          });
          break;

        default:
          sendLog(`Unknown task type: ${type}`, 'error');
      }
    } catch (error) {
      sendLog(`Task error: ${error.message}`, 'error');
      safeSendMessage({
        type: 'TASK_ERROR',
        taskType: type,
        url: url,
        error: error.message,
      });
    }
  }

  // ============================================
  // MESSAGE HANDLER (only if chrome is available)
  // ============================================

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log('[Automator] Received message:', message.action || message.type);

    if (message.action === 'EXECUTE_TASK') {
      processTask(message.task);
      sendResponse({ accepted: true });
    } else if (message.action === 'PING') {
      sendResponse({ alive: true, url: window.location.href });
    } else if (message.action === 'GET_PAGE_STATE') {
      const insertBtn = document.querySelector(
        'button[aria-label="Insert images, videos, audio, or files"]'
      );
      const isReady = !!insertBtn;
      sendResponse({ ready: isReady, url: window.location.href });
    }

    return true;
  });

  // ============================================
  // INITIALIZATION
  // ============================================

  function init() {
    sendLog('Content script ready on: ' + window.location.href, 'success');

    setTimeout(() => {
      safeSendMessage({
        type: 'CONTENT_SCRIPT_READY',
        url: window.location.href,
      });
    }, 1000);
  }

  // Cross-origin message listener (for custom app sync)
  window.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_TO_EXTENSION') {
      const data = event.data.data || event.data;
      const { videoQueue, reverseOrder, segmentDuration } = data;

      if (videoQueue && Array.isArray(videoQueue)) {
        try {
          chrome.storage.local.set({
            videoQueue: videoQueue,
            reverseOrder: reverseOrder || false,
            segmentDuration: segmentDuration || 45,
            syncTimestamp: Date.now(),
          });

          sendLog(`Queue synced: ${videoQueue.length} videos`, 'success');

          if (event.source) {
            event.source.postMessage(
              {
                type: 'EXTENSION_SYNC_CONFIRMED',
                success: true,
                count: videoQueue.length,
              },
              '*'
            );
          }
        } catch (e) {
          console.log('[Automator] Could not sync queue:', e);
        }
      }
    }
  });

  init();
} // End of chromeAvailable check
