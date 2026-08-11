// Developer Mode Service
// Special FREE processing options for extension developer
// Uses Google Search AI + AI Studio (both FREE!)

class DeveloperModeService {
  constructor() {
    this.isDeveloper = false;
    this.developerEmail = 'YOUR_EMAIL@gmail.com'; // Set your email
  }

  // Check if current user is the developer
  async checkDeveloperMode() {
    const { userEmail } = await chrome.storage.local.get('userEmail');
    this.isDeveloper = userEmail === this.developerEmail;
    return this.isDeveloper;
  }

  // Get video info via Google Search AI (FREE!)
  async getVideoInfoViaGoogleSearch(videoUrl) {
    try {
      // Open Google Search with AI mode
      const searchQuery = `${videoUrl} video summary duration key points`;
      const googleSearchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      // Open in new tab
      const tab = await chrome.tabs.create({
        url: googleSearchUrl,
        active: false,
      });

      // Wait for AI overview to appear
      await this.waitForAIOverview(tab.id);

      // Extract AI overview content
      const overview = await this.extractAIOverview(tab.id);

      // Close tab
      await chrome.tabs.remove(tab.id);

      return {
        success: true,
        overview,
        cost: 0, // FREE!
        method: 'google-search-ai',
      };
    } catch (error) {
      console.error('Google Search AI failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Wait for AI overview to appear
  async waitForAIOverview(tabId, maxWaitSeconds = 10) {
    const maxAttempts = maxWaitSeconds * 2; // Check every 500ms

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(500);

      const hasOverview = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Check for AI overview container
          const aiOverview =
            document.querySelector('[data-attrid="SGAIOverview"]') ||
            document.querySelector('.ai-overview') ||
            document.querySelector('[data-sgrd]');
          return !!aiOverview;
        },
      });

      if (hasOverview[0]?.result) {
        return true;
      }
    }

