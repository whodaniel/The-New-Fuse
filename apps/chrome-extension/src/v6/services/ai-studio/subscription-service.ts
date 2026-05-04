import { API_URLS } from '../../shared/constants';

interface TierFeatures {
  tier: string;
  dailyLimit: number;
  concurrentProcesses: number;
  customPrompts: boolean;
  maxCustomPrompts: number;
  autoDownload: boolean;
  retryLogic: boolean;
  maxRetries: number;
  notebooklmIntegration: boolean;
  podcasts: boolean;
  maxPodcasts: number;
  cloudSync: boolean;
  multiTab: boolean;
  analytics: boolean;
  prioritySupport: boolean;
  apiAccess: boolean;
  teamCollaboration: boolean;
  whiteLabel: boolean;
}

interface SubscriptionStatus {
  tier: string;
  features: TierFeatures;
  userId?: string;
  expiresAt?: number;
  expired?: boolean;
}

interface PricingTier {
  name: string;
  price: number;
  period: string | null;
  features: string[];
  yearlyPrice?: number;
  yearlyDiscount?: string;
}

class SubscriptionService {
  private apiUrl: string;

  constructor() {
    this.apiUrl = (typeof __APP_CONFIG !== 'undefined' && (__APP_CONFIG as any).API_URL) || API_URLS.aiVideoIntelligence;
  }

