// NotebookLM Integration Service
// Bulk import reports, generate audio overviews, create podcasts

class NotebookLMService {
  constructor() {
    this.notebookLMUrl = 'https://notebooklm.google.com';
    this.maxSourcesPerNotebook = 50; // NotebookLM limit
  }

  // Create a new NotebookLM notebook
  async createNotebook(title, description = '') {
    try {
      // Open NotebookLM in a new tab
      const tab = await chrome.tabs.create({
        url: `${this.notebookLMUrl}/notebook/new`,
        active: false,
      });

      // Wait for page to load
      await this.waitForPageLoad(tab.id);

      // Set notebook title
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (title) => {
          const titleInput = document.querySelector('[placeholder*="Untitled"]');
          if (titleInput) {
            titleInput.value = title;
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [title],
      });

      return {
        success: true,
        tabId: tab.id,
        url: tab.url,
      };
    } catch (error) {
      console.error('Failed to create notebook:', error);
      return { success: false, error: error.message };
    }
  }

  // Bulk import reports to NotebookLM
  async bulkImport(reports, notebookTitle = 'AI Video Analysis') {
    try {
      // Create notebook
      const notebook = await this.createNotebook(notebookTitle);

      if (!notebook.success) {
        throw new Error('Failed to create notebook');
      }

      // Import reports in batches (NotebookLM has limits)
      const batchSize = 10;
      const batches = this.chunkArray(reports, batchSize);

      const results = {
        total: reports.length,
        imported: 0,
        failed: 0,
        batches: batches.length,
      };

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];

        for (const report of batch) {
          const imported = await this.importReport(notebook.tabId, report);

          if (imported.success) {
            results.imported++;
          } else {
            results.failed++;
          }

          // Rate limiting
          await this.sleep(1000);
        }

        // Progress update
        await chrome.runtime.sendMessage({
          type: 'NOTEBOOKLM_PROGRESS',
          data: {
            batch: i + 1,
            total: batches.length,
            imported: results.imported,
          },
        });
      }

