/**
 * Unstoppable Domains Authentication Service
 * Implements Login with Unstoppable using UAuth protocol
 */

import { Logger } from '../utils/logger.js';

/**
 * UAuth Configuration
 */
export interface UAuthConfig {
  clientID: string;
  clientSecret?: string;
  redirectUri: string;
  scope: string;
  responseMode?: 'query' | 'fragment';
  fallbackIssuer?: string;
}

/**
 * User information returned from Unstoppable Domains
 */
export interface UnstoppableUser {
  sub: string; // Domain name (e.g., "user.crypto")
  wallet_address?: string;
  wallet_type_hint?: string;
  eip4361_message?: string;
  eip4361_signature?: string;

  // Optional profile information
  name?: string;
  email?: string;
  email_verified?: boolean;
  picture?: string;

  // Verified accounts
  verified_addresses?: VerifiedAddress[];

  // Humanity check
  humanity_check_id?: string;
  humanity_check?: boolean;
}

/**
 * Verified blockchain address
 */
export interface VerifiedAddress {
  address: string;
  symbol: string; // ETH, MATIC, SOL, etc.
  message?: string;
  signature?: string;
}

/**
 * Authorization response
 */
export interface UAuthAuthorization {
  accessToken: string;
  expiresAt: number;
  idToken: {
    sub: string;
    [key: string]: any;
  };
  scope: string;
}

/**
 * Unstoppable Domains Authentication Service
 */
export class UnstoppableDomainsAuth {
  private logger: Logger;
  private config: UAuthConfig | null = null;
  private authorization: UAuthAuthorization | null = null;
  private user: UnstoppableUser | null = null;

  // Unstoppable Domains auth endpoints
  private readonly AUTH_SERVER = 'https://auth.unstoppabledomains.com';
  private readonly AUTHORIZE_ENDPOINT = `${this.AUTH_SERVER}/authorize`;
  private readonly TOKEN_ENDPOINT = `${this.AUTH_SERVER}/oauth/token`;
  private readonly USERINFO_ENDPOINT = `${this.AUTH_SERVER}/userinfo`;

  constructor(logger?: Logger) {
    this.logger =
      logger ||
      new Logger({
        name: 'UnstoppableDomainsAuth',
        level: 'info',
      });
    this.loadConfig();
    this.loadSession();
  }

  /**
   * Load configuration from Chrome storage
   */
  private async loadConfig(): Promise<void> {
    try {
      const result = await chrome.storage.sync.get(['udAuthConfig']);
      if (result.udAuthConfig) {
        this.config = result.udAuthConfig;
        this.logger.info('Unstoppable Domains config loaded');
      }
    } catch (error) {
      this.logger.error('Failed to load UD config', error);
    }
  }

  /**
   * Load existing session from storage
   */
  private async loadSession(): Promise<void> {
    try {
      const result = await chrome.storage.local.get(['udAuthorization', 'udUser']);

      if (result.udAuthorization) {
        this.authorization = result.udAuthorization;

        // Check if token is expired
        if (this.authorization.expiresAt < Date.now()) {
          this.logger.info('Session expired, clearing');
          await this.logout();
          return;
        }
      }

      if (result.udUser) {
        this.user = result.udUser;
        this.logger.info('Session restored for user', this.user.sub);
      }
    } catch (error) {
      this.logger.error('Failed to load session', error);
    }
  }

  /**
   * Save session to storage
   */
  private async saveSession(): Promise<void> {
    try {
      await chrome.storage.local.set({
        udAuthorization: this.authorization,
        udUser: this.user,
      });
      this.logger.info('Session saved');
    } catch (error) {
      this.logger.error('Failed to save session', error);
    }
  }

  /**
   * Configure the UAuth client
   */
  async configure(config: UAuthConfig): Promise<void> {
    this.config = config;
    await chrome.storage.sync.set({ udAuthConfig: config });
    this.logger.info('Unstoppable Domains authentication configured');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return (
      this.authorization !== null &&
      this.user !== null &&
      this.authorization.expiresAt > Date.now()
    );
  }

  /**
   * Get current user
   */
  getUser(): UnstoppableUser | null {
    return this.user;
  }

  /**
   * Get authorization
   */
  getAuthorization(): UAuthAuthorization | null {
    return this.authorization;
  }

