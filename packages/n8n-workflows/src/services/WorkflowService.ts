/**
 * WorkflowService
 * High-level service for managing n8n workflows
 */

import axios from 'axios';
import { WorkflowCategorizer } from '../categorizer/WorkflowCategorizer.js';
import { WorkflowFetcher } from '../fetcher/WorkflowFetcher.js';
import { WorkflowParser } from '../parser/WorkflowParser.js';
import { RegistryConfig, WorkflowRegistry } from '../registry/WorkflowRegistry.js';
import {
  CategoryConfig,
  N8nWorkflow,
  WorkflowCategory,
  WorkflowFetchResult,
  WorkflowImportRequest,
  WorkflowImportResponse,
  WorkflowSearchQuery,
  WorkflowSearchResult,
  WorkflowSource,
  WorkflowStats,
} from '../types/index.js';

export class WorkflowService {
  private fetcher: WorkflowFetcher;
  private parser: WorkflowParser;
  private categorizer: WorkflowCategorizer;
  private registry: WorkflowRegistry;
  private initialized: boolean = false;

  constructor(registryConfig?: RegistryConfig) {
    this.fetcher = new WorkflowFetcher();
    this.parser = new WorkflowParser();
    this.categorizer = new WorkflowCategorizer();
    this.registry = new WorkflowRegistry(registryConfig);
  }

  /**
   * Initialize the service
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.registry.initialize();
    this.initialized = true;
  }

  /**
   * Sync workflows from all sources
   */
  public async syncWorkflows(): Promise<{
    success: boolean;
    totalWorkflows: number;
    stats: WorkflowStats;
    errors: string[];
  }> {
    await this.initialize();

    console.log('Starting workflow sync...');

    const { workflows, results } = await this.fetcher.fetchAll();

    // Add workflows to registry
    this.registry.clear();
    this.registry.addWorkflows(workflows);
    this.registry.updateLastSync();

    // Save to disk
    await this.registry.saveToDisk();

    const stats = this.registry.getStats();
    const errors = results.flatMap((r: WorkflowFetchResult) => r.errors);

    console.log(`Sync complete. Total workflows: ${workflows.length}`);

    return {
      success: errors.length === 0,
      totalWorkflows: workflows.length,
      stats,
      errors,
    };
  }

  /**
   * Sync workflows from a specific source
   */
  public async syncFromSource(source: WorkflowSource): Promise<number> {
    await this.initialize();

    const workflows = await this.fetcher.fetchFromSource(source);

    // Remove existing workflows from this source
    const existing = this.registry.getBySource(source);
    existing.forEach((w: N8nWorkflow) => this.registry.deleteWorkflow(w.id));

    // Add new workflows
    this.registry.addWorkflows(workflows);
    this.registry.updateLastSync();

    await this.registry.saveToDisk();

    return workflows.length;
  }

  /**
   * Search workflows
   */
  public async search(query: WorkflowSearchQuery): Promise<WorkflowSearchResult> {
    await this.initialize();
    return this.registry.search(query);
  }

  /**
   * Get workflow by ID
   */
  public async getWorkflow(id: string): Promise<N8nWorkflow | undefined> {
    await this.initialize();
    return this.registry.getWorkflow(id);
  }

  /**
   * Get all workflows
   */
  public async getAllWorkflows(): Promise<N8nWorkflow[]> {
    await this.initialize();
    return this.registry.getAllWorkflows();
  }

  /**
   * Get workflows by category
   */
  public async getByCategory(category: WorkflowCategory): Promise<N8nWorkflow[]> {
    await this.initialize();
    return this.registry.getByCategory(category);
  }

  /**
   * Get workflow statistics
   */
  public async getStats(): Promise<WorkflowStats> {
    await this.initialize();
    return this.registry.getStats();
  }

  /**
   * Get all categories
   */
  public async getCategories(): Promise<{
    categories: Array<{
      name: WorkflowCategory;
      count: number;
      displayName: string;
      description: string;
    }>;
  }> {
    await this.initialize();

    const stats = this.registry.getStats();
    const configs = this.categorizer.getCategoryConfigs();

    const categories = configs.map((config: CategoryConfig) => ({
      name: config.name,
      count: stats.byCategory[config.name] || 0,
      displayName: config.displayName,
      description: config.description,
    }));

    return { categories };
  }

  /**
   * Import workflow to n8n instance
   */
  public async importToN8n(request: WorkflowImportRequest): Promise<WorkflowImportResponse> {
    await this.initialize();

    const validationError = this.validateN8nInstanceUrl(request.n8nInstanceUrl);
    if (validationError) {
      return {
        success: false,
        error: `Invalid n8n instance URL: ${validationError}`,
      };
    }

    const baseUrl = new URL(request.n8nInstanceUrl);
    const importUrl = new URL('/api/v1/workflows', baseUrl).toString();

    const workflow = this.registry.getWorkflow(request.workflowId);

    if (!workflow) {
      return {
        success: false,
        error: 'Workflow not found',
      };
    }

    try {
      // Import to n8n instance
      const response = await axios.post(
        importUrl,
        {
          ...workflow.jsonDefinition,
          active: request.activate || false,
        },
        {
          headers: {
            'X-N8N-API-KEY': request.apiKey || '',
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        workflowId: response.data.id,
        message: 'Workflow imported successfully',
      };
    } catch (error) {
      console.error('Error importing workflow to n8n:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to import workflow',
      };
    }
  }

  /**
   * Get similar workflows
   */
  public async getSimilarWorkflows(workflowId: string, limit?: number): Promise<N8nWorkflow[]> {
    await this.initialize();
    return this.registry.getSimilarWorkflows(workflowId, limit);
  }

  /**
   * Get all tags
   */
  public async getAllTags(): Promise<string[]> {
    await this.initialize();
    return this.registry.getAllTags();
  }

  /**
   * Get workflows by tag
   */
  public async getByTag(tag: string): Promise<N8nWorkflow[]> {
    await this.initialize();
    return this.registry.getByTag(tag);
  }

  /**
   * Export workflows to JSON
   */
  public async exportToJSON(): Promise<string> {
    await this.initialize();
    return this.registry.exportToJSON();
  }

  /**
   * Import workflows from JSON
   */
  public async importFromJSON(json: string): Promise<number> {
    await this.initialize();
    const imported = this.registry.importFromJSON(json);
    await this.registry.saveToDisk();
    return imported;
  }

  /**
   * Get workflow count
   */
  public async getCount(): Promise<number> {
    await this.initialize();
    return this.registry.count();
  }

  /**
   * Clear all workflows
   */
  public async clear(): Promise<void> {
    await this.initialize();
    this.registry.clear();
    await this.registry.saveToDisk();
  }

  private validateN8nInstanceUrl(rawUrl: string): string | null {
    let parsed: URL;
    try {
      parsed = new URL(rawUrl);
    } catch {
      return 'Malformed URL';
    }

    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return `Unsupported protocol: ${parsed.protocol}`;
    }

    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host === '127.0.0.1' || host === '::1') {
      return 'Loopback URLs are not allowed';
    }
    if (
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return 'Private network URLs are not allowed';
    }

    return null;
  }
}
