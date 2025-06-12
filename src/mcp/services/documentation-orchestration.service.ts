import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MCPRAGClientService } from './mcp-rag-client.service.js';
import { RAGConfigurationService } from './rag-configuration.service.js';

export interface DocumentationUpdateResult {
  timestamp: string;
  totalSources: number;
  successful: number;
  failed: number;
  results: {
    [source: string]: {
      success: boolean;
      pagesProcessed?: number;
      error?: string;
      duration?: number;
    };
  };
}

@Injectable()
export class DocumentationOrchestrationService {
  private readonly logger = new Logger(DocumentationOrchestrationService.name);
  private isUpdating = false;
  private lastUpdateResult: DocumentationUpdateResult | null = null;

  constructor(
    private readonly ragClient: MCPRAGClientService,
    private readonly ragConfig: RAGConfigurationService,
  ) {}

  /**
   * Manually trigger documentation update for all sources
   */
  async updateAllDocumentation(): Promise<DocumentationUpdateResult> {
    if (this.isUpdating) {
      throw new Error('Documentation update already in progress');
    }

    this.logger.log('Starting manual documentation update for all sources...');
    return await this.performDocumentationUpdate();
  }

  /**
   * Update specific documentation source
   */
  async updateSpecificDocumentation(source: string, options?: {
    url?: string;
    max_depth?: number;
    max_pages?: number;
  }): Promise<DocumentationUpdateResult> {
    if (this.isUpdating) {
      throw new Error('Documentation update already in progress');
    }

    this.logger.log(`Starting manual documentation update for ${source}...`);
    return await this.performDocumentationUpdate([source], options);
  }

  /**
   * Scheduled task to update documentation (runs daily at 2 AM)
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async scheduledDocumentationUpdate(): Promise<void> {
    if (this.isUpdating) {
      this.logger.warn('Skipping scheduled update - manual update in progress');
      return;
    }

    this.logger.log('Starting scheduled documentation update...');
    try {
      await this.performDocumentationUpdate();
      this.logger.log('Scheduled documentation update completed successfully');
    } catch (error) {
      this.logger.error('Scheduled documentation update failed:', error);
    }
  }

  /**
   * Core documentation update logic
   */
  private async performDocumentationUpdate(
    sources?: string[],
    options?: { url?: string; max_depth?: number; max_pages?: number }
  ): Promise<DocumentationUpdateResult> {
    const startTime = Date.now();
    this.isUpdating = true;

    const result: DocumentationUpdateResult = {
      timestamp: new Date().toISOString(),
      totalSources: 0,
      successful: 0,
      failed: 0,
      results: {}
    };

    try {
      // Determine which sources to update
      const sourcesToUpdate = sources || ['vscode', 'copilot', 'typescript', 'nestjs'];
      result.totalSources = sourcesToUpdate.length;

      for (const source of sourcesToUpdate) {
        const sourceStartTime = Date.now();
        this.logger.log(`Updating ${source} documentation...`);

        try {
          let crawlResult;
          const crawlOptions = {
            url: options?.url,
            max_depth: options?.max_depth,
            max_pages: options?.max_pages
          };

          switch (source) {
            case 'vscode':
              crawlResult = await this.ragClient.crawlVSCodeDocs(
                crawlOptions.url,
                crawlOptions.max_depth,
                crawlOptions.max_pages
              );
              break;
            case 'copilot':
              crawlResult = await this.ragClient.crawlCopilotDocs(
                crawlOptions.url,
                crawlOptions.max_depth,
                crawlOptions.max_pages
              );
              break;
            case 'typescript':
              crawlResult = await this.ragClient.crawlTypeScriptDocs(
                crawlOptions.url,
                crawlOptions.max_depth,
                crawlOptions.max_pages
              );
              break;
            case 'nestjs':
              crawlResult = await this.ragClient.crawlNestJSDocs(
                crawlOptions.url,
                crawlOptions.max_depth,
                crawlOptions.max_pages
              );
              break;
            default:
              throw new Error(`Unknown documentation source: ${source}`);
          }

          const duration = Date.now() - sourceStartTime;
          result.results[source] = {
            success: true,
            pagesProcessed: crawlResult.content?.length || 0,
            duration
          };
          result.successful++;

          this.logger.log(`${source} documentation updated successfully in ${duration}ms`);
        } catch (error) {
          const duration = Date.now() - sourceStartTime;
          result.results[source] = {
            success: false,
            error: error.message,
            duration
          };
          result.failed++;

          this.logger.error(`Failed to update ${source} documentation:`, error);
        }
      }

      const totalDuration = Date.now() - startTime;
      this.logger.log(`Documentation update completed in ${totalDuration}ms`, {
        successful: result.successful,
        failed: result.failed,
        total: result.totalSources
      });

      this.lastUpdateResult = result;
      return result;

    } finally {
      this.isUpdating = false;
    }
  }

  /**
   * Get the status of the documentation update process
   */
  getUpdateStatus(): {
    isUpdating: boolean;
    lastUpdate: DocumentationUpdateResult | null;
  } {
    return {
      isUpdating: this.isUpdating,
      lastUpdate: this.lastUpdateResult
    };
  }

