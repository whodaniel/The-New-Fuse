import { NewsItem, NewsAPIRequest, EntityMention, VerificationStatus } from './types.js';
import { AgentProtocol } from '../../../packages/core/types/src/agent.js';

/**
 * Enhanced Service to handle AI news fetching and processing
 * With support for multiple protocols and advanced verification features
 */
export class AINewsService {
  private static instance: AINewsService;
  private apiKey: string = '';
  private verificationSources: Map<string, number> = new Map([
    ['trusted.ai', 0.95],
    ['aiverify.org', 0.9],
    ['factcheck.ai', 0.85]
  ]);
  
  private constructor() {}
  
  public static getInstance(): AINewsService {
    if (!AINewsService.instance) {
      AINewsService.instance = new AINewsService();
    }
    return AINewsService.instance;
  }
  
  /**
   * Set API key for services that require authentication
   */
  public setApiKey(key: string): void {
    this.apiKey = key;
  }
  
  /**
   * Fetch latest AI news based on provided parameters
   */
  public async fetchLatestNews(params: NewsAPIRequest): Promise<NewsItem[]> {
    try {
      // Select appropriate protocol-specific fetchers
      let fetchMethods = [];
      
      if (params.protocol === AgentProtocol.MCP) {
        // MCP-specific sources
        fetchMethods = [
          this.fetchFromArxiv,
          this.fetchFromRSS,
          this.fetchMCPConnectedSources
        ];
      } else if (params.protocol === AgentProtocol.A2A) {
        // A2A-specific sources
        fetchMethods = [
          this.fetchFromArxiv,
          this.fetchFromRSS,
          this.fetchFromNewsAPI,
          this.fetchFromA2AAgents
        ];
      } else {
        // Default - use all sources
        fetchMethods = [
          this.fetchFromArxiv,
          this.fetchFromRSS,
          this.fetchFromNewsAPI,
          this.fetchFromA2AAgents,
          this.fetchMCPConnectedSources
        ];
      }
      
      // Combine multiple news sources
      const results = await Promise.all(
        fetchMethods.map(method => method.call(this, params))
      );
      
      // Flatten results and sort by date (newest first)
      const allNews = results.flat().sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      
      // Remove duplicates (based on title similarity)
      const uniqueNews = this.removeDuplicates(allNews);
      
      // Enrichment pipeline
      const enrichedNews = await this.runEnrichmentPipeline(uniqueNews);
      
      // Return limited number of items
      return enrichedNews.slice(0, params.maxItems);
    } catch (error) {
      console.error("Error fetching news:", error);
      throw error;
    }
  }
  
  /**
   * Run the full enrichment pipeline on news items
   */
  private async runEnrichmentPipeline(items: NewsItem[]): Promise<NewsItem[]> {
    let processedItems = [...items];
    
    // Extract entities
    processedItems = await this.extractEntities(processedItems);
    
    // Apply sentiment analysis
    processedItems = await this.applySentimentAnalysis(processedItems);
    
    // Verify news items
    processedItems = await this.verifyNewsItems(processedItems);
    
    return processedItems;
  }
  
  /**
   * Extract named entities from news items
   */
  private async extractEntities(items: NewsItem[]): Promise<NewsItem[]> {
    // In a real implementation, this would use NLP services
    return items.map(item => {
      // Simple regex-based entity extraction (just for demonstration)
      const entityTypes: Array<'person' | 'organization' | 'technology' | 'product' | 'concept' | 'other'> = 
        ['person', 'organization', 'technology', 'product', 'concept', 'other'];
      
      const entities: EntityMention[] = [];
      
      // Extract potential entities from title and summary
      const text = `${item.title} ${item.summary}`;
      const words = text.split(/\s+/);
      
      // Find capitalized words/phrases as potential entities
      const capitalizedRegex = /([A-Z][a-z]+(?:\s[A-Z][a-z]+)*)/g;
      const matches = text.match(capitalizedRegex) || [];
      
      matches.forEach(match => {
        if (match.length > 3 && !['The', 'A', 'An', 'This', 'That'].includes(match)) {
          entities.push({
            entity: match,
            type: entityTypes[Math.floor(Math.random() * entityTypes.length)],
            sentiment: Math.random() > 0.7 ? 
              (Math.random() > 0.5 ? 'positive' : 'negative') : 
              'neutral'
          });
        }
      });
      
      return {
        ...item,
        entityMentions: entities.slice(0, 5) // Limit to 5 entities
      };
    });
  }
  
