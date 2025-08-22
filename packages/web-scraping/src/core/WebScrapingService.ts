/**
 * Core Web Scraping Service
 * 
 * Provides unified interface for web scraping with both simple HTTP requests
 * and full browser automation capabilities.
 */

import axios, { AxiosResponse } from 'axios';
import puppeteer, { Browser, Page } from 'puppeteer';
import * as cheerio from 'cheerio';
import urlParse from 'url-parse';
import { lookup } from 'mime-types';
import { 
  WebScrapingConfig, 
  ScrapingResult, 
  ContentExtractionOptions,
  BrowserSession,
  SecurityPolicy 
} from '../types';
import { BaseErrorHandler } from '@the-new-fuse/core-error-handling';
import { BaseMonitoringSystem } from '@the-new-fuse/core-monitoring';

export class WebScrapingService {
  private readonly errorHandler: BaseErrorHandler;
  private readonly monitoring: BaseMonitoringSystem;
  private readonly activeSessions = new Map<string, BrowserSession>();
  private readonly securityPolicy: SecurityPolicy;
  private readonly defaultConfig: WebScrapingConfig;

  constructor(
    securityPolicy: SecurityPolicy = {},
    defaultConfig: WebScrapingConfig = {}
  ) {
    this.errorHandler = new BaseErrorHandler();
    this.monitoring = new BaseMonitoringSystem();
    this.securityPolicy = {
      maxFileSize: 50 * 1024 * 1024, // 50MB
      allowedContentTypes: [
        'text/html',
        'text/plain',
        'application/json',
        'application/xml',
        'text/xml'
      ],
      rateLimit: {
        requests: 100,
        windowMs: 60000 // 1 minute
      },
      contentFiltering: true,
      ...securityPolicy
    };
    this.defaultConfig = {
      timeout: 30000,
      userAgent: 'Mozilla/5.0 (compatible; TheNewFuse-WebScraper/1.0)',
      maxRedirects: 5,
      enableJavaScript: false,
      viewport: { width: 1920, height: 1080 },
      ...defaultConfig
    };
  }

  /**
   * Scrape a webpage using simple HTTP request (fast, no JS)
   */
  async scrapeSimple(
    url: string, 
    config: WebScrapingConfig = {},
    extractionOptions: ContentExtractionOptions = {}
  ): Promise<ScrapingResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // Security validation
      await this.validateUrl(url);

      this.monitoring.recordMetric('web_scraping_request', 1, { method: 'simple', url });

      // Make HTTP request
      const response: AxiosResponse = await axios.get(url, {
        timeout: finalConfig.timeout,
        maxRedirects: finalConfig.maxRedirects,
        headers: {
          'User-Agent': finalConfig.userAgent,
          ...finalConfig.headers
        },
        validateStatus: () => true, // Accept all status codes
        maxContentLength: this.securityPolicy.maxFileSize
      });

      // Validate content type
      const contentType = response.headers['content-type'] || '';
      if (!this.isAllowedContentType(contentType)) {
        throw new Error(`Content type not allowed: ${contentType}`);
      }

      // Extract content using Cheerio
      const $ = cheerio.load(response.data);
      const extractedContent = this.extractContent($, extractionOptions);

