// Multi-Account Authentication Service
// Supports: YouTube OAuth, Gemini API Key, AI Studio (user's Gemini Pro), Google Search

class AuthenticationService {
  constructor() {
    this.accounts = {
      youtube: null,
      geminiApi: null,
      aiStudio: null,
      googleSearch: null,
      youtubeApiKey: null,
    };

    this.authStatus = {
      youtube: false,
      geminiApi: false,
      aiStudio: false,
      googleSearch: false,
    };
  }

  // Initialize - load saved credentials
  async initialize() {
    const saved = await chrome.storage.local.get([
      'youtubeToken',
      'geminiApiKey',
      'aiStudioAuth',
      'googleSearchAuth',
    ]);

    if (saved.youtubeToken) {
      this.authStatus.youtube = true;
    }

    if (saved.geminiApiKey) {
      this.authStatus.geminiApi = true;
      this.accounts.geminiApi = { apiKey: saved.geminiApiKey };
    }

    if (saved.aiStudioAuth) {
      this.authStatus.aiStudio = true;
    }

    return this.authStatus;
  }

  // YouTube OAuth Authentication
  async authenticateYouTube() {
    try {
      const token = await chrome.identity.getAuthToken({
        interactive: true,
        scopes: [
          'https://www.googleapis.com/auth/youtube.readonly',
          'https://www.googleapis.com/auth/youtube',
        ],
      });

      if (token) {
        await chrome.storage.local.set({ youtubeToken: token });
        this.authStatus.youtube = true;
        this.accounts.youtube = { token };
        return { success: true, token };
      }

      return { success: false, error: 'No token received' };
    } catch (error) {
      console.error('YouTube auth failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Gemini API Key Setup
  async setGeminiAPIKey(apiKey) {
    try {
      // Validate API key by making a test request
      const isValid = await this.validateGeminiAPIKey(apiKey);

      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      await chrome.storage.local.set({ geminiApiKey: apiKey });
      this.authStatus.geminiApi = true;
      this.accounts.geminiApi = { apiKey };

      return { success: true };
    } catch (error) {
      console.error('Gemini API key setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Validate Gemini API Key
  async validateGeminiAPIKey(apiKey) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      return response.ok;
    } catch (error) {
      return false;
    }
  }

  // Set User-provided YouTube API Key (to offload quota)
  async setYouTubeApiKey(apiKey) {
    try {
      if (!apiKey) {
        await chrome.storage.local.remove('youtubeApiKey');
        this.accounts.youtubeApiKey = null;
        return { success: true };
      }

      // Basic validation (optional: make a test call)
      await chrome.storage.local.set({ youtubeApiKey: apiKey });
      this.accounts.youtubeApiKey = apiKey;

      return { success: true };
    } catch (error) {
      console.error('YouTube API key setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  // AI Studio Authentication (uses user's Gemini Pro account)
  async authenticateAIStudio() {
    try {
      // Check if user is logged into AI Studio
      // This is done by checking if they can access aistudio.google.com
      const tabs = await chrome.tabs.query({
        url: 'https://aistudio.google.com/*',
      });

      if (tabs.length > 0) {
        // User has AI Studio open, they're likely authenticated
        await chrome.storage.local.set({ aiStudioAuth: true });
        this.authStatus.aiStudio = true;
        return { success: true };
      }

      // Open AI Studio for authentication
      await chrome.tabs.create({
        url: 'https://aistudio.google.com/app/prompts/new_chat',
        active: true,
      });

      return {
        success: true,
        message: 'Please sign in to AI Studio in the opened tab',
      };
    } catch (error) {
      console.error('AI Studio auth failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Google Search AI Mode (FREE - no auth needed!)
  async setupGoogleSearch() {
    // Google Search AI mode doesn't require authentication
    // It's accessible to anyone
    this.authStatus.googleSearch = true;
    await chrome.storage.local.set({ googleSearchAuth: true });
    return { success: true };
  }

  // Get video duration via Google Search (FREE!)
  async getVideoDurationViaSearch(videoUrl) {
    try {
      // Use Google Search to get video info
      const searchQuery = `site:youtube.com ${videoUrl} duration`;
      const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(searchQuery)}`;

      // This would require scraping Google Search results
      // For now, we'll use YouTube API which is also free
      return null;
    } catch (error) {
      console.error('Google Search failed:', error);
      return null;
    }
  }

  // Check authentication status
  async checkStatus() {
    await this.initialize();
    return {
      youtube: this.authStatus.youtube,
      geminiApi: this.authStatus.geminiApi,
      aiStudio: this.authStatus.aiStudio,
      googleSearch: this.authStatus.googleSearch,
      summary: this.getAuthSummary(),
    };
  }

  // Get authentication summary
  getAuthSummary() {
    const authenticated = [];
    const missing = [];

    if (this.authStatus.youtube) {
      authenticated.push('YouTube');
    } else {
      missing.push('YouTube');
    }

    if (this.authStatus.geminiApi) {
      authenticated.push('Gemini API');
    } else {
      missing.push('Gemini API');
    }

    if (this.authStatus.aiStudio) {
      authenticated.push('AI Studio');
    } else {
      missing.push('AI Studio');
    }

    return {
      authenticated,
      missing,
      isFullyAuthenticated: missing.length === 0,
    };
  }

  // Get available processing options based on authentication
  getAvailableProcessingOptions() {
    const options = [];

    // Always available (FREE)
    options.push({
      id: 'metadata',
      name: 'YouTube Metadata',
      cost: 'FREE',
      requires: ['youtube'],
      available: this.authStatus.youtube,
    });

    options.push({
      id: 'transcript',
      name: 'YouTube Transcript',
      cost: 'FREE',
      requires: ['youtube'],
      available: this.authStatus.youtube,
    });

    // Gemini API options
    if (this.authStatus.geminiApi) {
      options.push({
        id: 'flash',
        name: 'Gemini Flash Analysis',
        cost: '$0.01/video',
        requires: ['geminiApi'],
        available: true,
      });

      options.push({
        id: 'pro',
        name: 'Gemini Pro Analysis',
        cost: '$0.15/video',
        requires: ['geminiApi'],
        available: true,
      });

      options.push({
        id: 'vision',
        name: 'Gemini Pro Vision',
        cost: '$0.30/video',
        requires: ['geminiApi'],
        available: true,
      });
    }

    // AI Studio (user's account - FREE for them!)
    if (this.authStatus.aiStudio) {
      options.push({
        id: 'ai_studio',
        name: 'AI Studio (Your Gemini Pro)',
        cost: 'FREE (uses your account)',
        requires: ['aiStudio'],
        available: true,
        recommended: true,
      });
    }

    return options;
  }

  // Sign out from specific service
  async signOut(service) {
    switch (service) {
      case 'youtube':
        if (this.accounts.youtube?.token) {
          await chrome.identity.removeCachedAuthToken({
            token: this.accounts.youtube.token,
          });
        }
        await chrome.storage.local.remove('youtubeToken');
        this.authStatus.youtube = false;
        this.accounts.youtube = null;
        break;

      case 'geminiApi':
        await chrome.storage.local.remove('geminiApiKey');
        this.authStatus.geminiApi = false;
        this.accounts.geminiApi = null;
        break;

      case 'aiStudio':
        await chrome.storage.local.remove('aiStudioAuth');
        this.authStatus.aiStudio = false;
        break;

      case 'all':
        await this.signOut('youtube');
        await this.signOut('geminiApi');
        await this.signOut('aiStudio');
        break;
    }

    return { success: true };
  }

  // Get Gemini API key
  async getGeminiAPIKey() {
    if (this.accounts.geminiApi?.apiKey) {
      return this.accounts.geminiApi.apiKey;
    }

    const { geminiApiKey } = await chrome.storage.local.get('geminiApiKey');
    return geminiApiKey;
  }

  // Check if user has Gemini Pro subscription
  async hasGeminiPro() {
    // Check if user is authenticated with AI Studio
    // If they are, they likely have Gemini Pro
    return this.authStatus.aiStudio;
  }

  // Get recommended processing method
  async getRecommendedProcessing() {
    const status = await this.checkStatus();

    // If user has AI Studio, recommend that (FREE for them!)
    if (status.aiStudio) {
      return {
        method: 'ai_studio',
        reason: 'Uses your existing Gemini Pro subscription (FREE)',
        cost: 0,
      };
    }

    // If user has Gemini API, recommend Flash (CHEAP)
    if (status.geminiApi) {
      return {
        method: 'flash',
        reason: 'Fast and affordable ($0.01 per video)',
        cost: 0.01,
      };
    }

    // Otherwise, recommend transcript only (FREE)
    return {
      method: 'transcript',
      reason: 'Free transcript analysis',
      cost: 0,
    };
  // Fix multi-account switching issue
  async detectAccountChange() {
    try {
      // Fetch fresh token - if user changed accounts in Gemini/YouTube,
      // chrome.identity might return a different token or need refreshing.
      const token = await chrome.identity.getAuthToken({ interactive: false });

      const stored = await chrome.storage.local.get('youtubeToken');
      if (token && token !== stored.youtubeToken) {
        console.log('Account change detected! Updating tokens...');
        await chrome.storage.local.set({ youtubeToken: token });
        this.accounts.youtube = { token };
        return true;
      }
    } catch (e) {
      // Silently fail if not logged in
    }
    return false;
  }

  // Clear all tokens (useful for troubleshooting)
  async resetAllTokens() {
    const data = await chrome.storage.local.get();
    const keysToRemove = Object.keys(data).filter((k) =>
      k.includes('Token') || k.includes('Auth') || k.includes('ApiKey')
    );
    await chrome.storage.local.remove(keysToRemove);
    this.authStatus = {
      youtube: false,
      geminiApi: false,
      aiStudio: false,
      googleSearch: false,
    };
    return true;
  }
}

// Export singleton
const authenticationService = new AuthenticationService();
export default authenticationService;