  /**
   * Verify news items for authenticity
   */
  private async verifyNewsItems(items: NewsItem[]): Promise<NewsItem[]> {
    // In a real implementation, this would check against fact-checking services
    return items.map(item => {
      const sources = Array.from(this.verificationSources.keys());
      const randomSource = sources[Math.floor(Math.random() * sources.length)];
      const confidenceScore = this.verificationSources.get(randomSource) || 0.8;
      
      // Simulate verification (more sophisticated in production)
      const verificationStatus: VerificationStatus = {
        verified: Math.random() > 0.1, // 90% of news is verified
        verificationSource: randomSource,
        verificationDate: new Date().toISOString(),
        confidenceScore: confidenceScore * (0.9 + Math.random() * 0.2) // Add some variance
      };
      
      return {
        ...item,
        verification: verificationStatus
      };
    });
  }
  
  /**
   * Fetch research papers from arXiv
   */
  private async fetchFromArxiv(params: NewsAPIRequest): Promise<NewsItem[]> {
    // In a real implementation, this would call the arXiv API
    // For development, return mock data
    return [
      {
        id: crypto.randomUUID(),
        title: "Enhanced Transformer Architecture for Efficient Token Processing",
        source: "arXiv",
        url: "https://arxiv.org/abs/example1",
        summary: "This paper introduces a novel transformer architecture that reduces computation by 30% while maintaining accuracy.",
        date: new Date().toISOString(),
        keywords: ["transformer", "efficiency", "architecture"]
      },
      {
        id: crypto.randomUUID(),
        title: "Self-Supervised Learning for Multimodal LLMs",
        source: "arXiv",
        url: "https://arxiv.org/abs/example2",
        summary: "A new approach to self-supervised learning that improves performance on vision-language tasks.",
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        keywords: ["self-supervised", "multimodal", "LLM"]
      }
    ];
  }
  
  /**
   * Fetch from various RSS feeds like Google AI Blog, etc.
   */
  private async fetchFromRSS(params: NewsAPIRequest): Promise<NewsItem[]> {
    // In a real implementation, this would parse RSS feeds
    // For development, return mock data
    return [
      {
        id: crypto.randomUUID(),
        title: "Improving Responsible AI Practices Across the Industry",
        source: "Google AI Blog",
        url: "https://ai.googleblog.com/example1",
        summary: "Google introduces new guidelines and tools for responsible AI development.",
        date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        keywords: ["responsible AI", "ethics", "guidelines"]
      }
    ];
  }
  
  /**
   * Fetch from news aggregation APIs
   */
  private async fetchFromNewsAPI(params: NewsAPIRequest): Promise<NewsItem[]> {
    // In a real implementation, this would use news APIs like NewsAPI.org
    // For development, return mock data
    return [
      {
        id: crypto.randomUUID(),
        title: "GPT-5 Development Underway with Focus on Reasoning",
        source: "AI Insider",
        url: "https://example.com/gpt5-dev",
        summary: "OpenAI has begun work on GPT-5 with substantial improvements to reasoning capabilities.",
        date: new Date().toISOString(),
        keywords: ["GPT-5", "reasoning", "OpenAI"]
      },
      {
        id: crypto.randomUUID(),
        title: "New Framework for Efficient Transformer Training",
        source: "AI News Daily",
        url: "https://ainewsdaily.com/example",
        summary: "Researchers introduce a novel training framework that reduces compute requirements by 40%.",
        date: new Date(Date.now() - 86400000).toISOString(), // Yesterday
        keywords: ["transformer", "training", "efficiency"]
      }
    ];
  }
  
