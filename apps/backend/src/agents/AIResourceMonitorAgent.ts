import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import Redis from 'ioredis';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AgentInbox } from '@the-new-fuse/core/task';
import axios from 'axios';
import * as cheerio from 'cheerio';

export interface AIResource {
  id: string;
  name: string;
  provider: string;
  tier: 'free' | 'freemium' | 'paid';
  cost: number; // per task or per 1M tokens
  intelligence: 1 | 2 | 3 | 4 | 5;
  capabilities: string[];
  accessMethod: 'browser' | 'api';
  url: string;
  quotaLimit?: number;
  quotaReset?: string; // 'daily' | 'monthly'
  status: 'active' | 'beta' | 'waitlist' | 'deprecated';
  discovered: Date;
  lastVerified: Date;
}

export interface BetaOpportunity {
  id: string;
  title: string;
  provider: string;
  type: 'free-credits' | 'beta-access' | 'research-program' | 'enterprise-trial';
  value: string; // e.g., "$500 credits", "Unlimited access"
  applicationUrl: string;
  deadline?: Date;
  requirements: string[];
  discovered: Date;
  applied: boolean;
  status: 'available' | 'applied' | 'accepted' | 'expired';
}

export interface PriceUpdate {
  resourceId: string;
  oldPrice: number;
  newPrice: number;
  change: 'increase' | 'decrease';
  percentage: number;
  detectedAt: Date;
}

/**
 * AIResourceMonitor Agent
 * 
 * Continuously monitors for:
 * - New AI models and services
 * - Beta programs and free credits
 * - Price changes
 * - Quota increases
 * - Breaking AI news
 * 
 * Runs 24/7 to ensure we NEVER miss a free compute opportunity.
 */
@Injectable()
export class AIResourceMonitorAgent {
  private readonly logger = new Logger(AIResourceMonitorAgent.name);
  private readonly redis: Redis;
  private readonly eventEmitter: EventEmitter2;
  private readonly agentId = 'ai-resource-monitor';

  constructor(redis: Redis, eventEmitter: EventEmitter2) {
    this.redis = redis;
    this.eventEmitter = eventEmitter;
  }

  // ============ CRON JOBS ============

