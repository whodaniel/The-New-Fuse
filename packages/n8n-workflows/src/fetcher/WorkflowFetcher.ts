/**
 * WorkflowFetcher
 * Fetches n8n workflows from GitHub repositories
 */

// Use require to bypass resolution issues in some environments
const simpleGit = require('simple-git');
type SimpleGit = any;
import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';
import {
  WorkflowSource,
  WorkflowFetchResult,
  N8nWorkflow,
} from '../types';
import { WorkflowParser } from '../parser/WorkflowParser';
import { WorkflowCategorizer } from '../categorizer/WorkflowCategorizer';

export interface RepositoryConfig {
  source: WorkflowSource;
  url: string;
  branch?: string;
  workflowPaths?: string[];
}

export class WorkflowFetcher {
  private git: SimpleGit;
  private parser: WorkflowParser;
  private categorizer: WorkflowCategorizer;
  private cacheDir: string;

  private repositories: RepositoryConfig[] = [
    {
      source: 'Zie619/n8n-workflows',
      url: 'https://github.com/Zie619/n8n-workflows.git',
      branch: 'main',
      workflowPaths: ['**/*.json'],
    },
    {
      source: 'enescingoz/awesome-n8n-templates',
      url: 'https://github.com/enescingoz/awesome-n8n-templates.git',
      branch: 'main',
      workflowPaths: ['**/*.json', 'templates/**/*.json'],
    },
    {
      source: 'Danitilahun/n8n-workflow-templates',
      url: 'https://github.com/Danitilahun/n8n-workflow-templates.git',
      branch: 'main',
      workflowPaths: ['**/*.json', 'workflows/**/*.json'],
    },
  ];

  constructor(cacheDir?: string) {
    this.git = simpleGit();
    this.parser = new WorkflowParser();
    this.categorizer = new WorkflowCategorizer();
    this.cacheDir = cacheDir || path.join(process.cwd(), '.n8n-workflows-cache');
  }

  /**
   * Fetch workflows from all repositories
   */
  public async fetchAll(): Promise<{
    workflows: N8nWorkflow[];
    results: WorkflowFetchResult[];
  }> {
    await this.ensureCacheDir();

    const results: WorkflowFetchResult[] = [];
    const allWorkflows: N8nWorkflow[] = [];

    for (const repo of this.repositories) {
      try {
        console.log(`Fetching workflows from ${repo.source}...`);
        const result = await this.fetchFromRepository(repo);
        results.push(result);

        if (result.success) {
          // Load workflows from the fetched repository
          const workflows = await this.loadWorkflowsFromRepo(repo);
          allWorkflows.push(...workflows);
        }
      } catch (error) {
        console.error(`Error fetching from ${repo.source}:`, error);
        results.push({
          success: false,
          workflowsAdded: 0,
          workflowsUpdated: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          source: repo.source,
        });
      }
    }

    return { workflows: allWorkflows, results };
  }

  /**
   * Fetch workflows from a specific repository
   */
  public async fetchFromRepository(
    repo: RepositoryConfig
  ): Promise<WorkflowFetchResult> {
    const repoPath = this.getRepoPath(repo.source);

    try {
      // Check if repo already exists
      const exists = await fs.pathExists(repoPath);

      if (exists) {
        // Pull latest changes
        console.log(`Updating repository ${repo.source}...`);
        const git = simpleGit(repoPath);
        await git.pull('origin', repo.branch || 'main');
      } else {
        // Clone repository
        console.log(`Cloning repository ${repo.source}...`);
        await this.git.clone(repo.url, repoPath, {
          '--depth': 1,
          '--branch': repo.branch || 'main',
        });
      }

      return {
        success: true,
        workflowsAdded: 0,
        workflowsUpdated: 0,
        errors: [],
        source: repo.source,
      };
    } catch (error) {
      console.error(`Error with repository ${repo.source}:`, error);
      return {
        success: false,
        workflowsAdded: 0,
        workflowsUpdated: 0,
        errors: [error instanceof Error ? error.message : String(error)],
        source: repo.source,
      };
    }
  }

