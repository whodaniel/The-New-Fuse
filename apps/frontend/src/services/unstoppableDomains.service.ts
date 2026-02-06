import UAuth from '@uauth/js';

/**
 * Unstoppable Domains Authentication Service
 * Handles login, registration, and user profile retrieval via Unstoppable Domains
 */

export interface UnstoppableDomainsUser {
  sub: string; // Unstoppable Domain (e.g., "alice.crypto")
  wallet_address: string;
  wallet_type_hint?: string;
  eip4361_message?: string;
  eip4361_signature?: string;
}

export interface UnstoppableDomainsConfig {
  clientID: string;
  redirectUri: string;
  scope?: string;
}

class UnstoppableDomainsService {
  private uauth: UAuth | null = null;
  private config: UnstoppableDomainsConfig | null = null;

  /**
   * Initialize the Unstoppable Domains authentication client
   */
  initialize(config: UnstoppableDomainsConfig): void {
    this.config = {
      scope: 'openid wallet',
      ...config,
    };

    this.uauth = new UAuth({
      clientID: this.config.clientID,
      redirectUri: this.config.redirectUri,
      scope: this.config.scope,
    });

    console.log('Unstoppable Domains service initialized');
  }

  /**
   * Check if the service is initialized
   */
  private ensureInitialized(): void {
    if (!this.uauth) {
      throw new Error('UnstoppableDomainsService not initialized. Call initialize() first.');
    }
  }

  /**
   * Initiate login flow - redirects user to Unstoppable Domains
   */
  async login(): Promise<void> {
    this.ensureInitialized();
    try {
      await this.uauth!.loginWithPopup();
    } catch (error) {
      console.error('Unstoppable Domains login error:', error);
      throw error;
    }
  }

  /**
   * Handle the callback after redirect from Unstoppable Domains
   */
  async loginCallback(): Promise<UnstoppableDomainsUser> {
    this.ensureInitialized();
    try {
      const authorization = await this.uauth!.loginCallback();
      const user = await this.getUser();
      return user;
    } catch (error) {
      console.error('Unstoppable Domains callback error:', error);
      throw error;
    }
  }

  /**
   * Get the current authenticated user
   */
  async getUser(): Promise<UnstoppableDomainsUser> {
    this.ensureInitialized();
    try {
      const user = await this.uauth!.user();
      return user as UnstoppableDomainsUser;
    } catch (error) {
      console.error('Error fetching Unstoppable Domains user:', error);
      throw error;
    }
  }

  /**
   * Check if user is currently authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    this.ensureInitialized();
    try {
      const user = await this.uauth!.user();
      return !!user;
    } catch {
      return false;
    }
  }

  /**
   * Logout the current user
   */
  async logout(): Promise<void> {
    this.ensureInitialized();
    try {
      await this.uauth!.logout();
      console.log('Logged out from Unstoppable Domains');
    } catch (error) {
      console.error('Unstoppable Domains logout error:', error);
      throw error;
    }
  }

  /**
   * Get the user's domain name
   */
  async getDomainName(): Promise<string | null> {
    try {
      const user = await this.getUser();
      return user.sub || null;
    } catch {
      return null;
    }
  }

  /**
   * Get the user's wallet address
   */
  async getWalletAddress(): Promise<string | null> {
    try {
      const user = await this.getUser();
      return user.wallet_address || null;
    } catch {
      return null;
    }
  }
}

// Export singleton instance
export const unstoppableDomainsService = new UnstoppableDomainsService();
export default unstoppableDomainsService;
