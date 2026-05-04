import { API_URLS, GOOGLE_OAUTH_SCOPES } from '../../shared/constants';

interface AuthAccount {
  youtube: { token: string } | null;
  geminiApi: { apiKey: string } | null;
  aiStudio: boolean | null;
  googleSearch: boolean | null;
  youtubeApiKey: string | null;
}

interface AuthStatus {
  youtube: boolean;
  geminiApi: boolean;
  aiStudio: boolean;
  googleSearch: boolean;
}

interface AuthSummary {
  authenticated: string[];
  missing: string[];
  isFullyAuthenticated: boolean;
}

interface ProcessingOption {
  id: string;
  name: string;
  cost: string;
  requires: string[];
  available: boolean;
  recommended?: boolean;
}

interface RecommendedProcessing {
  method: string;
  reason: string;
  cost: number;
}

class AuthenticationService {
  private accounts: AuthAccount;
  private authStatus: AuthStatus;

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

  async initialize(): Promise<AuthStatus> {
    const saved = (await chrome.storage.local.get([
      'youtubeToken',
      'geminiApiKey',
      'aiStudioAuth',
      'googleSearchAuth',
    ])) as Record<string, unknown>;

    if (saved.youtubeToken) {
      this.authStatus.youtube = true;
    }

    if (saved.geminiApiKey) {
      this.authStatus.geminiApi = true;
      this.accounts.geminiApi = { apiKey: saved.geminiApiKey as string };
    }

    if (saved.aiStudioAuth) {
      this.authStatus.aiStudio = true;
    }

    return this.authStatus;
  }

  async authenticateYouTube(): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const token = await chrome.identity.getAuthToken({
        interactive: true,
        scopes: GOOGLE_OAUTH_SCOPES.slice(0, 3),
      });

      if (token) {
        await chrome.storage.local.set({ youtubeToken: token });
        this.authStatus.youtube = true;
        this.accounts.youtube = { token };
        return { success: true, token };
      }

