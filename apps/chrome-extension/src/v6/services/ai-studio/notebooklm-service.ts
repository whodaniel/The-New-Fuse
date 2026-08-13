import { API_URLS } from '../../shared/constants';

interface Notebook {
  tabId: number;
  title: string;
  url?: string;
}

interface BulkImportResult {
  total: number;
  imported: number;
  failed: number;
  batches: number;
}

interface AudioResult {
  success: boolean;
  ready?: boolean;
  audioUrl?: string;
  durationSeconds?: number;
  duration?: string;
  error?: string;
}

interface PodcastEpisode {
  title: string;
  audioUrl: string;
  duration: string;
}

interface PodcastResult {
  success: boolean;
  podcast?: { title: string; episodes: number; rssFeed: string };
  skipped?: Array<{ title: string; reason: string }>;
  error?: string;
}

class NotebookLMService {
  private notebookLMUrl = API_URLS.notebookLM;
  private maxSourcesPerNotebook = 50;

  async createNotebook(title: string, _description = ''): Promise<{ success: boolean; tabId?: number; url?: string; error?: string }> {
    try {
      const tab = await chrome.tabs.create({ url: `${this.notebookLMUrl}/notebook/new`, active: false });
      await this.waitForPageLoad(tab.id);

      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: (t: string) => {
          const titleInput = document.querySelector('[placeholder*="Untitled"]') as HTMLInputElement | null;
          if (titleInput) {
            titleInput.value = t;
            titleInput.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [title],
      });

      return { success: true, tabId: tab.id, url: tab.url };
    } catch (error: any) {
      console.error('Failed to create notebook:', error);
      return { success: false, error: error.message };
    }
  }

  async bulkImport(reports: Array<{ content: string }>, notebookTitle = 'AI Video Analysis'): Promise<{ success: boolean; notebookUrl?: string; results?: BulkImportResult; error?: string }> {
    try {
      const notebook = await this.createNotebook(notebookTitle);
      if (!notebook.success || !notebook.tabId) throw new Error('Failed to create notebook');

      const batchSize = 10;
      const batches = this.chunkArray(reports, batchSize);
      const results: BulkImportResult = { total: reports.length, imported: 0, failed: 0, batches: batches.length };

      for (let i = 0; i < batches.length; i++) {
        for (const report of batches[i]) {
          const imported = await this.importReport(notebook.tabId, report);
          if (imported.success) results.imported++; else results.failed++;
          await this.sleep(1000);
        }

        await chrome.runtime.sendMessage({
          type: 'NOTEBOOKLM_PROGRESS',
          data: { batch: i + 1, total: batches.length, imported: results.imported },
        });
      }

      return { success: true, notebookUrl: notebook.url, results };
    } catch (error: any) {
      console.error('Bulk import failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async importReport(tabId: number, report: { content: string }): Promise<{ success: boolean; error?: string }> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const addButton = document.querySelector('[aria-label*="Add source"]') as HTMLElement | null;
          if (addButton) addButton.click();
        },
      });

