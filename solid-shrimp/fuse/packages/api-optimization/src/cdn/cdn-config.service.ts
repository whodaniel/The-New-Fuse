import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'cloudfront' | 'fastly' | 'custom';
  domain: string;
  apiKey?: string;
  zoneId?: string;
  distributionId?: string;
  purgeEndpoint?: string;
}

export interface CDNPurgeResult {
  success: boolean;
  message: string;
  purgedUrls?: string[];
}

/**
 * CDN configuration and management service
 * Supports multiple CDN providers for static asset delivery and purging
 */
@Injectable()
export class CDNConfigService {
  private readonly logger = new Logger(CDNConfigService.name);
  private config!: CDNConfig;

  constructor(private configService: ConfigService) {
    this.initializeConfig();
  }

  private initializeConfig(): void {
    this.config = {
      enabled: this.configService.get('CDN_ENABLED', 'false') === 'true',
      provider: this.configService.get('CDN_PROVIDER', 'cloudflare') as any,
      domain: this.configService.get('CDN_DOMAIN', ''),
      apiKey: this.configService.get('CDN_API_KEY'),
      zoneId: this.configService.get('CDN_ZONE_ID'),
      distributionId: this.configService.get('CDN_DISTRIBUTION_ID'),
      purgeEndpoint: this.configService.get('CDN_PURGE_ENDPOINT')
    };

    this.logger.log(
      `CDN configured: ${this.config.enabled ? 'enabled' : 'disabled'}, provider: ${this.config.provider}`
    );
  }

  /**
   * Get CDN URL for an asset
   */
  getCDNUrl(assetPath: string): string {
    if (!this.config.enabled || !this.config.domain) {
      return assetPath;
    }

    // Remove leading slash if present
    const cleanPath = assetPath.startsWith('/') ? assetPath.slice(1) : assetPath;

    return `https://${this.config.domain}/${cleanPath}`;
  }

  /**
   * Purge CDN cache for specific URLs
   */
  async purgeUrls(urls: string[]): Promise<CDNPurgeResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'CDN not enabled'
      };
    }

    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeCloudflare(urls);
        case 'cloudfront':
          return await this.purgeCloudFront(urls);
        case 'fastly':
          return await this.purgeFastly(urls);
        default:
          return {
            success: false,
            message: `Unsupported CDN provider: ${this.config.provider}`
          };
      }
    } catch (error) {
      this.logger.error('CDN purge error:', error);
      return {
        success: false,
        message: `Purge failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Purge all CDN cache
   */
  async purgeAll(): Promise<CDNPurgeResult> {
    if (!this.config.enabled) {
      return {
        success: false,
        message: 'CDN not enabled'
      };
    }

    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return await this.purgeCloudflareAll();
        case 'cloudfront':
          return await this.purgeCloudFrontAll();
        case 'fastly':
          return await this.purgeFastlyAll();
        default:
          return {
            success: false,
            message: `Unsupported CDN provider: ${this.config.provider}`
          };
      }
    } catch (error) {
      this.logger.error('CDN purge all error:', error);
      return {
        success: false,
        message: `Purge all failed: ${(error as Error).message}`
      };
    }
  }

  /**
   * Cloudflare purge implementation
   */
  private async purgeCloudflare(urls: string[]): Promise<CDNPurgeResult> {
    if (!this.config.apiKey || !this.config.zoneId) {
      throw new Error('Cloudflare API key and zone ID required');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ files: urls })
      }
    );

    const result = await response.json();

    if (result.success) {
      this.logger.log(`Cloudflare cache purged for ${urls.length} URLs`);
      return {
        success: true,
        message: 'Cache purged successfully',
        purgedUrls: urls
      };
    }

    throw new Error(result.errors?.[0]?.message || 'Purge failed');
  }

  /**
   * Cloudflare purge all implementation
   */
  private async purgeCloudflareAll(): Promise<CDNPurgeResult> {
    if (!this.config.apiKey || !this.config.zoneId) {
      throw new Error('Cloudflare API key and zone ID required');
    }

    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${this.config.zoneId}/purge_cache`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ purge_everything: true })
      }
    );

    const result = await response.json();

    if (result.success) {
      this.logger.log('Cloudflare cache purged (all)');
      return {
        success: true,
        message: 'All cache purged successfully'
      };
    }

    throw new Error(result.errors?.[0]?.message || 'Purge all failed');
  }

  /**
   * CloudFront purge implementation
   */
  private async purgeCloudFront(urls: string[]): Promise<CDNPurgeResult> {
    this.logger.warn('CloudFront purge requires AWS SDK - implement as needed');
    return {
      success: false,
      message: 'CloudFront purge not implemented - use AWS SDK'
    };
  }

  /**
   * CloudFront purge all implementation
   */
  private async purgeCloudFrontAll(): Promise<CDNPurgeResult> {
    this.logger.warn('CloudFront purge all requires AWS SDK - implement as needed');
    return {
      success: false,
      message: 'CloudFront purge all not implemented - use AWS SDK'
    };
  }

  /**
   * Fastly purge implementation
   */
  private async purgeFastly(urls: string[]): Promise<CDNPurgeResult> {
    this.logger.warn('Fastly purge not implemented');
    return {
      success: false,
      message: 'Fastly purge not implemented'
    };
  }

  /**
   * Fastly purge all implementation
   */
  private async purgeFastlyAll(): Promise<CDNPurgeResult> {
    this.logger.warn('Fastly purge all not implemented');
    return {
      success: false,
      message: 'Fastly purge all not implemented'
    };
  }

  /**
   * Get CDN configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config, apiKey: undefined }; // Don't expose API key
  }

  /**
   * Check if CDN is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}
