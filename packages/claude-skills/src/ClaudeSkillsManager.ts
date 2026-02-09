/**
 * Claude Skills Manager
 *
 * Main orchestrator for Claude Skills integration
 */

import { SkillLoader } from './loader';
import { SkillParser } from './parser';
import { SkillExecutor } from './executor';
import { SkillRegistry } from './registry';
import { MCPSkillProvider } from './integration';
import {
  ClaudeSkill,
  SkillLoaderConfig,
  SkillImportResult,
  SkillExecutionContext,
  SkillExecutionResult,
  SkillFilter,
} from './types';

/**
 * Configuration for Claude Skills Manager
 */
export interface ClaudeSkillsManagerConfig {
  loader?: Partial<SkillLoaderConfig>;
  autoInitialize?: boolean;
  prioritySkills?: string[];
}

/**
 * Main manager class for Claude Skills
 */
export class ClaudeSkillsManager {
  private loader: SkillLoader;
  private parser: SkillParser;
  private executor: SkillExecutor;
  private registry: SkillRegistry;
  private mcpProvider: MCPSkillProvider;
  private initialized: boolean = false;

  constructor(config?: ClaudeSkillsManagerConfig) {
    this.loader = new SkillLoader(config?.loader);
    this.parser = new SkillParser();
    this.executor = new SkillExecutor();
    this.registry = new SkillRegistry();
    this.mcpProvider = new MCPSkillProvider(this.registry, this.executor);

    if (config?.autoInitialize) {
      this.initialize(config.prioritySkills).catch(error => {
        console.error('Failed to auto-initialize Claude Skills:', error);
      });
    }
  }

  /**
   * Initialize the skills system
   */
  async initialize(prioritySkills?: string[]): Promise<SkillImportResult> {
    if (this.initialized) {
      console.warn('Claude Skills Manager already initialized');
      return {
        imported: 0,
        failed: 0,
        skipped: 0,
        skills: [],
        errors: [],
      };
    }

    try {
      // Initialize the loader (clone/update repository)
      await this.loader.initialize();

      // Load skills
      let result: SkillImportResult;
      if (prioritySkills && prioritySkills.length > 0) {
        // Load only priority skills
        result = await this.loader.loadSkillsByName(prioritySkills);
      } else {
        // Load all skills
        result = await this.loader.loadAllSkills();
      }

      // Register skills with registry and executor
      for (const skill of result.skills) {
        await this.registry.register(skill);
        this.executor.registerSkill(skill);
      }

      this.initialized = true;

      console.log(
        `Claude Skills Manager initialized: ${result.imported} skills loaded, ` +
        `${result.failed} failed, ${result.skipped} skipped`
      );

      if (result.errors.length > 0) {
        console.warn('Errors during initialization:', result.errors);
      }

      return result;
    } catch (error) {
      throw new Error(
        `Failed to initialize Claude Skills Manager: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Load additional skills by name
   */
  async loadSkills(skillNames: string[]): Promise<SkillImportResult> {
    const result = await this.loader.loadSkillsByName(skillNames);

    // Register new skills
    for (const skill of result.skills) {
      await this.registry.register(skill);
      this.executor.registerSkill(skill);
    }

    return result;
  }

  /**
   * Reload all skills from repository
   */
  async reloadSkills(): Promise<SkillImportResult> {
    // Clear existing skills
    this.registry.clear();
    this.executor.clear();

    // Reload from repository
    const result = await this.loader.loadAllSkills();

    // Register skills
    for (const skill of result.skills) {
      await this.registry.register(skill);
      this.executor.registerSkill(skill);
    }

    return result;
  }

  /**
   * Execute a skill
   */
  async executeSkill(context: SkillExecutionContext): Promise<SkillExecutionResult> {
    if (!this.initialized) {
      throw new Error('Claude Skills Manager not initialized. Call initialize() first.');
    }

    return await this.executor.execute(context);
  }

  /**
   * Get a skill by ID
   */
  async getSkill(skillId: string): Promise<ClaudeSkill | undefined> {
    return await this.registry.get(skillId);
  }

  /**
   * List skills with optional filtering
   */
  async listSkills(filter?: SkillFilter): Promise<ClaudeSkill[]> {
    return await this.registry.list(filter);
  }

  /**
   * Search skills
   */
  async searchSkills(query: string): Promise<ClaudeSkill[]> {
    return await this.registry.search(query);
  }

  /**
   * Get skills by category
   */
  async getSkillsByCategory(category: string): Promise<ClaudeSkill[]> {
    return await this.registry.getByCategory(category);
  }

  /**
   * Get skills by tag
   */
  async getSkillsByTag(tag: string): Promise<ClaudeSkill[]> {
    return await this.registry.getByTag(tag);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return this.registry.getCategories();
  }

  /**
   * Get all tags
   */
  getTags(): string[] {
    return this.registry.getTags();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    registry: ReturnType<SkillRegistry['getStatistics']>;
    executor: ReturnType<SkillExecutor['getStatistics']>;
    initialized: boolean;
  } {
    return {
      registry: this.registry.getStatistics(),
      executor: this.executor.getStatistics(),
      initialized: this.initialized,
    };
  }

  /**
   * Get MCP provider for integration
   */
  getMCPProvider(): MCPSkillProvider {
    return this.mcpProvider;
  }

  /**
   * Get available skill names from repository
   */
  async getAvailableSkillNames(): Promise<string[]> {
    return await this.loader.listAvailableSkills();
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    await this.loader.cleanup();
    this.registry.clear();
    this.executor.clear();
    this.initialized = false;
  }

  /**
   * Check if manager is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
}

/**
 * Create a singleton instance
 */
let globalInstance: ClaudeSkillsManager | null = null;

/**
 * Get the global Claude Skills Manager instance
 */
export function getClaudeSkillsManager(
  config?: ClaudeSkillsManagerConfig
): ClaudeSkillsManager {
  if (!globalInstance) {
    globalInstance = new ClaudeSkillsManager(config);
  }
  return globalInstance;
}

/**
 * Reset the global instance (useful for testing)
 */
export function resetClaudeSkillsManager(): void {
  if (globalInstance) {
    globalInstance.cleanup();
    globalInstance = null;
  }
}
