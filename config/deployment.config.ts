/**
 * The New Fuse - Production-Ready Deployment Configuration
 * Sophisticated environment-aware configuration management
 */

export interface DeploymentEnvironment {
  name: string;
  apiBaseUrl: string;
  frontendUrl: string;
  wsBaseUrl: string;
  cdnUrl?: string;
  features: {
    analytics: boolean;
    debugging: boolean;
    hotReload: boolean;
  };
}

export interface DeploymentConfig {
  environment: string;
  isDevelopment: boolean;
  isProduction: boolean;
  isStaging: boolean;
  
  // Core URLs - automatically determined
  apiUrl: string;
  frontendUrl: string;
  wsUrl: string;
  
  // Build configuration
  buildTarget: 'development' | 'staging' | 'production';
  assetPrefix: string;
  publicPath: string;
  
  // Security
  enableCORS: boolean;
  allowedOrigins: string[];
  
  // Performance
  enableCompression: boolean;
  enableCaching: boolean;
  cacheTTL: number;
}

/**
 * Environment Detection and Configuration
 */
class DeploymentConfigManager {
  private static instance: DeploymentConfigManager;
  
  private environments: Record<string, DeploymentEnvironment> = {
    development: {
      name: 'development',
      apiBaseUrl: this.getRelativeUrl('/api'),
      frontendUrl: this.getRelativeUrl('/'),
      wsBaseUrl: this.getWebSocketUrl(),
      features: {
        analytics: false,
        debugging: true,
        hotReload: true,
      }
    },
    staging: {
      name: 'staging',
      apiBaseUrl: this.getRelativeUrl('/api'),
      frontendUrl: this.getRelativeUrl('/'),
      wsBaseUrl: this.getWebSocketUrl(),
      features: {
        analytics: true,
        debugging: true,
        hotReload: false,
      }
    },
    production: {
      name: 'production',
      apiBaseUrl: this.getRelativeUrl('/api'),
      frontendUrl: this.getRelativeUrl('/'),
      wsBaseUrl: this.getWebSocketUrl(),
      cdnUrl: process.env.CDN_URL,
      features: {
        analytics: true,
        debugging: false,
        hotReload: false,
      }
    }
  };

  static getInstance(): DeploymentConfigManager {
    if (!DeploymentConfigManager.instance) {
      DeploymentConfigManager.instance = new DeploymentConfigManager();
    }
    return DeploymentConfigManager.instance;
  }

  /**
   * Get current deployment configuration
   */
  getConfig(): DeploymentConfig {
    const environment = this.detectEnvironment();
    const env = this.environments[environment];
    
    return {
      environment,
      isDevelopment: environment === 'development',
      isProduction: environment === 'production',
      isStaging: environment === 'staging',
      
      apiUrl: env.apiBaseUrl,
      frontendUrl: env.frontendUrl,
      wsUrl: env.wsBaseUrl,
      
      buildTarget: environment as 'development' | 'staging' | 'production',
      assetPrefix: this.getAssetPrefix(),
      publicPath: this.getPublicPath(),
      
      enableCORS: environment !== 'development',
      allowedOrigins: this.getAllowedOrigins(),
      
      enableCompression: environment === 'production',
      enableCaching: environment === 'production',
      cacheTTL: environment === 'production' ? 86400 : 0,
    };
  }

  /**
   * Smart environment detection
   */
  private detectEnvironment(): string {
    // Explicit environment variable
    if (process.env.NODE_ENV === 'production') return 'production';
    if (process.env.NODE_ENV === 'staging') return 'staging';
    if (process.env.NODE_ENV === 'development') return 'development';
    
    // Deployment platform detection
    if (process.env.VERCEL) return process.env.VERCEL_ENV || 'production';
    if (process.env.NETLIFY) return process.env.CONTEXT === 'production' ? 'production' : 'staging';
    if (process.env.HEROKU_APP_NAME) return 'production';
    if (process.env.AWS_EXECUTION_ENV) return 'production';
    if (process.env.RENDER) return 'production';
    
    // Docker detection
    if (process.env.KUBERNETES_SERVICE_HOST) return 'production';
    if (process.env.DOCKER_CONTAINER) return 'production';
    
    // Localhost detection
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.')) {
        return 'development';
      }
    }
    
    // Default to development for safety
    return 'development';
  }

  /**
   * Generate relative URLs that work in any environment
   */
  private getRelativeUrl(path: string): string {
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      return `${origin}${path}`;
    }
    
    // Server-side: use environment variables or defaults
    const protocol = process.env.HTTPS === 'true' ? 'https:' : 'http:';
    const host = process.env.HOST || 'localhost';
    const port = process.env.PORT || '3000';
    
    if (port === '80' || port === '443') {
      return `${protocol}//${host}${path}`;
    }
    
    return `${protocol}//${host}:${port}${path}`;
  }

  /**
   * Smart WebSocket URL generation
   */
  private getWebSocketUrl(): string {
    if (typeof window !== 'undefined') {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      return `${protocol}//${host}/ws`;
    }
    
    const protocol = process.env.HTTPS === 'true' ? 'wss:' : 'ws:';
    const host = process.env.HOST || 'localhost';
    const wsPort = process.env.WS_PORT || process.env.PORT || '3000';
    
    return `${protocol}//${host}:${wsPort}/ws`;
  }

  /**
   * Asset prefix for CDN support
   */
  private getAssetPrefix(): string {
    if (process.env.CDN_URL) {
      return process.env.CDN_URL;
    }
    
    if (process.env.VERCEL_URL) {
      return `https://${process.env.VERCEL_URL}`;
    }
    
    return '';
  }

  /**
   * Public path for assets
   */
  private getPublicPath(): string {
    const basePath = process.env.BASE_PATH || '/';
    return basePath.endsWith('/') ? basePath : `${basePath}/`;
  }

  /**
   * CORS allowed origins
   */
  private getAllowedOrigins(): string[] {
    if (process.env.ALLOWED_ORIGINS) {
      return process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim());
    }
    
    const config = this.getConfig();
    return [config.frontendUrl];
  }
}

// Export singleton instance
export const deploymentConfig = DeploymentConfigManager.getInstance().getConfig();
export const configManager = DeploymentConfigManager.getInstance();

// Helper functions for common use cases
export const getApiUrl = (endpoint: string = '') => {
  return `${deploymentConfig.apiUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
};

export const getAssetUrl = (asset: string) => {
  const prefix = deploymentConfig.assetPrefix;
  return prefix ? `${prefix}${asset}` : asset;
};

export const getWsUrl = (path: string = '') => {
  return `${deploymentConfig.wsUrl}${path.startsWith('/') ? path : `/${path}`}`;
};

export default deploymentConfig;