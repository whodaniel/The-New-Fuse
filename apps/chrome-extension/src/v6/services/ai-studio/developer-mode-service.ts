import { API_URLS, AI_MODELS } from '../../shared/constants';

interface VideoData {
  id: string;
  url: string;
  title?: string;
}

interface DeveloperProcessingOption {
  id: string;
  name: string;
  description: string;
  cost: string;
  steps: string[];
  recommended?: boolean;
}

class DeveloperModeService {
  private isDeveloper: boolean = false;
  private developerEmail: string = 'YOUR_EMAIL@gmail.com';

  async checkDeveloperMode(): Promise<boolean> {
    const { userEmail } = (await chrome.storage.local.get('userEmail')) as { userEmail?: string };
    this.isDeveloper = userEmail === this.developerEmail;
    return this.isDeveloper;
  }

  async getVideoInfoViaGoogleSearch(videoUrl: string): Promise<{ success: boolean; overview?: any; cost?: number; method?: string; error?: string }> {
    try {
      const searchQuery = `${videoUrl} video summary duration key points`;
      const googleSearchUrl = `${API_URLS.googleSearch}?q=${encodeURIComponent(searchQuery)}`;

      const tab = await chrome.tabs.create({ url: googleSearchUrl, active: false });
      await this.waitForAIOverview(tab.id);
      const overview = await this.extractAIOverview(tab.id);
      await chrome.tabs.remove(tab.id);

      return { success: true, overview, cost: 0, method: 'google-search-ai' };
    } catch (error: any) {
      console.error('Google Search AI failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async waitForAIOverview(tabId: number, maxWaitSeconds = 10): Promise<boolean> {
    const maxAttempts = maxWaitSeconds * 2;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(500);

      const hasOverview = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          const aiOverview =
            document.querySelector('[data-attrid="SGAIOverview"]') ||
            document.querySelector('.ai-overview') ||
            document.querySelector('[data-sgrd]');
          return !!aiOverview;
        },
      });

      if (hasOverview[0]?.result) return true;
    }

    return false;
  }

  private async extractAIOverview(tabId: number): Promise<{ text: string; html: string } | null> {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const aiOverview =
          document.querySelector('[data-attrid="SGAIOverview"]') ||
          document.querySelector('.ai-overview') ||
          document.querySelector('[data-sgrd]');

        if (!aiOverview) return null;
        return { text: aiOverview.textContent, html: aiOverview.innerHTML };
      },
    });

    return result[0]?.result as any;
  }

  async processWithAIStudio(video: VideoData): Promise<{ success: boolean; result?: any; cost?: number; method?: string; error?: string }> {
    try {
      const tab = await chrome.tabs.create({
        url: `${API_URLS.aiStudio}/app/prompts/new_chat?model=${AI_MODELS.aiStudioDefault}`,
        active: false,
      });

      await this.waitForPageLoad(tab.id);

      await chrome.tabs.sendMessage(tab.id, {
        type: 'AI_STUDIO_ADD_VIDEO',
        data: {
          videoUrl: video.url,
          prompt: `Extract all key AI-related concepts, technical innovations, and implementation details from this video. Provide a dense, structured summary in markdown format.`,
        },
      });

      const result = await this.waitForAIStudioCompletion(tab.id);

      await chrome.tabs.sendMessage(tab.id, { type: 'AI_STUDIO_DOWNLOAD' });
      await chrome.tabs.remove(tab.id);

      return { success: true, result, cost: 0, method: 'ai-studio' };
    } catch (error: any) {
      console.error('AI Studio processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  private async waitForAIStudioCompletion(tabId: number, maxWaitMinutes = 5): Promise<boolean> {
    const maxAttempts = maxWaitMinutes * 12;

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000);

      const isComplete = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => !!document.querySelector('[aria-label*="Download"]'),
      });

      if (isComplete[0]?.result) return true;
    }

    return false;
  }

  async processDeveloperMode(video: VideoData): Promise<{ video: VideoData; steps: any[]; totalCost: number }> {
    console.log('Developer Mode: Using FREE resources!');

    const results = { video, steps: [] as any[], totalCost: 0 };

    const metadata = await this.getYouTubeMetadata(video.id);
    results.steps.push({ step: 'YouTube Metadata', cost: 0, data: metadata });

    const transcript = await this.getTranscript(video.id);
    if (transcript) results.steps.push({ step: 'YouTube Transcript', cost: 0, data: transcript });

    const searchOverview = await this.getVideoInfoViaGoogleSearch(video.url);
    if (searchOverview.success) results.steps.push({ step: 'Google Search AI', cost: 0, data: searchOverview.overview });

    const aiStudioResult = await this.processWithAIStudio(video);
    if (aiStudioResult.success) results.steps.push({ step: 'AI Studio Analysis', cost: 0, data: aiStudioResult.result });

    return results;
  }

  private async getYouTubeMetadata(videoId: string): Promise<any> {
    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_GET_VIDEO_DETAILS',
      data: { videoIds: [videoId] },
    });
    return response.success ? response.data[0] : null;
  }

  private async getTranscript(videoId: string): Promise<string | null> {
    try {
      const response = await fetch(`${API_URLS.youtubeTranscript}?lang=en&v=${videoId}`);
      if (!response.ok) return null;
      const xml = await response.text();
      return this.parseTranscript(xml);
    } catch {
      return null;
    }
  }

  private parseTranscript(xml: string): string {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const texts = doc.querySelectorAll('text');
    let transcript = '';
    texts.forEach((text) => { transcript += text.textContent + ' '; });
    return transcript.trim();
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

  async enableDeveloperMode(email: string): Promise<void> {
    await chrome.storage.local.set({ developerMode: true, developerEmail: email });
    this.isDeveloper = true;
    this.developerEmail = email;
  }

  getDeveloperProcessingOptions(): DeveloperProcessingOption[] {
    return [
      {
        id: 'dev-free-complete', name: 'Developer: Complete FREE Workflow',
        description: 'YouTube API + Transcript + Google Search AI + AI Studio', cost: '$0.00',
        steps: ['1. Get metadata (YouTube API - FREE)', '2. Get transcript (YouTube - FREE)', '3. Quick overview (Google Search AI - FREE)', '4. Full analysis (AI Studio - FREE with your Gemini Pro)'],
        recommended: true,
      },
      {
        id: 'dev-ai-studio-only', name: 'Developer: AI Studio Only',
        description: 'Use your Gemini Pro subscription', cost: '$0.00',
        steps: ['1. Process with AI Studio (FREE with your subscription)'],
      },
      {
        id: 'dev-google-search', name: 'Developer: Google Search AI',
        description: 'Quick overview using Google Search', cost: '$0.00',
        steps: ['1. Get overview from Google Search AI (FREE)'],
      },
    ];
  }
}

const developerModeService = new DeveloperModeService();
export default developerModeService;
