import { Injectable } from '@nestjs/common';
import { MessageClassifier } from './MessageClassifier';
import { CommunicationTracker } from './CommunicationTracker';
import { Logger } from '../utils/logger';

export interface ClassificationResult {
  category: string;
  confidence: number;
  tags: string[];
  metadata?: Record<string, any>;
}

@Injectable()
export class ClassificationIntegrator {
  private readonly logger = new Logger(ClassificationIntegrator.name);
  private cacheManager = new Map<string, ClassificationResult>();
  private metricsCollector = new Map<string, any>();

  constructor(
    private readonly messageClassifier: MessageClassifier,
    private readonly communicationTracker: CommunicationTracker
  ) {}

  async classifyMessage(content: string, context?: any): Promise<ClassificationResult> {
    try {
      const cacheKey = this.getCacheKey(content, context);
      const cached = this.cacheManager.get(cacheKey);

      if (cached) {
        return cached;
      }

      const result = await this.messageClassifier.classify(content, context);
      this.cacheManager.set(cacheKey, result);

      await this.metricsCollector.set('classification', {
        timestamp: new Date(),
        category: result.category
      });

      return result;
    } catch (error) {
      this.logger.error('Classification failed', error);
      throw error;
    }
  }

  private getCacheKey(content: string, context?: any): string {
    const contextHash = context ? JSON.stringify(context) : '';
    return `classification:${Buffer.from(content + contextHash).toString('base64')}`;
  }

  async getMetrics(metricName: string): Promise<any> {
    return this.metricsCollector.get(metricName);
  }

  async clearCache(pattern?: string): Promise<void> {
    if (pattern) {
      for (const key of this.cacheManager.keys()) {
        if (key.includes(pattern)) {
          this.cacheManager.delete(key);
        }
      }
    } else {
      this.cacheManager.clear();
    }
  }
}