  /**
   * Load workflows from a repository
   */
  private async loadWorkflowsFromRepo(
    repo: RepositoryConfig
  ): Promise<N8nWorkflow[]> {
    const repoPath = this.getRepoPath(repo.source);
    const workflows: N8nWorkflow[] = [];

    const patterns = repo.workflowPaths || ['**/*.json'];

    for (const pattern of patterns) {
      try {
        const files = (await (glob as any)(pattern, {
          cwd: repoPath,
          absolute: true,
          ignore: ['**/node_modules/**', '**/package.json', '**/package-lock.json'],
        })) as string[];

        console.log(`Found ${files.length} files matching ${pattern} in ${repo.source}`);

        for (const file of files) {
          try {
            const content = await fs.readJSON(file);

            // Skip if not a workflow (e.g., package.json)
            if (!this.isWorkflowFile(content, file)) {
              continue;
            }

            const workflow = this.parser.parseWorkflow(
              content,
              repo.source,
              path.relative(repoPath, file)
            );

            if (workflow) {
              // Categorize workflow
              workflow.category = this.categorizer.categorize(workflow);
              workflow.metadata.category = workflow.category;
              workflows.push(workflow);
            }
          } catch (error) {
            console.error(`Error parsing workflow file ${file}:`, error);
          }
        }
      } catch (error) {
        console.error(`Error globbing pattern ${pattern}:`, error);
      }
    }

    console.log(`Loaded ${workflows.length} workflows from ${repo.source}`);
    return workflows;
  }

  /**
   * Check if a JSON file is a workflow
   */
  private isWorkflowFile(content: any, filePath: string): boolean {
    // Check if it has workflow-like structure
    if (!content || typeof content !== 'object') {
      return false;
    }

    // Skip package.json and other common files
    const fileName = path.basename(filePath).toLowerCase();
    if (
      fileName === 'package.json' ||
      fileName === 'package-lock.json' ||
      fileName === 'tsconfig.json' ||
      fileName.startsWith('.')
    ) {
      return false;
    }

    // Check for n8n workflow properties
    return (
      content.name !== undefined ||
      content.nodes !== undefined ||
      content.connections !== undefined ||
      (content.meta && content.meta.instanceId !== undefined)
    );
  }

  /**
   * Get repository path
   */
  private getRepoPath(source: WorkflowSource): string {
    const safeName = source.replace(/[^a-zA-Z0-9-]/g, '_');
    return path.join(this.cacheDir, safeName);
  }

  /**
   * Ensure cache directory exists
   */
  private async ensureCacheDir(): Promise<void> {
    await fs.ensureDir(this.cacheDir);
  }

  /**
   * Clear cache
   */
  public async clearCache(): Promise<void> {
    await fs.remove(this.cacheDir);
  }

  /**
   * Get cache info
   */
  public async getCacheInfo(): Promise<{
    exists: boolean;
    size?: number;
    repositories: string[];
  }> {
    const exists = await fs.pathExists(this.cacheDir);

    if (!exists) {
      return { exists: false, repositories: [] };
    }

    const repositories: string[] = [];
    const entries = await fs.readdir(this.cacheDir);

    for (const entry of entries) {
      const entryPath = path.join(this.cacheDir, entry);
      const stats = await fs.stat(entryPath);
      if (stats.isDirectory()) {
        repositories.push(entry);
      }
    }

    return { exists: true, repositories };
  }

  /**
   * Fetch workflows from a specific source
   */
  public async fetchFromSource(
    source: WorkflowSource
  ): Promise<N8nWorkflow[]> {
    const repo = this.repositories.find((r) => r.source === source);

    if (!repo) {
      throw new Error(`Unknown source: ${source}`);
    }

    await this.ensureCacheDir();
    await this.fetchFromRepository(repo);
    return this.loadWorkflowsFromRepo(repo);
  }

  /**
   * Get all configured sources
   */
  public getSources(): WorkflowSource[] {
    return this.repositories.map((r) => r.source);
  }

  /**
   * Add custom repository
   */
  public addRepository(config: RepositoryConfig): void {
    this.repositories.push(config);
  }
}