      return { success: false, error: 'No token received' };
    } catch (error: any) {
      console.error('YouTube auth failed:', error);
      return { success: false, error: error.message };
    }
  }

  async setGeminiAPIKey(apiKey: string): Promise<{ success: boolean; error?: string }> {
    try {
      const isValid = await this.validateGeminiAPIKey(apiKey);

      if (!isValid) {
        return { success: false, error: 'Invalid API key' };
      }

      await chrome.storage.local.set({ geminiApiKey: apiKey });
      this.authStatus.geminiApi = true;
      this.accounts.geminiApi = { apiKey };

      return { success: true };
    } catch (error: any) {
      console.error('Gemini API key setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  async validateGeminiAPIKey(apiKey: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${API_URLS.geminiApi}/models?key=${apiKey}`
      );
      return response.ok;
    } catch {
      return false;
    }
  }

  async setYouTubeApiKey(apiKey: string | null): Promise<{ success: boolean; error?: string }> {
    try {
      if (!apiKey) {
        await chrome.storage.local.remove('youtubeApiKey');
        this.accounts.youtubeApiKey = null;
        return { success: true };
      }

      await chrome.storage.local.set({ youtubeApiKey: apiKey });
      this.accounts.youtubeApiKey = apiKey;

      return { success: true };
    } catch (error: any) {
      console.error('YouTube API key setup failed:', error);
      return { success: false, error: error.message };
    }
  }

  async authenticateAIStudio(): Promise<{ success: boolean; message?: string; error?: string }> {
    try {
      const tabs = await chrome.tabs.query({ url: `${API_URLS.aiStudio}/*` });

      if (tabs.length > 0) {
        await chrome.storage.local.set({ aiStudioAuth: true });
        this.authStatus.aiStudio = true;
        return { success: true };
      }

      await chrome.tabs.create({
        url: `${API_URLS.aiStudio}/app/prompts/new_chat`,
        active: true,
      });

      return {
        success: true,
        message: 'Please sign in to AI Studio in the opened tab',
      };
    } catch (error: any) {
      console.error('AI Studio auth failed:', error);
      return { success: false, error: error.message };
    }
  }

  async setupGoogleSearch(): Promise<{ success: boolean }> {
    this.authStatus.googleSearch = true;
    await chrome.storage.local.set({ googleSearchAuth: true });
    return { success: true };
  }

  async checkStatus(): Promise<AuthStatus & { summary: AuthSummary }> {
    await this.initialize();
    return {
      youtube: this.authStatus.youtube,
      geminiApi: this.authStatus.geminiApi,
      aiStudio: this.authStatus.aiStudio,
      googleSearch: this.authStatus.googleSearch,
      summary: this.getAuthSummary(),
    };
  }

  getAuthSummary(): AuthSummary {
    const authenticated: string[] = [];
    const missing: string[] = [];

    if (this.authStatus.youtube) authenticated.push('YouTube'); else missing.push('YouTube');
    if (this.authStatus.geminiApi) authenticated.push('Gemini API'); else missing.push('Gemini API');
    if (this.authStatus.aiStudio) authenticated.push('AI Studio'); else missing.push('AI Studio');

    return {
      authenticated,
      missing,
      isFullyAuthenticated: missing.length === 0,
    };
  }

  getAvailableProcessingOptions(): ProcessingOption[] {
    const options: ProcessingOption[] = [];

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

    if (this.authStatus.geminiApi) {
      options.push({ id: 'flash', name: 'Gemini Flash Analysis', cost: '$0.01/video', requires: ['geminiApi'], available: true });
      options.push({ id: 'pro', name: 'Gemini Pro Analysis', cost: '$0.15/video', requires: ['geminiApi'], available: true });
      options.push({ id: 'vision', name: 'Gemini Pro Vision', cost: '$0.30/video', requires: ['geminiApi'], available: true });
    }

    if (this.authStatus.aiStudio) {
      options.push({ id: 'ai_studio', name: 'AI Studio (Your Gemini Pro)', cost: 'FREE (uses your account)', requires: ['aiStudio'], available: true, recommended: true });
    }

    return options;
  }

  async signOut(service: string): Promise<{ success: boolean }> {
    switch (service) {
      case 'youtube':
        if (this.accounts.youtube?.token) {
          await chrome.identity.removeCachedAuthToken({ token: this.accounts.youtube.token });
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

  async getGeminiAPIKey(): Promise<string | undefined> {
    if (this.accounts.geminiApi?.apiKey) {
      return this.accounts.geminiApi.apiKey;
    }

    const { geminiApiKey } = (await chrome.storage.local.get('geminiApiKey')) as { geminiApiKey?: string };
    return geminiApiKey;
  }

  async hasGeminiPro(): Promise<boolean> {
    return this.authStatus.aiStudio;
  }

  async getRecommendedProcessing(): Promise<RecommendedProcessing> {
    const status = await this.checkStatus();

    if (status.aiStudio) {
      return { method: 'ai_studio', reason: 'Uses your existing Gemini Pro subscription (FREE)', cost: 0 };
    }

    if (status.geminiApi) {
      return { method: 'flash', reason: 'Fast and affordable ($0.01 per video)', cost: 0.01 };
    }

    return { method: 'transcript', reason: 'Free transcript analysis', cost: 0 };
  }

  async detectAccountChange(): Promise<boolean> {
    try {
      const token = await chrome.identity.getAuthToken({ interactive: false });
      const stored = (await chrome.storage.local.get('youtubeToken')) as { youtubeToken?: string };
      if (token && token !== stored.youtubeToken) {
        console.log('Account change detected! Updating tokens...');
        await chrome.storage.local.set({ youtubeToken: token });
        this.accounts.youtube = { token };
        return true;
      }
    } catch {
      // Silently fail if not logged in
    }
    return false;
  }

  async resetAllTokens(): Promise<boolean> {
    const data = (await chrome.storage.local.get()) as Record<string, unknown>;
    const keysToRemove = Object.keys(data).filter(
      (k) => k.includes('Token') || k.includes('Auth') || k.includes('ApiKey')
    );
    await chrome.storage.local.remove(keysToRemove);
    this.authStatus = { youtube: false, geminiApi: false, aiStudio: false, googleSearch: false };
    return true;
  }
}

const authenticationService = new AuthenticationService();
export default authenticationService;
