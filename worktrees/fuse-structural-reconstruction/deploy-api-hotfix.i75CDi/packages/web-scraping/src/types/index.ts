/**
 * Web Scraping Types and Interfaces
 */

export interface WebScrapingConfig {
  /** Maximum timeout for requests in milliseconds */
  timeout?: number;
  /** User agent string */
  userAgent?: string;
  /** Maximum redirects to follow */
  maxRedirects?: number;
  /** Enable JavaScript execution */
  enableJavaScript?: boolean;
  /** Wait for specific selector */
  waitForSelector?: string;
  /** Wait time in milliseconds */
  waitTime?: number;
  /** Viewport configuration */
  viewport?: {
    width: number;
    height: number;
  };
  /** Headers to include in requests */
  headers?: Record<string, string>;
  /** Proxy configuration */
  proxy?: {
    host: string;
    port: number;
    username?: string;
    password?: string;
  };
}

export interface ScrapingResult {
  /** Success status */
  success: boolean;
  /** URL that was scraped */
  url: string;
  /** Final URL after redirects */
  finalUrl?: string;
  /** HTTP status code */
  statusCode?: number;
  /** Response headers */
  headers?: Record<string, string>;
  /** Raw HTML content */
  html?: string;
  /** Extracted text content */
  text?: string;
  /** Markdown content */
  markdown?: string;
  /** Page title */
  title?: string;
  /** Meta description */
  description?: string;
  /** Links found on the page */
  links?: Array<{
    href: string;
    text: string;
    title?: string;
  }>;
  /** Images found on the page */
  images?: Array<{
    src: string;
    alt?: string;
    title?: string;
  }>;
  /** Screenshot (base64 encoded) */
  screenshot?: string;
  /** Error message if failed */
  error?: string;
  /** Execution metadata */
  metadata?: {
    executionTime: number;
    timestamp: Date;
    method: 'fetch' | 'puppeteer' | 'crawl4ai';
    resourcesLoaded?: number;
    jsErrors?: string[];
    customExtractions?: Record<string, any>;
  };
}

export interface ContentExtractionOptions {
  /** Extract main content only */
  mainContentOnly?: boolean;
  /** Remove scripts and styles */
  removeScripts?: boolean;
  /** Extract specific elements by selector */
  selectors?: string[];
  /** Maximum text length */
  maxTextLength?: number;
  /** Include metadata */
  includeMetadata?: boolean;
}

export interface ProxyRequest {
  /** Target URL */
  url: string;
  /** HTTP method */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  /** Request headers */
  headers?: Record<string, string>;
  /** Request body */
  body?: string;
  /** Configuration options */
  config?: WebScrapingConfig;
}

export interface ProxyResponse {
  /** Success status */
  success: boolean;
  /** HTTP status code */
  statusCode: number;
  /** Response headers */
  headers: Record<string, string>;
  /** Response body */
  body: string;
  /** Content type */
  contentType?: string;
  /** Error message if failed */
  error?: string;
  /** Request metadata */
  metadata: {
    url: string;
    method: string;
    executionTime: number;
    timestamp: Date;
  };
}

export interface BrowserSession {
  /** Session ID */
  id: string;
  /** Browser instance */
  browser: any;
  /** Active pages */
  pages: Map<string, any>;
  /** Session creation time */
  createdAt: Date;
  /** Last activity time */
  lastActivity: Date;
  /** Session configuration */
  config: WebScrapingConfig;
}

export interface SecurityPolicy {
  /** Allowed domains */
  allowedDomains?: string[];
  /** Blocked domains */
  blockedDomains?: string[];
  /** Maximum file size to download */
  maxFileSize?: number;
  /** Allowed content types */
  allowedContentTypes?: string[];
  /** Rate limiting */
  rateLimit?: {
    requests: number;
    windowMs: number;
  };
  /** Enable content filtering */
  contentFiltering?: boolean;
}