  /**
   * Check Twitter/X for breaking AI news - Every 30 minutes
   */
  @Cron('*/30 * * * *', { name: 'monitor-twitter' })
  async monitorTwitter(): Promise<void> {
    this.logger.log('🐦 Checking Twitter for AI announcements...');

    const accounts = ['@anthropicai', '@GoogleAI', '@OpenAI', '@MistralAI', '@grok'];
    
    for (const account of accounts) {
      try {
        const updates = await this.checkTwitterAccount(account);
        
        for (const update of updates) {
          if (this.isRelevantAnnouncement(update.text)) {
            await this.processAnnouncement(update);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to check ${account}:`, error);
      }
    }
  }

  /**
   * Check official blogs - Every hour
   */
  @Cron('0 * * * *', { name: 'monitor-blogs' })
  async monitorBlogs(): Promise<void> {
    this.logger.log('📰 Checking official AI blogs...');

    const blogs = [
      { url: 'https://openai.com/blog', provider: 'OpenAI' },
      { url: 'https://www.anthropic.com/news', provider: 'Anthropic' },
      { url: 'https://blog.google/technology/ai/', provider: 'Google' },
      { url: 'https://mistral.ai/news/', provider: 'Mistral' },
    ];

    for (const blog of blogs) {
      try {
        const posts = await this.scrapeBlog(blog.url);
        
        for (const post of posts) {
          if (await this.isNewPost(post.id)) {
            await this.analyzeBlogPost(post, blog.provider);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to scrape ${blog.url}:`, error);
      }
    }
  }

  /**
   * Check tech news sites - Every 6 hours
   */
  @Cron('0 */6 * * *', { name: 'monitor-tech-news' })
  async monitorTechNews(): Promise<void> {
    this.logger.log('📱 Checking tech news for AI updates...');

    const sources = [
      'https://techcrunch.com/tag/artificial-intelligence/',
      'https://www.theverge.com/ai-artificial-intelligence',
      'https://arstechnica.com/ai/',
    ];

    for (const source of sources) {
      try {
        const articles = await this.scrapeNewsSource(source);
        
        for (const article of articles) {
          if (this.containsRelevantKeywords(article.title)) {
            await this.analyzeArticle(article);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to scrape ${source}:`, error);
      }
    }
  }

  /**
   * Check Reddit - Every 12 hours
   */
  @Cron('0 */12 * * *', { name: 'monitor-reddit' })
  async monitorReddit(): Promise<void> {
    this.logger.log('🔴 Checking Reddit for AI discussions...');

    const subreddits = ['LocalLLaMA', 'MachineLearning', 'ArtificialIntelligence'];

    for (const subreddit of subreddits) {
      try {
        const posts = await this.fetchRedditPosts(subreddit);
        
        for (const post of posts) {
          if (this.containsRelevantKeywords(post.title)) {
            await this.analyzeRedditPost(post);
          }
        }
      } catch (error) {
        this.logger.error(`Failed to fetch r/${subreddit}:`, error);
      }
    }
  }

  /**
   * Verify existing resources - Daily
   */
  @Cron('0 2 * * *', { name: 'verify-resources' })
  async verifyResources(): Promise<void> {
    this.logger.log('✔️ Verifying all registered AI resources...');

    const resources = await this.loadAllResources();

    for (const resource of resources) {
      try {
        const isAvailable = await this.verifyResourceAvailability(resource);
        const currentQuota = await this.checkQuotaLimit(resource);
        const currentPrice = await this.checkPricing(resource);

        // Update resource
        resource.status = isAvailable ? 'active' : 'deprecated';
        resource.lastVerified = new Date();

        if (resource.quotaLimit !== currentQuota) {
          await this.handleQuotaChange(resource, currentQuota);
        }

        if (resource.cost !== currentPrice) {
          await this.handlePriceChange(resource, currentPrice);
        }

        await this.saveResource(resource);
      } catch (error) {
        this.logger.error(`Failed to verify ${resource.id}:`, error);
      }
    }

    // Generate daily report
    await this.generateDailyReport(resources);
  }

  // ============ DETECTION & ANALYSIS ============

  /**
   * Analyze blog post for announcements
   */
  private async analyzeBlogPost(post: any, provider: string): Promise<void> {
    const text = post.title + ' ' + post.content;

    // Detect new model launch
    if (this.containsPattern(text, [
      'announcing',
      'introducing',
      'launch',
      'new model',
      'is now available',
    ])) {
      await this.handleNewModelAnnouncement(post, provider);
    }

    // Detect beta program
    if (this.containsPattern(text, ['beta', 'early access', 'apply now', 'research program'])) {
      await this.handleBetaProgram(post, provider);
    }

    // Detect free tier changes
    if (this.containsPattern(text, ['free tier', 'quota', 'pricing update', 'no cost'])) {
      await this.handleFreeTierUpdate(post, provider);
    }

    // Detect API changes
    if (this.containsPattern(text, ['api', 'rate limit', 'deprecat'])) {
      await this.handleAPIChange(post, provider);
    }
  }

  /**
   * Handle new model announcement
   */
  private async handleNewModelAnnouncement(post: any, provider: string): Promise<void> {
    this.logger.log(`🔥 NEW MODEL DETECTED from ${provider}: ${post.title}`);

    // Extract model details
    const modelName = this.extractModelName(post.content);
    const isFree = this.containsPattern(post.content, ['free', 'no cost', 'beta credits']);
    const capabilities = this.extractCapabilities(post.content);

    // Create resource entry
    const resource: AIResource = {
      id: `${provider.toLowerCase()}-${modelName.toLowerCase().replace(/\s/g, '-')}`,
      name: modelName,
      provider,
      tier: isFree ? 'free' : 'paid',
      cost: 0, // Will be updated when pricing is found
      intelligence: this.estimateIntelligence(post.content),
      capabilities,
      accessMethod: 'api', // Default, will be verified
      url: post.url,
      status: 'beta', // Assume beta at launch
      discovered: new Date(),
      lastVerified: new Date(),
    };

    await this.saveResource(resource);

    // Send alert to inbox
    await this.sendCriticalAlert({
      type: 'new-model-launch',
      title: `NEW: ${modelName} from ${provider}`,
      details: `Free: ${isFree}, Capabilities: ${capabilities.join(', ')}`,
      action: 'Test capabilities and add to routing if beneficial',
      url: post.url,
    });

    // If free, test immediately
    if (isFree) {
      await this.queueCapabilityTest(resource);
    }
  }

  /**
   * Handle beta program opportunity
   */
  private async handleBetaProgram(post: any, provider: string): Promise<void> {
    this.logger.log(`🎁 BETA OPPORTUNITY from ${provider}: ${post.title}`);

    const opportunity: BetaOpportunity = {
      id: `beta-${provider.toLowerCase()}-${Date.now()}`,
      title: post.title,
      provider,
      type: this.classifyBetaType(post.content),
      value: this.extractValue(post.content),
      applicationUrl: this.extractApplicationUrl(post.content) || post.url,
      requirements: this.extractRequirements(post.content),
      discovered: new Date(),
      applied: false,
      status: 'available',
    };

    await this.saveBetaOpportunity(opportunity);

    // Auto-apply if requirements are met
    if (this.meetsRequirements(opportunity.requirements)) {
      await this.autoApplyForBeta(opportunity);
    } else {
      // Alert human for manual application
      await this.sendCriticalAlert({
        type: 'beta-program-manual',
        title: `BETA: ${opportunity.title}`,
        details: `Value: ${opportunity.value}, Requirements: ${opportunity.requirements.join(', ')}`,
        action: 'MANUAL APPLICATION NEEDED',
        url: opportunity.applicationUrl,
      });
    }
  }

  /**
   * Handle price change
   */
  private async handlePriceChange(resource: AIResource, newPrice: number): Promise<void> {
    const oldPrice = resource.cost;
    const change: 'increase' | 'decrease' = newPrice > oldPrice ? 'increase' : 'decrease';
    const percentage = ((newPrice - oldPrice) / oldPrice) * 100;

    this.logger.log(
      `💰 PRICE CHANGE for ${resource.name}: $${oldPrice} → $${newPrice} (${change} ${percentage.toFixed(1)}%)`
    );

    const priceUpdate: PriceUpdate = {
      resourceId: resource.id,
      oldPrice,
      newPrice,
      change,
      percentage,
      detectedAt: new Date(),
    };

    await this.savePriceUpdate(priceUpdate);

    // Update routing priorities if significant change
    if (Math.abs(percentage) > 10) {
      await this.updateRoutingPriorities();
    }

    // Alert
    await this.sendAlert({
      type: 'price-change',
      title: `${change === 'decrease' ? '📉' : '📈'} ${resource.name} price ${change}`,
      details: `$${oldPrice} → $${newPrice} (${percentage.toFixed(1)}%)`,
      action: change === 'decrease' ? 'Consider increasing usage' : 'Consider alternatives',
    });
  }

  // ============ SCRAPING & FETCHING ============

  private async scrapeBlog(url: string): Promise<any[]> {
    try {
      const response = await axios.get(url);
      const $ = cheerio.load(response.data);
      const posts: any[] = [];

      // Generic blog scraping (would be customized per site)
      $('article, .post, .blog-post').each((i, elem) => {
        const title = $(elem).find('h1, h2, h3').first().text();
        const link = $(elem).find('a').first().attr('href');
        const content = $(elem).text();

        if (title && link) {
          posts.push({
            id: link,
            title: title.trim(),
            url: link.startsWith('http') ? link : url + link,
            content: content.substring(0, 1000), // First 1000 chars
            publishedAt: new Date(),
          });
        }
      });

      return posts.slice(0, 10); // Top 10 recent
    } catch (error) {
      this.logger.error(`Scraping failed for ${url}:`, error);
      return [];
    }
  }

  private async fetchRedditPosts(subreddit: string): Promise<any[]> {
    try {
      // Use Reddit JSON API (no auth needed)
      const response = await axios.get(`https://www.reddit.com/r/${subreddit}/hot.json?limit=25`);
      const posts = response.data.data.children.map((child: any) => child.data);

      return posts.map((post: any) => ({
        id: post.id,
        title: post.title,
        url: post.url,
        content: post.selftext,
        score: post.score,
        created: new Date(post.created_utc * 1000),
      }));
    } catch (error) {
      this.logger.error(`Failed to fetch r/${subreddit}:`, error);
      return [];
    }
  }

  // ============ HELPER METHODS ============

  private containsPattern(text: string, patterns: string[]): boolean {
    const lowerText = text.toLowerCase();
    return patterns.some((pattern) => lowerText.includes(pattern.toLowerCase()));
  }

  private containsRelevantKeywords(text: string): boolean {
    const keywords = [
      'gpt',
      'claude',
      'gemini',
      'llama',
      'mistral',
      'model',
      'api',
      'free',
      'beta',
      'launch',
      'announcement',
    ];
    return this.containsPattern(text, keywords);
  }

  private isRelevantAnnouncement(text: string): boolean {
    return this.containsRelevantKeywords(text);
  }

  private async isNewPost(postId: string): Promise<boolean> {
    const exists = await this.redis.sismember('ai-monitor:seen-posts', postId);
    if (!exists) {
      await this.redis.sadd('ai-monitor:seen-posts', postId);
      return true;
    }
    return false;
  }

  private extractModelName(text: string): string {
    // Simple extraction (would use NLP in production)
    const match = text.match(/(GPT-\d+|Claude \d+|Gemini \w+|Llama \d+|Mistral \w+)/i);
    return match ? match[1] : 'Unknown Model';
  }

  private extractCapabilities(text: string): string[] {
    const capabilities: string[] = [];

    if (this.containsPattern(text, ['reasoning', 'think'])) capabilities.push('reasoning');
    if (this.containsPattern(text, ['code', 'programming'])) capabilities.push('code-generation');
    if (this.containsPattern(text, ['image', 'vision', 'multimodal']))
      capabilities.push('multimodal');
    if (this.containsPattern(text, ['fast', 'speed', 'low latency'])) capabilities.push('fast');
    if (this.containsPattern(text, ['long context', '100k', '200k'])) capabilities.push('long-context');

    return capabilities;
  }

  private estimateIntelligence(text: string): 1 | 2 | 3 | 4 | 5 {
    if (this.containsPattern(text, ['state-of-the-art', 'best', 'flagship'])) return 5;
    if (this.containsPattern(text, ['advanced', 'powerful'])) return 4;
    if (this.containsPattern(text, ['standard', 'general'])) return 3;
    if (this.containsPattern(text, ['fast', 'lightweight'])) return 2;
    return 3; // Default
  }

  private async sendCriticalAlert(alert: any): Promise<void> {
    // Send to system architect inbox
    const inbox = new AgentInbox('system-architect', this.redis, this.eventEmitter);

    await inbox.receiveTask({
      id: `alert-${Date.now()}`,
      type: 'critical-alert',
      priority: 10,
      data: alert,
    });

    this.logger.log(`🚨 CRITICAL ALERT SENT: ${alert.title}`);
  }

  private async sendAlert(alert: any): Promise<void> {
    const inbox = new AgentInbox('system-architect', this.redis, this.eventEmitter);

    await inbox.receiveTask({
      id: `alert-${Date.now()}`,
      type: 'alert',
      priority: 7,
      data: alert,
    });
  }

  private async saveResource(resource: AIResource): Promise<void> {
    await this.redis.set(`ai-resource:${resource.id}`, JSON.stringify(resource));
    await this.redis.sadd('ai-resource:all', resource.id);
  }

  private async loadAllResources(): Promise<AIResource[]> {
    const ids = await this.redis.smembers('ai-resource:all');
    const resources: AIResource[] = [];

    for (const id of ids) {
      const data = await this.redis.get(`ai-resource:${id}`);
      if (data) {
        resources.push(JSON.parse(data));
      }
    }

    return resources;
  }

  private async saveBetaOpportunity(opportunity: BetaOpportunity): Promise<void> {
    await this.redis.set(`beta-opportunity:${opportunity.id}`, JSON.stringify(opportunity));
    await this.redis.zadd('beta-opportunities', Date.now(), opportunity.id);
  }

  private async savePriceUpdate(update: PriceUpdate): Promise<void> {
    await this.redis.lpush('price-updates', JSON.stringify(update));
    await this.redis.ltrim('price-updates', 0, 99); // Keep last 100
  }

  private async generateDailyReport(resources: AIResource[]): Promise<void> {
    const report = {
      date: new Date(),
      totalResources: resources.length,
      active: resources.filter((r) => r.status === 'active').length,
      free: resources.filter((r) => r.tier === 'free').length,
      beta: resources.filter((r) => r.status === 'beta').length,
      newToday: resources.filter(
        (r) => r.discovered.toDateString() === new Date().toDateString()
      ).length,
    };

    this.logger.log(`📊 Daily Report: ${JSON.stringify(report)}`);

    // Send weekly summary to inbox
    const dayOfWeek = new Date().getDay();
    if (dayOfWeek === 0) {
      // Sunday
      await this.sendWeeklySummary(resources);
    }
  }

  private async sendWeeklySummary(resources: AIResource[]): Promise<void> {
    const summary = {
      week: 'Week of ' + new Date().toLocaleDateString(),
      stats: {
        total: resources.length,
        free: resources.filter((r) => r.tier === 'free').length,
        discovered: resources.filter(
          (r) => r.discovered > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        ).length,
      },
    };

    const inbox = new AgentInbox('system-architect', this.redis, this.eventEmitter);

    await inbox.receiveTask({
      id: `weekly-summary-${Date.now()}`,
      type: 'weekly-summary',
      priority: 5,
      data: summary,
    });
  }

  // Placeholder methods (would be implemented fully)
  private async checkTwitterAccount(account: string): Promise<any[]> {
    // Would use Twitter API or scraping
    return [];
  }

  private async scrapeNewsSource(url: string): Promise<any[]> {
    // Similar to scrapeBlog
    return [];
  }

  private async analyzeArticle(article: any): Promise<void> {
    // Analysis logic
  }

  private async analyzeRedditPost(post: any): Promise<void> {
    // Analysis logic
  }

  private async verifyResourceAvailability(resource: AIResource): Promise<boolean> {
    // Health check
    return true;
  }

  private async checkQuotaLimit(resource: AIResource): Promise<number | undefined> {
    // Check current quota
    return resource.quotaLimit;
  }

  private async checkPricing(resource: AIResource): Promise<number> {
    // Scrape pricing page
    return resource.cost;
  }

  private async handleQuotaChange(resource: AIResource, newQuota: number): Promise<void> {
    this.logger.log(`Quota change for ${resource.name}: ${resource.quotaLimit} → ${newQuota}`);
  }

  private async handleFreeTierUpdate(post: any, provider: string): Promise<void> {
    // Handle free tier changes
  }

  private async handleAPIChange(post: any, provider: string): Promise<void> {
    // Handle API changes
  }

  private async queueCapabilityTest(resource: AIResource): Promise<void> {
    // Queue test task
  }

  private classifyBetaType(text: string): BetaOpportunity['type'] {
    if (this.containsPattern(text, ['credit'])) return 'free-credits';
    if (this.containsPattern(text, ['research'])) return 'research-program';
    if (this.containsPattern(text, ['enterprise'])) return 'enterprise-trial';
    return 'beta-access';
  }

  private extractValue(text: string): string {
    const match = text.match(/\$\d+|\d+\s*credits?|unlimited/i);
    return match ? match[0] : 'Unknown value';
  }

  private extractApplicationUrl(text: string): string | null {
    const match = text.match(/https?:\/\/[^\s<]+apply/i);
    return match ? match[0] : null;
  }

  private extractRequirements(text: string): string[] {
    // Extract requirements (simplified)
    return [];
  }

  private meetsRequirements(requirements: string[]): boolean {
    // Check if we meet requirements
    return requirements.length === 0; // Auto-apply if no requirements
  }

  private async autoApplyForBeta(opportunity: BetaOpportunity): Promise<void> {
    this.logger.log(`🤖 AUTO-APPLYING for ${opportunity.title}...`);
    // Automation logic for beta application
    opportunity.applied = true;
    opportunity.status = 'applied';
    await this.saveBetaOpportunity(opportunity);
  }

  private async updateRoutingPriorities(): Promise<void> {
    // Trigger routing priority update
    this.eventEmitter.emit('routing.priorities_changed');
  }
}