  /**
   * Login with popup flow
   */
  async loginWithPopup(): Promise<UnstoppableUser> {
    if (!this.config) {
      throw new Error('UAuth not configured. Call configure() first.');
    }

    return new Promise((resolve, reject) => {
      try {
        // Generate state and nonce for security
        const state = this.generateRandomString();
        const nonce = this.generateRandomString();

        // Build authorization URL
        const authUrl = this.buildAuthorizationUrl(state, nonce);

        // Open popup window
        const width = 500;
        const height = 700;
        const left = window.screen.width / 2 - width / 2;
        const top = window.screen.height / 2 - height / 2;

        const popup = window.open(
          authUrl,
          'unstoppable-login',
          `width=${width},height=${height},left=${left},top=${top},popup=yes`
        );

        if (!popup) {
          reject(new Error('Failed to open popup window'));
          return;
        }

        // Listen for callback
        const messageListener = async (event: MessageEvent) => {
          // Verify origin
          if (!event.origin.includes('unstoppabledomains.com')) {
            return;
          }

          try {
            const { code, receivedState } = event.data;

            // Verify state
            if (receivedState !== state) {
              throw new Error('State mismatch - possible CSRF attack');
            }

            // Exchange code for tokens
            await this.handleAuthorizationCode(code, nonce);

            // Fetch user info
            const user = await this.fetchUserInfo();

            window.removeEventListener('message', messageListener);
            popup.close();

            resolve(user);
          } catch (error) {
            window.removeEventListener('message', messageListener);
            popup.close();
            reject(error);
          }
        };

        window.addEventListener('message', messageListener);

        // Check if popup was closed
        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', messageListener);
            reject(new Error('Popup closed by user'));
          }
        }, 500);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Login with redirect flow
   */
  async login(): Promise<void> {
    if (!this.config) {
      throw new Error('UAuth not configured. Call configure() first.');
    }

    // Generate state and nonce
    const state = this.generateRandomString();
    const nonce = this.generateRandomString();

    // Store state and nonce for verification
    await chrome.storage.local.set({ udState: state, udNonce: nonce });

    // Build authorization URL
    const authUrl = this.buildAuthorizationUrl(state, nonce);

    // Redirect to authorization
    window.location.href = authUrl;
  }

  /**
   * Handle login callback after redirect
   */
  async loginCallback(): Promise<UnstoppableUser> {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const state = params.get('state');

    if (!code || !state) {
      throw new Error('Missing authorization code or state');
    }

    // Verify state
    const result = await chrome.storage.local.get(['udState', 'udNonce']);
    if (result.udState !== state) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    // Exchange code for tokens
    await this.handleAuthorizationCode(code, result.udNonce);

    // Fetch user info
    return await this.fetchUserInfo();
  }

  /**
   * Build authorization URL
   */
  private buildAuthorizationUrl(state: string, nonce: string): string {
    const params = new URLSearchParams({
      client_id: this.config!.clientID,
      redirect_uri: this.config!.redirectUri,
      response_type: 'code',
      response_mode: this.config!.responseMode || 'query',
      scope: this.config!.scope,
      state,
      nonce,
    });

    return `${this.AUTHORIZE_ENDPOINT}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  private async handleAuthorizationCode(code: string, nonce: string): Promise<void> {
    try {
      const response = await fetch(this.TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          client_id: this.config!.clientID,
          ...(this.config!.clientSecret && { client_secret: this.config!.clientSecret }),
          redirect_uri: this.config!.redirectUri,
        }),
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Decode ID token (basic JWT decode)
      const idToken = this.decodeJWT(data.id_token);

      // Verify nonce
      if (idToken.nonce !== nonce) {
        throw new Error('Nonce mismatch');
      }

      // Store authorization
      this.authorization = {
        accessToken: data.access_token,
        expiresAt: Date.now() + data.expires_in * 1000,
        idToken,
        scope: data.scope,
      };

      await this.saveSession();
      this.logger.info('Authorization successful');
    } catch (error) {
      this.logger.error('Failed to exchange authorization code', error);
      throw error;
    }
  }

  /**
   * Fetch user information
   */
  private async fetchUserInfo(): Promise<UnstoppableUser> {
    if (!this.authorization) {
      throw new Error('Not authorized');
    }

    try {
      const response = await fetch(this.USERINFO_ENDPOINT, {
        headers: {
          Authorization: `Bearer ${this.authorization.accessToken}`,
        },
      });

      if (!response.ok) {
        throw new Error(`UserInfo request failed: ${response.statusText}`);
      }

      this.user = await response.json();
      await this.saveSession();

      this.logger.info('User info fetched', {
        domain: this.user!.sub,
        wallet: this.user!.wallet_address,
      });

      return this.user!;
    } catch (error) {
      this.logger.error('Failed to fetch user info', error);
      throw error;
    }
  }

  /**
   * Get verified accounts for the current user
   */
  async getVerifiedAccounts(): Promise<VerifiedAddress[]> {
    if (!this.user) {
      throw new Error('Not authenticated');
    }

    return this.user.verified_addresses || [];
  }

  /**
   * Logout and clear session
   */
  async logout(): Promise<void> {
    this.authorization = null;
    this.user = null;

    await chrome.storage.local.remove(['udAuthorization', 'udUser', 'udState', 'udNonce']);

    this.logger.info('User logged out');
  }

  /**
   * Generate random string for state/nonce
   */
  private generateRandomString(length: number = 32): string {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const values = new Uint8Array(length);
    crypto.getRandomValues(values);
    return Array.from(values)
      .map((v) => charset[v % charset.length])
      .join('');
  }

  /**
   * Basic JWT decoder
   */
  private decodeJWT(token: string): any {
    try {
      const parts = token.split('.');
      if (parts.length !== 3) {
        throw new Error('Invalid JWT format');
      }

      const payload = parts[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch (error) {
      this.logger.error('Failed to decode JWT', error);
      throw new Error('Invalid JWT token');
    }
  }
}

// Create singleton instance
export const unstoppableAuth = new UnstoppableDomainsAuth();