      return {
        success: true,
        notebookUrl: notebook.url,
        results,
      };
    } catch (error) {
      console.error('Bulk import failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Import a single report
  async importReport(tabId, report) {
    try {
      // Click "Add source" button
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const addButton =
            document.querySelector('[aria-label*="Add source"]') ||
            document.querySelector('button:has-text("Add source")');
          if (addButton) addButton.click();
        },
      });

      await this.sleep(500);

      // Select "Paste text" option
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const pasteOption =
            document.querySelector('[aria-label*="Paste text"]') ||
            Array.from(document.querySelectorAll('button')).find((btn) =>
              btn.textContent.includes('Paste text')
            );
          if (pasteOption) pasteOption.click();
        },
      });

      await this.sleep(500);

      // Paste report content
      await chrome.scripting.executeScript({
        target: { tabId },
        func: (content) => {
          const textarea = document.querySelector('textarea');
          if (textarea) {
            textarea.value = content;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [report.content],
      });

      await this.sleep(500);

      // Click "Add" or "Import" button
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const addButton =
            document.querySelector('[aria-label*="Add"]') ||
            Array.from(document.querySelectorAll('button')).find(
              (btn) => btn.textContent === 'Add' || btn.textContent === 'Import'
            );
          if (addButton) addButton.click();
        },
      });

      await this.sleep(2000); // Wait for import to complete

      return { success: true };
    } catch (error) {
      console.error('Failed to import report:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate audio overview
  async generateAudioOverview(tabId) {
    try {
      // Click "Audio overview" button
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const audioButton =
            document.querySelector('[aria-label*="Audio overview"]') ||
            Array.from(document.querySelectorAll('button')).find((btn) =>
              btn.textContent.includes('Audio overview')
            );
          if (audioButton) audioButton.click();
        },
      });

      await this.sleep(1000);

      // Click "Generate" button
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const generateButton =
            document.querySelector('[aria-label*="Generate"]') ||
            Array.from(document.querySelectorAll('button')).find(
              (btn) => btn.textContent === 'Generate'
            );
          if (generateButton) generateButton.click();
        },
      });

      // Wait for generation (can take 1-3 minutes)
      const result = await this.waitForAudioGeneration(tabId);

      return result;
    } catch (error) {
      console.error('Failed to generate audio overview:', error);
      return { success: false, error: error.message };
    }
  }

  // Wait for audio generation to complete
  async waitForAudioGeneration(tabId, maxWaitMinutes = 5) {
    const maxAttempts = maxWaitMinutes * 12; // Check every 5 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000);

      const readiness = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const audio = document.querySelector('audio');
          if (audio) {
            const src = audio.currentSrc || audio.src || '';
            const durationSeconds = Number.isFinite(audio.duration)
              ? Math.max(0, Math.round(audio.duration))
              : 0;
            return {
              ready: true,
              audioUrl: src,
              durationSeconds,
            };
          }

          const playButton = document.querySelector('[aria-label*="Play"]');
          if (playButton) {
            return {
              ready: true,
              audioUrl: '',
              durationSeconds: 0,
            };
          }

          return { ready: false };
        },
      });

      const result = readiness[0]?.result;
      if (result?.ready) {
        return {
          success: true,
          ready: true,
          audioUrl: result.audioUrl || '',
          durationSeconds: result.durationSeconds || 0,
          duration: this.formatDuration(result.durationSeconds || 0),
        };
      }

      // Progress update
      await chrome.runtime.sendMessage({
        type: 'AUDIO_GENERATION_PROGRESS',
        data: {
          attempt: i + 1,
          maxAttempts,
          estimatedTime: `${Math.ceil(((maxAttempts - i) * 5) / 60)} minutes remaining`,
        },
      });
    }

    return { success: false, error: 'Audio generation timeout' };
  }

  // Download audio overview
  async downloadAudioOverview(tabId) {
    try {
      // Click download button
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const downloadButton =
            document.querySelector('[aria-label*="Download"]') ||
            Array.from(document.querySelectorAll('button')).find((btn) =>
              btn.textContent.includes('Download')
            );
          if (downloadButton) downloadButton.click();
        },
      });

      await this.sleep(1000);

      return { success: true };
    } catch (error) {
      console.error('Failed to download audio:', error);
      return { success: false, error: error.message };
    }
  }

  // Create podcast from multiple notebooks
  async createPodcast(notebooks, podcastTitle) {
    try {
      const episodes = [];
      const skipped = [];

      for (const notebook of notebooks) {
        // Generate audio for each notebook
        const audio = await this.generateAudioOverview(notebook.tabId);

        if (audio.success && audio.audioUrl) {
          episodes.push({
            title: notebook.title,
            audioUrl: audio.audioUrl,
            duration: audio.duration || this.formatDuration(audio.durationSeconds || 0),
          });
        } else {
          skipped.push({
            title: notebook.title,
            reason: audio.error || 'audio_url_unavailable',
          });
        }
      }

      // Create RSS feed
      const rssFeed = this.generateRSSFeed(podcastTitle, episodes);

      return {
        success: true,
        podcast: {
          title: podcastTitle,
          episodes: episodes.length,
          rssFeed,
        },
        skipped,
      };
    } catch (error) {
      console.error('Failed to create podcast:', error);
      return { success: false, error: error.message };
    }
  }

  // Generate RSS feed for podcast
  generateRSSFeed(title, episodes) {
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
  <channel>
    <title>${this.escapeXml(title)}</title>
    <description>AI Video Analysis Podcast</description>
    <language>en-us</language>
    <itunes:author>AI Video Intelligence Suite</itunes:author>
    <itunes:category text="Technology"/>
    
    ${episodes
      .map(
        (episode, index) => `
    <item>
      <title>${this.escapeXml(episode.title)}</title>
      <description>Episode ${index + 1}</description>
      <enclosure url="${episode.audioUrl}" type="audio/mpeg"/>
      <itunes:duration>${episode.duration}</itunes:duration>
      <pubDate>${new Date().toUTCString()}</pubDate>
    </item>
    `
      )
      .join('\n')}
  </channel>
</rss>`;

    return rss;
  }

  formatDuration(totalSeconds) {
    const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    if (hours > 0) {
      return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  // Utility: Chunk array into batches
  chunkArray(array, size) {
    const chunks = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  // Utility: Wait for page load
  async waitForPageLoad(tabId) {
    return new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId, info) {
        if (updatedTabId === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  }

  // Utility: Sleep
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Utility: Escape XML
  escapeXml(text) {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  // Get NotebookLM notebooks
  async getNotebooks() {
    try {
      // Open NotebookLM
      const tab = await chrome.tabs.create({
        url: this.notebookLMUrl,
        active: false,
      });

      await this.waitForPageLoad(tab.id);

      // Extract notebook list
      const notebooks = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const notebookElements = document.querySelectorAll('[data-notebook-id]');
          return Array.from(notebookElements).map((el) => ({
            id: el.getAttribute('data-notebook-id'),
            title: el.querySelector('[data-notebook-title]')?.textContent || 'Untitled',
            url: el.href,
          }));
        },
      });

      // Close tab
      await chrome.tabs.remove(tab.id);

      return {
        success: true,
        notebooks: notebooks[0]?.result || [],
      };
    } catch (error) {
      console.error('Failed to get notebooks:', error);
      return { success: false, error: error.message };
    }
  }

  // Check if user is authenticated with NotebookLM
  async checkAuthentication() {
    try {
      const tabs = await chrome.tabs.query({
        url: 'https://notebooklm.google.com/*',
      });

      return {
        authenticated: tabs.length > 0,
        hasActiveSession: tabs.length > 0,
      };
    } catch (error) {
      return { authenticated: false, hasActiveSession: false };
    }
  }
}

// Export singleton
const notebookLMService = new NotebookLMService();
export default notebookLMService;