    return false;
  }

  // Extract AI overview content
  async extractAIOverview(tabId) {
    const result = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        const aiOverview =
          document.querySelector('[data-attrid="SGAIOverview"]') ||
          document.querySelector('.ai-overview') ||
          document.querySelector('[data-sgrd]');

        if (!aiOverview) return null;

        return {
          text: aiOverview.textContent,
          html: aiOverview.innerHTML,
        };
      },
    });

    return result[0]?.result;
  }

  // Process video with AI Studio (FREE with Gemini Pro subscription)
  async processWithAIStudio(video) {
    try {
      // Open AI Studio
      const tab = await chrome.tabs.create({
        url: 'https://aistudio.google.com/app/prompts/new_chat?model=gemini-2.0-flash-exp',
        active: false,
      });

      // Wait for page load
      await this.waitForPageLoad(tab.id);

      // Add video via content script
      await chrome.tabs.sendMessage(tab.id, {
        type: 'AI_STUDIO_ADD_VIDEO',
        data: {
          videoUrl: video.url,
          prompt: `Extract all key AI-related concepts, technical innovations, and implementation details from this video. Provide a dense, structured summary in markdown format.`,
        },
      });

      // Wait for completion
      const result = await this.waitForAIStudioCompletion(tab.id);

      // Download report
      await chrome.tabs.sendMessage(tab.id, {
        type: 'AI_STUDIO_DOWNLOAD',
      });

      // Close tab
      await chrome.tabs.remove(tab.id);

      return {
        success: true,
        result,
        cost: 0, // FREE with your Gemini Pro subscription!
        method: 'ai-studio',
      };
    } catch (error) {
      console.error('AI Studio processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Wait for AI Studio completion
  async waitForAIStudioCompletion(tabId, maxWaitMinutes = 5) {
    const maxAttempts = maxWaitMinutes * 12; // Check every 5 seconds

    for (let i = 0; i < maxAttempts; i++) {
      await this.sleep(5000);

      const isComplete = await chrome.scripting.executeScript({
        target: { tabId },
        func: () => {
          // Check if response is complete
          const downloadButton = document.querySelector('[aria-label*="Download"]');
          return !!downloadButton;
        },
      });

      if (isComplete[0]?.result) {
        return true;
      }
    }

    return false;
  }

  // Developer's FREE processing workflow
  async processDeveloperMode(video) {
    console.log('🔧 Developer Mode: Using FREE resources!');

    const results = {
      video,
      steps: [],
      totalCost: 0,
    };

    // Step 1: Get basic info from YouTube API (FREE)
    const metadata = await this.getYouTubeMetadata(video.id);
    results.steps.push({
      step: 'YouTube Metadata',
      cost: 0,
      data: metadata,
    });

    // Step 2: Get transcript (FREE)
    const transcript = await this.getTranscript(video.id);
    if (transcript) {
      results.steps.push({
        step: 'YouTube Transcript',
        cost: 0,
        data: transcript,
      });
    }

    // Step 3: Quick check with Google Search AI (FREE)
    const searchOverview = await this.getVideoInfoViaGoogleSearch(video.url);
    if (searchOverview.success) {
      results.steps.push({
        step: 'Google Search AI',
        cost: 0,
        data: searchOverview.overview,
      });
    }

    // Step 4: Full analysis with AI Studio (FREE with your subscription)
    const aiStudioResult = await this.processWithAIStudio(video);
    if (aiStudioResult.success) {
      results.steps.push({
        step: 'AI Studio Analysis',
        cost: 0,
        data: aiStudioResult.result,
      });
    }

    results.totalCost = 0; // ALL FREE!

    return results;
  }

  // Get YouTube metadata
  async getYouTubeMetadata(videoId) {
    const response = await chrome.runtime.sendMessage({
      type: 'YOUTUBE_GET_VIDEO_DETAILS',
      data: { videoIds: [videoId] },
    });

    return response.success ? response.data[0] : null;
  }

  // Get transcript
  async getTranscript(videoId) {
    try {
      const response = await fetch(`https://www.youtube.com/api/timedtext?lang=en&v=${videoId}`);

      if (!response.ok) return null;

      const xml = await response.text();
      return this.parseTranscript(xml);
    } catch (error) {
      return null;
    }
  }

  // Parse transcript XML
  parseTranscript(xml) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xml, 'text/xml');
    const texts = doc.querySelectorAll('text');

    let transcript = '';
    texts.forEach((text) => {
      transcript += text.textContent + ' ';
    });

    return transcript.trim();
  }

  // Wait for page load
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

  // Sleep utility
  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // Enable developer mode
  async enableDeveloperMode(email) {
    await chrome.storage.local.set({
      developerMode: true,
      developerEmail: email,
    });

    this.isDeveloper = true;
    this.developerEmail = email;
  }

  // Get processing options for developer
  getDeveloperProcessingOptions() {
    return [
      {
        id: 'dev-free-complete',
        name: 'Developer: Complete FREE Workflow',
        description: 'YouTube API + Transcript + Google Search AI + AI Studio',
        cost: '$0.00',
        steps: [
          '1. Get metadata (YouTube API - FREE)',
          '2. Get transcript (YouTube - FREE)',
          '3. Quick overview (Google Search AI - FREE)',
          '4. Full analysis (AI Studio - FREE with your Gemini Pro)',
        ],
        recommended: true,
      },
      {
        id: 'dev-ai-studio-only',
        name: 'Developer: AI Studio Only',
        description: 'Use your Gemini Pro subscription',
        cost: '$0.00',
        steps: ['1. Process with AI Studio (FREE with your subscription)'],
      },
      {
        id: 'dev-google-search',
        name: 'Developer: Google Search AI',
        description: 'Quick overview using Google Search',
        cost: '$0.00',
        steps: ['1. Get overview from Google Search AI (FREE)'],
      },
    ];
  }
}

// Export singleton
const developerModeService = new DeveloperModeService();
export default developerModeService;