      const result: ScrapingResult = {
        success: true,
        url,
        finalUrl: response.request?.responseURL || url,
        statusCode: response.status,
        headers: response.headers,
        html: response.data,
        ...extractedContent,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          method: 'fetch'
        }
      };

      this.monitoring.recordMetric('web_scraping_success', 1, { method: 'simple' });
      return result;

    } catch (error) {
      this.monitoring.recordMetric('web_scraping_error', 1, { method: 'simple' });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.errorHandler.handleError(error as Error, { url, method: 'simple' });

      return {
        success: false,
        url,
        error: errorMessage,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          method: 'fetch'
        }
      };
    }
  }

  /**
   * Scrape a webpage using headless browser (full JS support)
   */
  async scrapeFull(
    url: string,
    config: WebScrapingConfig = {},
    extractionOptions: ContentExtractionOptions = {}
  ): Promise<ScrapingResult> {
    const startTime = Date.now();
    const finalConfig = { ...this.defaultConfig, ...config };
    let browser: Browser | null = null;
    let page: Page | null = null;

    try {
      // Security validation
      await this.validateUrl(url);

      this.monitoring.recordMetric('web_scraping_request', 1, { method: 'puppeteer', url });

      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--no-first-run',
          '--no-zygote',
          '--single-process'
        ]
      });

      page = await browser.newPage();

      // Set viewport and user agent
      await page.setViewport(finalConfig.viewport!);
      await page.setUserAgent(finalConfig.userAgent!);

      // Set extra headers
      if (finalConfig.headers) {
        await page.setExtraHTTPHeaders(finalConfig.headers);
      }

      // Track resources and errors
      const resourcesLoaded: string[] = [];
      const jsErrors: string[] = [];

      page.on('response', (response) => {
        resourcesLoaded.push(response.url());
      });

      page.on('pageerror', (error) => {
        jsErrors.push(error.message);
      });

      // Navigate to page
      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: finalConfig.timeout
      });

      // Wait for specific selector if provided
      if (finalConfig.waitForSelector) {
        await page.waitForSelector(finalConfig.waitForSelector, {
          timeout: finalConfig.timeout
        });
      }

      // Additional wait time if specified
      if (finalConfig.waitTime) {
        await page.waitForTimeout(finalConfig.waitTime);
      }

      // Get page content
      const html = await page.content();
      const title = await page.title();

      // Take screenshot if needed
      let screenshot: string | undefined;
      if (extractionOptions.includeMetadata) {
        const screenshotBuffer = await page.screenshot({ 
          type: 'png',
          fullPage: true 
        });
        screenshot = screenshotBuffer.toString('base64');
      }

      // Extract content using Cheerio
      const $ = cheerio.load(html);
      const extractedContent = this.extractContent($, extractionOptions);

      const result: ScrapingResult = {
        success: true,
        url,
        finalUrl: response?.url() || url,
        statusCode: response?.status(),
        html,
        title,
        screenshot,
        ...extractedContent,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          method: 'puppeteer',
          resourcesLoaded: resourcesLoaded.length,
          jsErrors: jsErrors.length > 0 ? jsErrors : undefined
        }
      };

      this.monitoring.recordMetric('web_scraping_success', 1, { method: 'puppeteer' });
      return result;

    } catch (error) {
      this.monitoring.recordMetric('web_scraping_error', 1, { method: 'puppeteer' });
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      await this.errorHandler.handleError(error as Error, { url, method: 'puppeteer' });

      return {
        success: false,
        url,
        error: errorMessage,
        metadata: {
          executionTime: Date.now() - startTime,
          timestamp: new Date(),
          method: 'puppeteer'
        }
      };

    } finally {
      // Cleanup
      if (page) {
        await page.close().catch(() => {});
      }
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  /**
   * Auto-detect best scraping method and execute
   */
  async scrapeAuto(
    url: string,
    config: WebScrapingConfig = {},
    extractionOptions: ContentExtractionOptions = {}
  ): Promise<ScrapingResult> {
    // Try simple method first (faster)
    if (!config.enableJavaScript && !config.waitForSelector) {
      const simpleResult = await this.scrapeSimple(url, config, extractionOptions);
      
      // If simple method works and returns content, use it
      if (simpleResult.success && simpleResult.text && simpleResult.text.length > 100) {
        return simpleResult;
      }
    }

    // Fall back to full browser method
    return this.scrapeFull(url, { ...config, enableJavaScript: true }, extractionOptions);
  }

  /**
   * Extract content from HTML using Cheerio
   */
  private extractContent(
    $: cheerio.CheerioAPI, 
    options: ContentExtractionOptions
  ): Partial<ScrapingResult> {
    const result: Partial<ScrapingResult> = {};

    // Remove scripts and styles if requested
    if (options.removeScripts !== false) {
      $('script, style, noscript').remove();
    }

    // Extract title
    result.title = $('title').first().text().trim();

    // Extract meta description
    result.description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || '';

    // Extract text content
    let textContent = '';
    if (options.mainContentOnly) {
      // Try to find main content areas
      const mainSelectors = [
        'main', 
        '[role="main"]', 
        '.main-content', 
        '#main-content',
        'article',
        '.content',
        '#content'
      ];
      
      for (const selector of mainSelectors) {
        const mainElement = $(selector).first();
        if (mainElement.length > 0) {
          textContent = mainElement.text();
          break;
        }
      }
      
      // Fallback to body if no main content found
      if (!textContent) {
        textContent = $('body').text();
      }
    } else {
      textContent = $('body').text();
    }

    // Clean and limit text content
    textContent = textContent.replace(/\s+/g, ' ').trim();
    if (options.maxTextLength && textContent.length > options.maxTextLength) {
      textContent = textContent.substring(0, options.maxTextLength) + '...';
    }
    result.text = textContent;

    // Extract links
    result.links = [];
    $('a[href]').each((_, element) => {
      const $link = $(element);
      const href = $link.attr('href');
      if (href) {
        result.links!.push({
          href,
          text: $link.text().trim(),
          title: $link.attr('title')
        });
      }
    });

    // Extract images
    result.images = [];
    $('img[src]').each((_, element) => {
      const $img = $(element);
      const src = $img.attr('src');
      if (src) {
        result.images!.push({
          src,
          alt: $img.attr('alt'),
          title: $img.attr('title')
        });
      }
    });

    // Extract specific selectors if provided
    if (options.selectors && options.selectors.length > 0) {
      const customExtractions: Record<string, string> = {};
      for (const selector of options.selectors) {
        const elements = $(selector);
        if (elements.length > 0) {
          customExtractions[selector] = elements.first().text().trim();
        }
      }
      result.metadata = { ...result.metadata, customExtractions };
    }

    return result;
  }

  /**
   * Validate URL for security
   */
  private async validateUrl(url: string): Promise<void> {
    const parsed = urlParse(url);

    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      throw new Error(`Protocol not allowed: ${parsed.protocol}`);
    }

    // Check domain whitelist/blacklist
    if (this.securityPolicy.allowedDomains) {
      const isAllowed = this.securityPolicy.allowedDomains.some(domain => 
        parsed.hostname.endsWith(domain)
      );
      if (!isAllowed) {
        throw new Error(`Domain not in allowlist: ${parsed.hostname}`);
      }
    }

    if (this.securityPolicy.blockedDomains) {
      const isBlocked = this.securityPolicy.blockedDomains.some(domain => 
        parsed.hostname.endsWith(domain)
      );
      if (isBlocked) {
        throw new Error(`Domain is blocked: ${parsed.hostname}`);
      }
    }

    // Check for private/local IPs
    const hostname = parsed.hostname;
    if (this.isPrivateIP(hostname)) {
      throw new Error(`Private IP addresses not allowed: ${hostname}`);
    }
  }

  /**
   * Check if content type is allowed
   */
  private isAllowedContentType(contentType: string): boolean {
    if (!this.securityPolicy.allowedContentTypes) {
      return true;
    }

    const mainType = contentType.split(';')[0].trim().toLowerCase();
    return this.securityPolicy.allowedContentTypes.includes(mainType);
  }

  /**
   * Check if hostname is a private IP
   */
  private isPrivateIP(hostname: string): boolean {
    // Simple check for common private IP ranges
    const privateRanges = [
      /^127\./, // localhost
      /^10\./, // 10.0.0.0/8
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./, // 172.16.0.0/12
      /^192\.168\./, // 192.168.0.0/16
      /^169\.254\./, // link-local
      /^::1$/, // IPv6 localhost
      /^fc00:/, // IPv6 private
      /^fe80:/ // IPv6 link-local
    ];

    return privateRanges.some(range => range.test(hostname));
  }

  /**
   * Get scraping statistics
   */
  getStatistics() {
    return this.monitoring.getMetrics();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    // Close any active browser sessions
    for (const session of this.activeSessions.values()) {
      try {
        if (session.browser) {
          await session.browser.close();
        }
      } catch (error) {
        // Ignore cleanup errors
      }
    }
    this.activeSessions.clear();
  }
}