  /**
   * Get documentation health check for all sources
   */
  async performDocumentationHealthCheck(): Promise<{
    overallHealth: 'healthy' | 'degraded' | 'unhealthy';
    sources: {
      [source: string]: {
        available: boolean;
        lastUpdated?: string;
        documentCount?: number;
        error?: string;
      };
    };
    ragServerStatus: any;
  }> {
    this.logger.log('Performing documentation health check...');

    try {
      // Check RAG server status
      const ragStatus = await this.ragClient.getRAGStatus();
      
      const sources = ['vscode', 'copilot', 'typescript', 'nestjs'];
      const sourceResults: any = {};
      let healthyCount = 0;

      for (const source of sources) {
        try {
          // Perform a simple query to test each source
          const testResult = await this.ragClient.performRAGQuery(
            'test query',
            source,
            1,
            false
          );
          
          sourceResults[source] = {
            available: true,
            lastUpdated: this.lastUpdateResult?.results[source] ? this.lastUpdateResult.timestamp : 'unknown',
            documentCount: testResult.content?.length || 0
          };
          healthyCount++;
        } catch (error: unknown) {
          sourceResults[source] = {
            available: false,
            error: (error as Error).message
          };
        }
      }

      let overallHealth: 'healthy' | 'degraded' | 'unhealthy';
      if (healthyCount === sources.length) {
        overallHealth = 'healthy';
      } else if (healthyCount > 0) {
        overallHealth = 'degraded';
      } else {
        overallHealth = 'unhealthy';
      }

      return {
        overallHealth,
        sources: sourceResults,
        ragServerStatus: ragStatus
      };

    } catch (error: unknown) {
      this.logger.error('Documentation health check failed:', error);
      
      return {
        overallHealth: 'unhealthy',
        sources: {},
        ragServerStatus: { error: (error as Error).message }
      };
    }
  }

  /**
   * Search across all documentation sources
   */
  async searchAllDocumentation(query: string, options?: {
    maxResults?: number;
    includeCode?: boolean;
    sourceFilter?: string[];
  }): Promise<{
    query: string;
    totalResults: number;
    sources: {
      [source: string]: {
        results: any[];
        count: number;
        error?: string;
      };
    };
  }> {
    const sources = options?.sourceFilter || ['vscode', 'copilot', 'typescript', 'nestjs'];
    const maxResultsPerSource = Math.ceil((options?.maxResults || 20) / sources.length);

    const response = {
      query,
      totalResults: 0,
      sources: {} as any
    };

    for (const source of sources) {
      try {
        const result = await this.ragClient.performRAGQuery(
          query,
          source,
          maxResultsPerSource,
          options?.includeCode !== false
        );

        response.sources[source] = {
          results: result.content || [],
          count: result.content?.length || 0
        };
        response.totalResults += result.content?.length || 0;

      } catch (error: unknown) {
        this.logger.warn(`Search failed for source ${source}:`, error);
        response.sources[source] = {
          results: [],
          count: 0,
          error: (error as Error).message
        };
      }
    }

    return response;
  }

  /**
   * Get recommendations for improving documentation coverage
   */
  async getDocumentationRecommendations(): Promise<{
    recommendations: string[];
    missingTopics: string[];
    updateFrequency: string;
    healthScore: number;
  }> {
    const healthCheck = await this.performDocumentationHealthCheck();
    const recommendations: string[] = [];
    const missingTopics: string[] = [];
    let healthScore = 0;

    // Calculate health score
    const totalSources = Object.keys(healthCheck.sources).length;
    const healthySources = Object.values(healthCheck.sources).filter(s => s.available).length;
    healthScore = totalSources > 0 ? (healthySources / totalSources) * 100 : 0;

    // Generate recommendations based on health check
    if (healthCheck.overallHealth === 'unhealthy') {
      recommendations.push('Critical: RAG server appears to be down or misconfigured');
      recommendations.push('Verify RAG server is running and accessible');
    } else if (healthCheck.overallHealth === 'degraded') {
      recommendations.push('Some documentation sources are unavailable');
      recommendations.push('Check failed sources and consider manual update');
    }

    if (!this.lastUpdateResult) {
      recommendations.push('No documentation updates have been performed yet');
      recommendations.push('Run initial documentation crawling for all sources');
    } else {
      const lastUpdate = new Date(this.lastUpdateResult.timestamp);
      const daysSinceUpdate = (Date.now() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24);
      
      if (daysSinceUpdate > 7) {
        recommendations.push('Documentation is more than a week old');
        recommendations.push('Consider updating documentation sources');
      }
    }

    // Common missing topics to check for
    const commonTopics = [
      'VS Code extension development',
      'GitHub Copilot API',
      'TypeScript decorators',
      'NestJS microservices'
    ];

    // This would typically involve querying for these topics
    // For now, we'll suggest them as potential missing topics
    missingTopics.push(...commonTopics);

    return {
      recommendations,
      missingTopics,
      updateFrequency: 'Daily at 2:00 AM',
      healthScore: Math.round(healthScore)
    };
  }
}
