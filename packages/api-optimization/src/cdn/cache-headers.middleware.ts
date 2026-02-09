import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { ConfigService } from '@nestjs/config';

export interface CacheHeadersConfig {
  staticAssets: {
    maxAge: number;
    immutable?: boolean;
  };
  apiResponses: {
    maxAge: number;
    private?: boolean;
    mustRevalidate?: boolean;
  };
  noCache: string[]; // Paths that should not be cached
}

/**
 * Middleware to set optimal cache headers for browser and CDN caching
 */
@Injectable()
export class CacheHeadersMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CacheHeadersMiddleware.name);
  private config!: CacheHeadersConfig;

  constructor(private configService: ConfigService) {
    this.initializeConfig();
  }

  private initializeConfig(): void {
    this.config = {
      staticAssets: {
        maxAge: this.configService.get('CACHE_STATIC_MAX_AGE', 31536000), // 1 year
        immutable: true
      },
      apiResponses: {
        maxAge: this.configService.get('CACHE_API_MAX_AGE', 300), // 5 minutes
        private: false,
        mustRevalidate: true
      },
      noCache: ['/api/auth', '/api/admin', '/health', '/metrics']
    };
  }

  use(req: Request, res: Response, next: NextFunction): void {
    // Determine if this is a static asset or API response
    if (this.isStaticAsset(req)) {
      this.setStaticAssetHeaders(res);
    } else if (this.shouldCache(req)) {
      this.setAPIResponseHeaders(res);
    } else {
      this.setNoCacheHeaders(res);
    }

    next();
  }

  private isStaticAsset(req: Request): boolean {
    const staticExtensions = [
      '.js',
      '.css',
      '.jpg',
      '.jpeg',
      '.png',
      '.gif',
      '.svg',
      '.ico',
      '.woff',
      '.woff2',
      '.ttf',
      '.eot',
      '.webp',
      '.avif'
    ];

    return staticExtensions.some(ext => req.path.endsWith(ext));
  }

  private shouldCache(req: Request): boolean {
    // Don't cache non-GET requests
    if (req.method !== 'GET') {
      return false;
    }

    // Check if path is in no-cache list
    return !this.config.noCache.some(path => req.path.startsWith(path));
  }

  private setStaticAssetHeaders(res: Response): void {
    const maxAge = this.config.staticAssets.maxAge;
    const directives = [`public`, `max-age=${maxAge}`];

    if (this.config.staticAssets.immutable) {
      directives.push('immutable');
    }

    res.setHeader('Cache-Control', directives.join(', '));

    // Set Expires header
    const expiryDate = new Date(Date.now() + maxAge * 1000);
    res.setHeader('Expires', expiryDate.toUTCString());

    // Set Vary header for content negotiation
    res.setHeader('Vary', 'Accept-Encoding');

    this.logger.debug(`Static asset cache headers set: ${res.getHeader('Cache-Control')}`);
  }

  private setAPIResponseHeaders(res: Response): void {
    const maxAge = this.config.apiResponses.maxAge;
    const directives = [];

    if (this.config.apiResponses.private) {
      directives.push('private');
    } else {
      directives.push('public');
    }

    directives.push(`max-age=${maxAge}`);

    if (this.config.apiResponses.mustRevalidate) {
      directives.push('must-revalidate');
    }

    res.setHeader('Cache-Control', directives.join(', '));

    // Set Expires header
    const expiryDate = new Date(Date.now() + maxAge * 1000);
    res.setHeader('Expires', expiryDate.toUTCString());

    // Set Vary header for API responses
    res.setHeader('Vary', 'Accept, Accept-Encoding, Authorization');

    this.logger.debug(`API cache headers set: ${res.getHeader('Cache-Control')}`);
  }

  private setNoCacheHeaders(res: Response): void {
    res.setHeader(
      'Cache-Control',
      'no-store, no-cache, must-revalidate, proxy-revalidate'
    );
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    this.logger.debug('No-cache headers set');
  }
}