  /**
   * Fetch news from other A2A agents
   */
  private async fetchFromA2AAgents(params: NewsAPIRequest): Promise<NewsItem[]> {
    // In production, this would discover and communicate with other A2A agents
    // For development, return mock data
    return [
      {
        id: crypto.randomUUID(),
        title: "Multi-Agent Systems Show Promise for Complex Problem Solving",
        source: "A2A Research Network",
        url: "https://a2a.research.net/example",
        summary: "New research demonstrates how multi-agent systems can tackle problems too complex for single agents.",
        date: new Date(Date.now() - 3 * 86400000).toISOString(), // 3 days ago
        keywords: ["multi-agent", "collaboration", "problem solving"]
      }
    ];
  }
  
  /**
   * Fetch from MCP-connected sources
   */
  private async fetchMCPConnectedSources(params: NewsAPIRequest): Promise<NewsItem[]> {
    // In production, this would use MCP to connect to various sources
    // For development, return mock data
    return [
      {
        id: crypto.randomUUID(),
        title: "Anthropic Introduces Claude 3 with Enhanced Reasoning",
        source: "MCP Hub",
        url: "https://mcp-hub.com/example",
        summary: "Anthropic's latest Claude model shows significant improvements in multi-step reasoning and tool use.",
        date: new Date(Date.now() - 2 * 86400000).toISOString(), // 2 days ago
        keywords: ["Claude", "reasoning", "Anthropic", "LLM"]
      }
    ];
  }
  
  /**
   * Remove duplicate news items based on title similarity
   */
  private removeDuplicates(items: NewsItem[]): NewsItem[] {
    // Using a more sophisticated duplicate detection algorithm
    const uniqueItems: NewsItem[] = [];
    const titleMap = new Map<string, boolean>();
    
    for (const item of items) {
      const normalizedTitle = this.normalizeTitle(item.title);
      let isDuplicate = false;
      
      // Check for exact matches
      if (titleMap.has(normalizedTitle)) {
        isDuplicate = true;
      } else {
        // Check for similar titles using Levenshtein distance
        for (const key of titleMap.keys()) {
          if (this.levenshteinDistance(normalizedTitle, key) / Math.max(normalizedTitle.length, key.length) < 0.3) {
            isDuplicate = true;
            break;
          }
        }
      }
      
      if (!isDuplicate) {
        titleMap.set(normalizedTitle, true);
        uniqueItems.push(item);
      }
    }
    
    return uniqueItems;
  }
  
  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title.toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .replace(/\s+/g, ' ')    // Normalize whitespace
      .trim();
  }
  
  /**
   * Calculate Levenshtein distance between two strings
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const track = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null));
    
    for (let i = 0; i <= str1.length; i++) {
      track[0][i] = i;
    }
    
    for (let j = 0; j <= str2.length; j++) {
      track[j][0] = j;
    }
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        track[j][i] = Math.min(
          track[j][i - 1] + 1, // deletion
          track[j - 1][i] + 1, // insertion
          track[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return track[str2.length][str1.length];
  }
  
  /**
   * Apply sentiment analysis to news items
   */
  private async applySentimentAnalysis(items: NewsItem[]): Promise<NewsItem[]> {
    // In a real implementation, this would call an NLP service
    // For this demo, use a simple keyword-based approach
    const positiveKeywords = [
      'advancement', 'breakthrough', 'improve', 'success', 'innovative', 
      'promising', 'achievement', 'solution', 'progress', 'efficient'
    ];
    
    const negativeKeywords = [
      'issue', 'problem', 'concern', 'risk', 'limitation', 
      'challenge', 'failure', 'controversy', 'danger', 'criticism'
    ];
    
    return items.map(item => {
      const text = `${item.title} ${item.summary}`.toLowerCase();
      
      let positiveScore = 0;
      let negativeScore = 0;
      
      // Count positive keywords
      positiveKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          positiveScore += matches.length;
        }
      });
      
      // Count negative keywords
      negativeKeywords.forEach(keyword => {
        const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
        const matches = text.match(regex);
        if (matches) {
          negativeScore += matches.length;
        }
      });
      
      // Determine sentiment
      let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (positiveScore > negativeScore + 1) {
        sentiment = 'positive';
      } else if (negativeScore > positiveScore + 1) {
        sentiment = 'negative';
      }
      
      return {
        ...item,
        sentiment
      };
    });
  }
}

// Export singleton instance
export const newsService = AINewsService.getInstance();