/**
 * Stub for @uauth/js - Unstoppable Domains authentication
 *
 * The real @uauth/js package has dependencies (@unstoppabledomains/resolution)
 * that use CommonJS crypto modules not compatible with browser ES modules.
 *
 * This stub prevents the app from crashing on load.
 * When Unstoppable Domains auth is actually needed, use dynamic import().
 */

class UAuthStub {
  private config: any;

  constructor(config: any) {
    this.config = config;
    console.warn(
      '[The New Fuse] UAuth stub loaded - Unstoppable Domains auth is disabled. Use dynamic import for full functionality.'
    );
  }

  async loginWithPopup(): Promise<void> {
    throw new Error(
      'Unstoppable Domains auth is not available. The @uauth/js package has browser compatibility issues.'
    );
  }

  async loginCallback(): Promise<any> {
    throw new Error(
      'Unstoppable Domains auth is not available. The @uauth/js package has browser compatibility issues.'
    );
  }

  async user(): Promise<any> {
    throw new Error(
      'Unstoppable Domains auth is not available. The @uauth/js package has browser compatibility issues.'
    );
  }

  async logout(): Promise<void> {
    throw new Error(
      'Unstoppable Domains auth is not available. The @uauth/js package has browser compatibility issues.'
    );
  }
}

export default UAuthStub;