  async checkStatus(): Promise<SubscriptionStatus> {
    try {
      const data = (await chrome.storage.local.get(['tier', 'userId', 'subscriptionExpiry'])) as Record<string, any>;

      const tier = data.tier || 'free';
      const features = this.getFeatures(tier);

      if (data.subscriptionExpiry && Date.now() > data.subscriptionExpiry) {
        await chrome.storage.local.set({ tier: 'free' });
        return { tier: 'free', features: this.getFeatures('free'), expired: true };
      }

      return {
        tier,
        features,
        userId: data.userId,
        expiresAt: data.subscriptionExpiry,
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return { tier: 'free', features: this.getFeatures('free') };
    }
  }

  getFeatures(tier: string): TierFeatures {
    switch (tier) {
      case 'pro': return this.getProFeatures();
      case 'enterprise': return this.getEnterpriseFeatures();
      default: return this.getFreeFeatures();
    }
  }

  private getFreeFeatures(): TierFeatures {
    return {
      tier: 'free', dailyLimit: 20, concurrentProcesses: 1, customPrompts: false, maxCustomPrompts: 0,
      autoDownload: true, retryLogic: true, maxRetries: 1, notebooklmIntegration: false, podcasts: false,
      maxPodcasts: 0, cloudSync: false, multiTab: false, analytics: false, prioritySupport: false,
      apiAccess: false, teamCollaboration: false, whiteLabel: false,
    };
  }

  private getProFeatures(): TierFeatures {
    return {
      tier: 'pro', dailyLimit: Infinity, concurrentProcesses: 3, customPrompts: true, maxCustomPrompts: 50,
      autoDownload: true, retryLogic: true, maxRetries: 3, notebooklmIntegration: true, podcasts: true,
      maxPodcasts: 5, cloudSync: true, multiTab: true, analytics: true, prioritySupport: true,
      apiAccess: false, teamCollaboration: false, whiteLabel: false,
    };
  }

  private getEnterpriseFeatures(): TierFeatures {
    return {
      tier: 'enterprise', dailyLimit: Infinity, concurrentProcesses: 10, customPrompts: true, maxCustomPrompts: Infinity,
      autoDownload: true, retryLogic: true, maxRetries: 5, notebooklmIntegration: true, podcasts: true,
      maxPodcasts: Infinity, cloudSync: true, multiTab: true, analytics: true, prioritySupport: true,
      apiAccess: true, teamCollaboration: true, whiteLabel: true,
    };
  }

  async canProcessVideo(): Promise<boolean> {
    const { tier, dailyUsage, dailyLimit } = (await chrome.storage.local.get(['tier', 'dailyUsage', 'dailyLimit'])) as Record<string, any>;

    if (tier === 'pro' || tier === 'enterprise') return true;

    const usage = dailyUsage || 0;
    const limit = dailyLimit || 20;
    return usage < limit;
  }

  async getRemainingQuota(): Promise<number> {
    const { tier, dailyUsage, dailyLimit } = (await chrome.storage.local.get(['tier', 'dailyUsage', 'dailyLimit'])) as Record<string, any>;

    if (tier === 'pro' || tier === 'enterprise') return Infinity;

    const usage = dailyUsage || 0;
    const limit = dailyLimit || 20;
    return Math.max(0, limit - usage);
  }

  async incrementUsage(): Promise<number> {
    const { tier, dailyUsage = 0 } = (await chrome.storage.local.get(['tier', 'dailyUsage'])) as Record<string, any>;

    if (tier === 'free') {
      await chrome.storage.local.set({ dailyUsage: dailyUsage + 1 });
      return dailyUsage + 1;
    }

    return dailyUsage;
  }

  async upgrade(targetTier: string): Promise<{ checkoutUrl: string }> {
    try {
      const { userId } = (await chrome.storage.local.get('userId')) as { userId?: string };
      const checkoutUrl = `${this.apiUrl}/checkout?tier=${targetTier}&userId=${userId}`;
      chrome.tabs.create({ url: checkoutUrl });
      return { checkoutUrl };
    } catch (error) {
      console.error('Failed to initiate upgrade:', error);
      throw error;
    }
  }

  async verifySubscription(sessionId: string): Promise<any> {
    try {
      const response = await fetch(`${this.apiUrl}/verify-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) throw new Error('Verification failed');

      const data = await response.json();
      await chrome.storage.local.set({
        tier: data.tier,
        subscriptionExpiry: data.expiresAt,
        subscriptionId: data.subscriptionId,
      });

      return data;
    } catch (error) {
      console.error('Failed to verify subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(): Promise<{ cancelled: boolean }> {
    try {
      const { userId, subscriptionId } = (await chrome.storage.local.get(['userId', 'subscriptionId'])) as Record<string, any>;
      const response = await fetch(`${this.apiUrl}/cancel-subscription`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, subscriptionId }),
      });

      if (!response.ok) throw new Error('Cancellation failed');

      await chrome.storage.local.set({ tier: 'free', subscriptionExpiry: null, subscriptionId: null });
      return { cancelled: true };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  getPricing(): Record<string, PricingTier> {
    return {
      free: { name: 'Free', price: 0, period: null, features: ['20 videos per day', '1 concurrent process', 'Basic prompts only', 'Auto-download reports', 'Basic retry logic'] },
      pro: { name: 'Pro', price: 9.99, period: 'month', yearlyPrice: 99, yearlyDiscount: '17%', features: ['Unlimited videos', '3 concurrent processes', 'Custom prompts (50)', 'NotebookLM integration', 'Podcast creation (5 podcasts)', 'Cloud sync', 'Advanced retry logic', 'Priority support'] },
      enterprise: { name: 'Enterprise', price: 29.99, period: 'month', yearlyPrice: 299, yearlyDiscount: '17%', features: ['Everything in Pro', '10 concurrent processes', 'Unlimited custom prompts', 'Unlimited podcasts', 'API access', 'Team collaboration', 'White-label option', 'Dedicated support'] },
    };
  }

  async hasFeature(featureName: string): Promise<boolean> {
    const status = await this.checkStatus();
    return (status.features as any)[featureName] === true;
  }

  async getFeatureLimit(featureName: string): Promise<any> {
    const status = await this.checkStatus();
    return (status.features as any)[featureName];
  }
}

declare const __APP_CONFIG: Record<string, string> | undefined;

const subscriptionService = new SubscriptionService();
export default subscriptionService;
