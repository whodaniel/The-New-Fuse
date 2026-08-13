// Subscription Service
// Manages user subscription tiers, feature access, and usage limits

class SubscriptionService {
  constructor() {
    this.apiUrl = (typeof __APP_CONFIG !== 'undefined' && __APP_CONFIG.API_URL) || 'https://api.aivideointelligence.com';
    this.tiers = {
      free: 'free',
      pro: 'pro',
      enterprise: 'enterprise',
    };
  }

  // Check current subscription status
  async checkStatus() {
    try {
      const data = await chrome.storage.local.get(['tier', 'userId', 'subscriptionExpiry']);

      const tier = data.tier || 'free';
      const features = this.getFeatures(tier);

      // Check if subscription is expired
      if (data.subscriptionExpiry && Date.now() > data.subscriptionExpiry) {
        // Downgrade to free
        await chrome.storage.local.set({ tier: 'free' });
        return {
          tier: 'free',
          features: this.getFeatures('free'),
          expired: true,
        };
      }

      return {
        tier: tier,
        features: features,
        userId: data.userId,
        expiresAt: data.subscriptionExpiry,
      };
    } catch (error) {
      console.error('Failed to check subscription:', error);
      return {
        tier: 'free',
        features: this.getFeatures('free'),
      };
    }
  }

  // Get features for a specific tier
  getFeatures(tier) {
    switch (tier) {
      case 'pro':
        return this.getProFeatures();
      case 'enterprise':
        return this.getEnterpriseFeatures();
      default:
        return this.getFreeFeatures();
    }
  }

  // Free tier features
  getFreeFeatures() {
    return {
      tier: 'free',
      dailyLimit: 20,
      concurrentProcesses: 1,
      customPrompts: false,
      maxCustomPrompts: 0,
      autoDownload: true,
      retryLogic: true,
      maxRetries: 1,
      notebooklmIntegration: false,
      podcasts: false,
      maxPodcasts: 0,
      cloudSync: false,
      multiTab: false,
      analytics: false,
      prioritySupport: false,
      apiAccess: false,
      teamCollaboration: false,
      whiteLabel: false,
    };
  }

  // Pro tier features
  getProFeatures() {
    return {
      tier: 'pro',
      dailyLimit: Infinity,
      concurrentProcesses: 3,
      customPrompts: true,
      maxCustomPrompts: 50,
      autoDownload: true,
      retryLogic: true,
      maxRetries: 3,
      notebooklmIntegration: true,
      podcasts: true,
      maxPodcasts: 5,
      cloudSync: true,
      multiTab: true,
      analytics: true,
      prioritySupport: true,
      apiAccess: false,
      teamCollaboration: false,
      whiteLabel: false,
    };
  }

  // Enterprise tier features
  getEnterpriseFeatures() {
    return {
      tier: 'enterprise',
      dailyLimit: Infinity,
      concurrentProcesses: 10,
      customPrompts: true,
      maxCustomPrompts: Infinity,
      autoDownload: true,
      retryLogic: true,
      maxRetries: 5,
      notebooklmIntegration: true,
      podcasts: true,
      maxPodcasts: Infinity,
      cloudSync: true,
      multiTab: true,
      analytics: true,
      prioritySupport: true,
      apiAccess: true,
      teamCollaboration: true,
      whiteLabel: true,
    };
  }

  // Check if user can process a video
  async canProcessVideo() {
    const { tier, dailyUsage, dailyLimit } = await chrome.storage.local.get([
      'tier',
      'dailyUsage',
      'dailyLimit',
    ]);

    // Paid tiers have unlimited processing
    if (tier === 'pro' || tier === 'enterprise') {
      return true;
    }

    // Free tier: check daily limit
    const usage = dailyUsage || 0;
    const limit = dailyLimit || 20;

    return usage < limit;
  }

  // Get remaining daily quota
  async getRemainingQuota() {
    const { tier, dailyUsage, dailyLimit } = await chrome.storage.local.get([
      'tier',
      'dailyUsage',
      'dailyLimit',
    ]);

    if (tier === 'pro' || tier === 'enterprise') {
      return Infinity;
    }

    const usage = dailyUsage || 0;
    const limit = dailyLimit || 20;

    return Math.max(0, limit - usage);
  }

  // Increment usage counter
  async incrementUsage() {
    const { tier, dailyUsage = 0 } = await chrome.storage.local.get(['tier', 'dailyUsage']);

    // Only track for free tier
    if (tier === 'free') {
      await chrome.storage.local.set({ dailyUsage: dailyUsage + 1 });
      return dailyUsage + 1;
    }

    return dailyUsage;
  }

  // Upgrade to a paid tier
  async upgrade(targetTier) {
    try {
      const { userId } = await chrome.storage.local.get('userId');

      // Create checkout session
      const checkoutUrl = `${this.apiUrl}/checkout?tier=${targetTier}&userId=${userId}`;

      // Open checkout in new tab
      chrome.tabs.create({ url: checkoutUrl });

      return { checkoutUrl };
    } catch (error) {
      console.error('Failed to initiate upgrade:', error);
      throw error;
    }
  }

  // Verify subscription (called after payment)
  async verifySubscription(sessionId) {
    try {
      const response = await fetch(`${this.apiUrl}/verify-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId }),
      });

      if (!response.ok) {
        throw new Error('Verification failed');
      }

      const data = await response.json();

      // Update local storage
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

  // Cancel subscription
  async cancelSubscription() {
    try {
      const { userId, subscriptionId } = await chrome.storage.local.get([
        'userId',
        'subscriptionId',
      ]);

      const response = await fetch(`${this.apiUrl}/cancel-subscription`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, subscriptionId }),
      });

      if (!response.ok) {
        throw new Error('Cancellation failed');
      }

      // Update to free tier
      await chrome.storage.local.set({
        tier: 'free',
        subscriptionExpiry: null,
        subscriptionId: null,
      });

      return { cancelled: true };
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
      throw error;
    }
  }

  // Get pricing information
  getPricing() {
    return {
      free: {
        name: 'Free',
        price: 0,
        period: null,
        features: [
          '20 videos per day',
          '1 concurrent process',
          'Basic prompts only',
          'Auto-download reports',
          'Basic retry logic',
        ],
      },
      pro: {
        name: 'Pro',
        price: 9.99,
        period: 'month',
        yearlyPrice: 99,
        yearlyDiscount: '17%',
        features: [
          'Unlimited videos',
          '3 concurrent processes',
          'Custom prompts (50)',
          'NotebookLM integration',
          'Podcast creation (5 podcasts)',
          'Cloud sync',
          'Advanced retry logic',
          'Priority support',
        ],
      },
      enterprise: {
        name: 'Enterprise',
        price: 29.99,
        period: 'month',
        yearlyPrice: 299,
        yearlyDiscount: '17%',
        features: [
          'Everything in Pro',
          '10 concurrent processes',
          'Unlimited custom prompts',
          'Unlimited podcasts',
          'API access',
          'Team collaboration',
          'White-label option',
          'Dedicated support',
        ],
      },
    };
  }

  // Check if feature is available
  async hasFeature(featureName) {
    const status = await this.checkStatus();
    return status.features[featureName] === true;
  }

  // Get feature limit
  async getFeatureLimit(featureName) {
    const status = await this.checkStatus();
    return status.features[featureName];
  }
}

// Export singleton instance
const subscriptionService = new SubscriptionService();
export default subscriptionService;
