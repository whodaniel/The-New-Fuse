import { SerpApi } from 'google-search-results-nodejs';
import { Logger } from '../logging.js';

export interface SearchOptions {
  num?: number;
  location?: string;
  domain?: string;
  language?: string;
  safe?: 'active' | 'off';
  filter?: 'country' | 'nocountry';
}

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  position: number;
  displayedLink: string;
  source: 'organic' | 'featured_snippet' | 'knowledge_graph' | 'related_questions';
}

export class WebSearch {
  private serpApi: SerpApi;
  private logger: Logger;
  
  constructor(apiKey: string, logger: Logger) {
    this.serpApi = new SerpApi(apiKey);
    this.logger = logger;
  }
  
  /**
   * Perform a web search
   */
  async search(query: string, options?: SearchOptions): Promise<SearchResult[]> {
    return new Promise((resolve, reject) => {
      this.logger.debug(`Performing web search: "${query}"`);
      
      const searchParams = {
        q: query,
        num: options?.num || 10,
        location: options?.location,
        google_domain: options?.domain || 'google.com',
        gl: options?.language || 'us',
        safe: options?.safe || 'active',
        filter: options?.filter
      };
      
      this.serpApi.json(searchParams, (data: any) => {
        if (data.error) {
          this.logger.error(`SERP API error: ${data.error}`);
          return reject(new Error(data.error));
        }
        
        try {
          const results: SearchResult[] = [];
          
          // Parse organic results
          if (data.organic_results) {
            data.organic_results.forEach((result: any, index: number) => {
              results.push({
                title: result.title,
                link: result.link,
                snippet: result.snippet,
                position: index + 1,
                displayedLink: result.displayed_link,
                source: 'organic'
              });
            });
          }
          
          // Parse featured snippet if present
          if (data.answer_box) {
            results.unshift({
              title: data.answer_box.title || 'Featured Snippet',
              link: data.answer_box.link || '',
              snippet: data.answer_box.snippet || data.answer_box.answer || '',
              position: 0,
              displayedLink: data.answer_box.displayed_link || '',
              source: 'featured_snippet'
            });
          }
          
          this.logger.debug(`Search completed with ${results.length} results`);
          resolve(results);
        } catch (error) {
          this.logger.error('Error parsing search results:', error);
          reject(error);
        }
      });
    });
  }
}