      await this.sleep(500);

      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const pasteOption = Array.from(document.querySelectorAll('button')).find((btn) => btn.textContent.includes('Paste text'));
          if (pasteOption) pasteOption.click();
        },
      });

      await this.sleep(500);

      await chrome.scripting.executeScript({
        target: { tabId },
        func: (content: string) => {
          const textarea = document.querySelector('textarea') as HTMLTextAreaElement | null;
          if (textarea) {
            textarea.value = content;
            textarea.dispatchEvent(new Event('input', { bubbles: true }));
          }
        },
        args: [report.content],
      });

      await this.sleep(500);

      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const addButton = Array.from(document.querySelectorAll('button')).find(
            (btn) => btn.textContent === 'Add' || btn.textContent === 'Import'
          );
          if (addButton) addButton.click();
        },
      });

      await this.sleep(2000);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to import report:', error);
      return { success: false, error: error.message };
    }
  }

  async generateAudioOverview(tabId: number): Promise<AudioResult> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const audioButton = Array.from(document.querySelectorAll('button')).find((btn) => btn.textContent.includes('Audio overview'));
          if (audioButton) audioButton.click();
        },
      });

      await this.sleep(1000);

      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const generateButton = Array.from(document.querySelectorAll('button')).find((btn) => btn.textContent === 'Generate');
          if (generateButton) generateButton.click();
        },
      });

      return await this.waitForAudioGeneration(tabId);
    } catch (error: any) {
      console.error('Failed to generate audio overview:', error);
      return { success: false, error: error.message };
    }
  }

  private async waitForAudioGeneration(tabId: number, maxWaitMinutes = 5): Promise<AudioResult> {
    const maxAttempts = maxWaitMinutes * 12;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000);

      const readiness = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const audio = document.querySelector('audio') as HTMLAudioElement | null;
          if (audio) {
            const src = audio.currentSrc || audio.src || '';
            const durationSeconds = Number.isFinite(audio.duration) ? Math.max(0, Math.round(audio.duration)) : 0;
            return { ready: true, audioUrl: src, durationSeconds };
          }
          const playButton = document.querySelector('[aria-label*="Play"]');
          if (playButton) return { ready: true, audioUrl: '', durationSeconds: 0 };
          return { ready: false };
        },
      });

      const result = readiness[0]?.result as any;
      if (result?.ready) {
        return {
          success: true, ready: true,
          audioUrl: result.audioUrl || '',
          durationSeconds: result.durationSeconds || 0,
          duration: this.formatDuration(result.durationSeconds || 0),
        };
      }

      await chrome.runtime.sendMessage({
        type: 'AUDIO_GENERATION_PROGRESS',
        data: { attempt: i + 1, maxAttempts, estimatedTime: `${Math.ceil(((maxAttempts - i) * 5) / 60)} minutes remaining` },
      });
    }

    return { success: false, error: 'Audio generation timeout' };
  }

  async downloadAudioOverview(tabId: number): Promise<{ success: boolean; error?: string }> {
    try {
      await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const downloadButton = Array.from(document.querySelectorAll('button')).find((btn) => btn.textContent.includes('Download'));
          if (downloadButton) downloadButton.click();
        },
      });

      await this.sleep(1000);
      return { success: true };
    } catch (error: any) {
      console.error('Failed to download audio:', error);
      return { success: false, error: error.message };
    }
  }

  async createPodcast(notebooks: Notebook[], podcastTitle: string): Promise<PodcastResult> {
    try {
      const episodes: PodcastEpisode[] = [];
      const skipped: Array<{ title: string; reason: string }> = [];

      for (const notebook of notebooks) {
        const audio = await this.generateAudioOverview(notebook.tabId);
        if (audio.success && audio.audioUrl) {
          episodes.push({ title: notebook.title, audioUrl: audio.audioUrl, duration: audio.duration || this.formatDuration(audio.durationSeconds || 0) });
        } else {
          skipped.push({ title: notebook.title, reason: audio.error || 'audio_url_unavailable' });
        }
      }

      const rssFeed = this.generateRSSFeed(podcastTitle, episodes);

      return { success: true, podcast: { title: podcastTitle, episodes: episodes.length, rssFeed }, skipped };
    } catch (error: any) {
      console.error('Failed to create podcast:', error);
      return { success: false, error: error.message };
    }
  }

  private generateRSSFeed(title: string, episodes: PodcastEpisode[]): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:itunes="http://www.itunes.com/dtds/podcast-1.0.dtd">
<channel>
<title>${this.escapeXml(title)}</title>
<description>AI Video Analysis Podcast</description>
<language>en-us</language>
<itunes:author>AI Video Intelligence Suite</itunes:author>
<itunes:category text="Technology"/>
${episodes.map((episode, index) => `
<item>
<title>${this.escapeXml(episode.title)}</title>
<description>Episode ${index + 1}</description>
<enclosure url="${episode.audioUrl}" type="audio/mpeg"/>
<itunes:duration>${episode.duration}</itunes:duration>
<pubDate>${new Date().toUTCString()}</pubDate>
</item>
`).join('\n')}
</channel>
</rss>`;
  }

  formatDuration(totalSeconds: number): string {
    const safe = Number.isFinite(totalSeconds) ? Math.max(0, Math.round(totalSeconds)) : 0;
    const hours = Math.floor(safe / 3600);
    const minutes = Math.floor((safe % 3600) / 60);
    const seconds = safe % 60;

    if (hours > 0) return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return `${minutes}:${String(seconds).padStart(2, '0')}`;
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) chunks.push(array.slice(i, i + size));
    return chunks;
  }

  private waitForPageLoad(tabId: number): Promise<void> {
    return new Promise((resolve) => {
      chrome.tabs.onUpdated.addListener(function listener(updatedTabId: number, info: any) {
        if (updatedTabId === tabId && info.status === 'complete') {
          chrome.tabs.onUpdated.removeListener(listener);
          resolve();
        }
      });
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private escapeXml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  }

  async getNotebooks(): Promise<{ success: boolean; notebooks?: any[]; error?: string }> {
    try {
      const tab = await chrome.tabs.create({ url: this.notebookLMUrl, active: false });
      await this.waitForPageLoad(tab.id);

      const notebooks = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: () => {
          const notebookElements = document.querySelectorAll('[data-notebook-id]');
          return Array.from(notebookElements).map((el) => ({
            id: el.getAttribute('data-notebook-id'),
            title: el.querySelector('[data-notebook-title]')?.textContent || 'Untitled',
            url: (el as HTMLAnchorElement).href,
          }));
        },
      });

      await chrome.tabs.remove(tab.id);
      return { success: true, notebooks: notebooks[0]?.result as any[] || [] };
    } catch (error: any) {
      console.error('Failed to get notebooks:', error);
      return { success: false, error: error.message };
    }
  }

  async checkAuthentication(): Promise<{ authenticated: boolean; hasActiveSession: boolean }> {
    try {
      const tabs = await chrome.tabs.query({ url: 'https://notebooklm.google.com/*' });
      return { authenticated: tabs.length > 0, hasActiveSession: tabs.length > 0 };
    } catch {
      return { authenticated: false, hasActiveSession: false };
    }
  }
}

const notebookLMService = new NotebookLMService();
export default notebookLMService;
