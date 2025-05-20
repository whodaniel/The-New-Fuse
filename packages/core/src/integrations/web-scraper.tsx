import axios from 'axios';
import * as cheerio from 'cheerio';
import { Logger } from '../logging.js';

export interface ScraperOptions {
  userAgent?: string;
  timeout?: number;
  selectors?: {
    content?: string;
    title?: string;
    metaDescription?: string;
  }
}

export class WebScraper {
  private logger: Logger;
  private options: ScraperOptions;
  
  constructor(logger: Logger, options?: ScraperOptions) {
    this.logger = logger;
    this.options = {
      userAgent: 'Mozilla/5.0 (compatible; NewFuseBot/1.0)',
      timeout: 30000,
      selectors: {
        content: 'body',
        title: 'title',
        metaDescription: 'meta[name="description"]'
      },
      ...options
    };
  }
  
  /**
   * Scrape a webpage and extract its content
   */
  async scrape(url: string, customOptions?: ScraperOptions): Promise<{
    title: string;
    content: string;
    description: string;
    url: string;
    metadata: Record<string, any>;
  }> {
    const options = { ...this.options, ...customOptions };
    
    try {
      this.logger.debug(`Scraping URL: ${url}`);
      
      const response = await axios.get(url, {
        headers: {
          'User-Agent': options.userAgent
        },
        timeout: options.timeout
      });
      
      const $ = cheerio.load(response.data);
      
      // Remove scripts, styles, and other non-content elements
      $('script, style, iframe, nav, footer, header, noscript').remove();
      
      const title = $(options.selectors.title).text().trim();
      const content = $(options.selectors.content).text().trim().replace(/\s+/g, ' ');
      const description = $(options.selectors.metaDescription).attr('content') || '';
      
      // Extract additional metadata
      const metadata: Record<string, any> = {};
      $('meta').each((_, element) => {
        const name = $(element).attr('name') || $(element).attr('property');
        const content = $(element).attr('content');
        if (name && content) {
          metadata[name] = content;
        }
      });
      
      this.logger.debug(`Successfully scraped: ${url}`);
      
      return {
        title,
        content,
        description,
        url,
        metadata
      };
    } catch (error) {
      this.logger.error(`Error scraping URL ${url}:`, error);
      throw new Error(`Failed to scrape URL: ${error.message}`);
    }
  }
  
  /**
   * Scrape multiple webpages in parallel
   */
  async scrapeMultiple(urls: string[], customOptions?: ScraperOptions): Promise<Array<{
    title: string;
    content: string;
    description: string;
    url: string;
    metadata: Record<string, any>;
  }>> {
    return Promise.all(urls.map(url => this.scrape(url, customOptions)));
  }
}
