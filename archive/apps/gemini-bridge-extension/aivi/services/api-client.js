class APIClient {
  constructor() {
    this.baseURL = 'https://aivideointel.thenewfuse.com/api';
  }

  async request(endpoint, options = {}, retryCount = 0) {
    const token = await this.getToken();
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        ...options,
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        // Handle 401 Unauthorized - token may be expired
        if (response.status === 401 && retryCount === 0) {
          console.warn('⚠️ 401 Unauthorized - JWT token may be expired');

          // Try to get user profile again to refresh JWT
          const stored = await chrome.storage.local.get(['userProfile']);
          if (stored.userProfile) {
            console.log('🔄 Attempting to refresh JWT token...');
            try {
              await this.login({
                googleId: stored.userProfile.id,
                email: stored.userProfile.email,
                displayName: stored.userProfile.name,
                avatarUrl: stored.userProfile.picture,
              });

              // Retry the original request with new token
              console.log('✅ JWT refreshed, retrying original request...');
              return await this.request(endpoint, options, retryCount + 1);
            } catch (refreshError) {
              console.error('❌ Failed to refresh JWT:', refreshError);
              // Clear auth state
              await chrome.storage.local.set({
                token: null,
                isAuthenticated: false,
              });
            }
          }
        }

        console.error(
          'API Error Response:',
          JSON.stringify(
            {
              status: response.status,
              statusText: response.statusText,
              data: data,
              endpoint: endpoint,
            },
            null,
            2
          )
        );

        throw new Error(
          data.error?.message ||
            data.message ||
            `API request failed: ${response.status} ${response.statusText}`
        );
      }

      return data;
    } catch (error) {
      console.error(
        'API Request Failed:',
        JSON.stringify(
          {
            endpoint: `${this.baseURL}${endpoint}`,
            error: error.message,
            stack: error.stack,
          },
          null,
          2
        )
      );
      throw error;
    }
  }

  async getToken() {
    const { token } = await chrome.storage.local.get('token');
    return token;
  }

  // Auth
  async login(googleAuthData) {
    const data = await this.request('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleAuthData),
    });

    await chrome.storage.local.set({ token: data.data.token });
    return data;
  }

  async getMe() {
    return this.request('/auth/me');
  }

  // Queue
  async addToQueue(videos) {
    return this.request('/queue', {
      method: 'POST',
      body: JSON.stringify({ videos }),
    });
  }

  async getQueue(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/queue?${query}`);
  }

  async updateVideoStatus(videoId, status, errorMessage) {
    return this.request(`/queue/${videoId}`, {
      method: 'PATCH',
      body: JSON.stringify({ status, errorMessage }),
    });
  }

  // Subscriptions
  async getSubscriptionStatus() {
    return this.request('/subscriptions/status');
  }

  async createCheckoutSession(tier, billingPeriod) {
    return this.request('/subscriptions/checkout', {
      method: 'POST',
      body: JSON.stringify({ tier, billingPeriod }),
    });
  }

  // Reports
  async createReport(videoQueueId, segmentIndex, contentMarkdown, contentJson) {
    return this.request('/reports', {
      method: 'POST',
      body: JSON.stringify({
        videoQueueId,
        segmentIndex,
        contentMarkdown,
        contentJson,
      }),
    });
  }

  async getReports(params = {}) {
    const query = new URLSearchParams(params);
    return this.request(`/reports?${query}`);
  }
}

export default new APIClient();
