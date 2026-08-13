/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
// NotebookLM Content Script
// Handles interactions with NotebookLM pages

console.log('📓 NotebookLM content script loaded');

// Listen for messages from background script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('NotebookLM received message:', message.type);

  switch (message.type) {
    case 'NOTEBOOKLM_ADD_SOURCE':
      addSource(message.data).then(sendResponse);
      return true;

    case 'NOTEBOOKLM_GENERATE_AUDIO':
      generateAudioOverview().then(sendResponse);
      return true;

    case 'NOTEBOOKLM_DOWNLOAD_AUDIO':
      downloadAudio().then(sendResponse);
      return true;

    case 'NOTEBOOKLM_GET_STATUS':
      getStatus().then(sendResponse);
      return true;
  }
});

// Add source to NotebookLM
async function addSource(data) {
  try {
    const { content, title, type = 'text' } = data;

    // Click "Add source" button
    const addButton = findButton('Add source', '[aria-label*="Add source"]');
    if (!addButton) {
      throw new Error('Add source button not found');
    }

    addButton.click();
    await sleep(500);

    // Select source type
    if (type === 'text') {
      const pasteOption = findButton('Paste text', '[aria-label*="Paste text"]');
      if (pasteOption) {
        pasteOption.click();
        await sleep(500);
      }

      // Paste content
      const textarea = document.querySelector('textarea');
      if (textarea) {
        textarea.value = content;
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(500);
      }
    } else if (type === 'url') {
      const urlOption = findButton('Website URL', '[aria-label*="Website"]');
      if (urlOption) {
        urlOption.click();
        await sleep(500);
      }

      // Enter URL
      const urlInput =
        document.querySelector('input[type="url"]') ||
        document.querySelector('input[placeholder*="URL"]');
      if (urlInput) {
        urlInput.value = content;
        urlInput.dispatchEvent(new Event('input', { bubbles: true }));
        await sleep(500);
      }
    }

    // Set title if provided
    if (title) {
      const titleInput = document.querySelector('input[placeholder*="title"]');
      if (titleInput) {
        titleInput.value = title;
        titleInput.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Click Add/Import button
    const importButton =
      findButton('Add', '[aria-label*="Add"]') || findButton('Import', '[aria-label*="Import"]');
    if (importButton) {
      importButton.click();
      await sleep(2000); // Wait for import
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to add source:', error);
    return { success: false, error: error.message };
  }
}

// Generate audio overview
async function generateAudioOverview() {
  try {
    // Click "Audio overview" button
    const audioButton = findButton('Audio overview', '[aria-label*="Audio overview"]');
    if (!audioButton) {
      throw new Error('Audio overview button not found');
    }

    audioButton.click();
    await sleep(1000);

    // Click "Generate" button
    const generateButton = findButton('Generate', '[aria-label*="Generate"]');
    if (generateButton) {
      generateButton.click();
    }

    // Wait for generation to start
    await sleep(2000);

    return { success: true, generating: true };
  } catch (error) {
    console.error('Failed to generate audio:', error);
    return { success: false, error: error.message };
  }
}

// Download audio
async function downloadAudio() {
  try {
    // Find download button
    const downloadButton =
      findButton('Download', '[aria-label*="Download"]') || document.querySelector('a[download]');

    if (!downloadButton) {
      throw new Error('Download button not found');
    }

    downloadButton.click();
    await sleep(1000);

    return { success: true };
  } catch (error) {
    console.error('Failed to download audio:', error);
    return { success: false, error: error.message };
  }
}

// Get current status
async function getStatus() {
  try {
    const status = {
      hasAudioPlayer: !!document.querySelector('audio'),
      isGenerating: !!findElement('Generating', '[aria-label*="Generating"]'),
      hasDownloadButton: !!findButton('Download', '[aria-label*="Download"]'),
      sourceCount: document.querySelectorAll('[data-source-id]').length,
    };

    return { success: true, status };
  } catch (error) {
    console.error('Failed to get status:', error);
    return { success: false, error: error.message };
  }
}

// Utility: Find button by text or selector
function findButton(text, selector) {
  // Try selector first
  if (selector) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  // Try finding by text
  const buttons = Array.from(document.querySelectorAll('button'));
  return buttons.find((btn) => btn.textContent.trim().toLowerCase().includes(text.toLowerCase()));
}

// Utility: Find element
function findElement(text, selector) {
  if (selector) {
    const element = document.querySelector(selector);
    if (element) return element;
  }

  const elements = Array.from(document.querySelectorAll('*'));
  return elements.find((el) => el.textContent.trim().toLowerCase().includes(text.toLowerCase()));
}

// Utility: Sleep
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Monitor for audio generation completion
let audioGenerationObserver = null;

function startAudioGenerationMonitor() {
  if (audioGenerationObserver) return;

  audioGenerationObserver = new MutationObserver((mutations) => {
    // Check if audio player appeared
    const audioPlayer = document.querySelector('audio');
    if (audioPlayer) {
      chrome.runtime.sendMessage({
        type: 'NOTEBOOKLM_AUDIO_READY',
        data: { ready: true },
      });

      stopAudioGenerationMonitor();
    }
  });

  audioGenerationObserver.observe(document.body, {
    childList: true,
    subtree: true,
  });
}

function stopAudioGenerationMonitor() {
  if (audioGenerationObserver) {
    audioGenerationObserver.disconnect();
    audioGenerationObserver = null;
  }
}

// Auto-start monitoring if on NotebookLM page
if (window.location.hostname === 'notebooklm.google.com') {
  console.log('✅ NotebookLM page detected, ready for automation');
}

console.log('✅ NotebookLM content script ready');

/******/ })()
;
//# sourceMappingURL=notebooklm-integration.js.map