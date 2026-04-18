/**
 * The New Fuse VSCode Extension - Workspace Service
 * Version 9.1.0 - Frontier Capabilities
 *
 * Provides codebase awareness through VSCode workspace APIs.
 * Implements glob search, grep, file operations, and workspace structure analysis.
 */

import * as path from 'path';
import * as vscode from 'vscode';
import type { FileTree, SearchOptions, SearchResult } from '../core/types';
import { log } from '../utils/logger';

/**
 * Cache configuration
 */
interface CacheConfig {
  workspaceStructureTTL: number; // milliseconds
  fileCacheTTL: number;
  enabled: boolean;
}

/**
 * Cached workspace structure
 */
interface CachedWorkspaceStructure {
  data: FileTree | null;
  timestamp: number;
}

/**
 * Service providing workspace awareness and file operations
 */
export class WorkspaceService {
  private static instance: WorkspaceService;
  private workspaceStructureCache: CachedWorkspaceStructure = {
    data: null,
    timestamp: 0,
  };
  private cacheConfig: CacheConfig = {
    workspaceStructureTTL: 5 * 60 * 1000, // 5 minutes
    fileCacheTTL: 1 * 60 * 1000, // 1 minute
    enabled: true,
  };

  private constructor() {
    log.info('WorkspaceService initialized');

    // Watch for workspace changes to invalidate cache
    vscode.workspace.onDidChangeWorkspaceFolders(() => {
      this.invalidateCache();
    });
  }

  /**
   * Get singleton instance
   */
  static getInstance(): WorkspaceService {
    if (!WorkspaceService.instance) {
      WorkspaceService.instance = new WorkspaceService();
    }
    return WorkspaceService.instance;
  }

  // ============================================
  // File Search (Glob)
  // ============================================

  /**
   * Find files matching a glob pattern
   * Uses vscode.workspace.findFiles()
   *
   * @param pattern - Glob pattern (e.g., "**\/*.ts", "src/**\/*.{ts,tsx}")
   * @param exclude - Glob pattern to exclude (e.g., "**\/node_modules/**")
   * @param maxResults - Maximum number of results (default: 1000)
   * @returns Array of file URIs
   */
  async findFiles(
    pattern: string,
    exclude?: string,
    maxResults: number = 1000
  ): Promise<vscode.Uri[]> {
    try {
      log.info(`Finding files with pattern: ${pattern}`);
      const startTime = Date.now();

      // Default excludes: node_modules, .git, dist, build
      const defaultExclude = '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**}';
      const excludePattern = exclude ? `{${exclude},${defaultExclude}}` : defaultExclude;

      const files = await vscode.workspace.findFiles(pattern, excludePattern, maxResults);

      const duration = Date.now() - startTime;
      log.info(`Found ${files.length} files in ${duration}ms`);

      return files;
    } catch (error) {
      log.error('File search error', error);
      throw new Error(`Failed to search files: ${(error as Error).message}`);
    }
  }

  // ============================================
  // Content Search (Grep)
  // ============================================

  /**
   * Search for text within workspace files
   * Custom implementation using VSCode fs API + regex
   *
   * @param options - Search options (pattern, regex, case sensitivity, etc.)
   * @returns Array of search results with line numbers and context
   */
  async findTextInFiles(options: SearchOptions): Promise<SearchResult[]> {
    try {
      log.info(`Searching text: "${options.pattern}"`);
      const startTime = Date.now();

      // Find files to search
      const includePattern = options.includePattern || '**/*';
      const excludePattern = options.excludePattern;
      const maxResults = options.maxResults || 1000;

      const files = await this.findFiles(includePattern, excludePattern, 10000);

      const results: SearchResult[] = [];
      const searchRegex = this.createSearchRegex(options);

      // Search each file
      for (const fileUri of files) {
        if (results.length >= maxResults) break;

        const fileResults = await this.searchInFile(fileUri, searchRegex, options);
        results.push(...fileResults);

        if (results.length >= maxResults) {
          results.splice(maxResults); // Trim to max
          break;
        }
      }

      const duration = Date.now() - startTime;
      log.info(`Found ${results.length} matches in ${duration}ms`);

      return results;
    } catch (error) {
      log.error('Text search error', error);
      throw new Error(`Failed to search text: ${(error as Error).message}`);
    }
  }

  /**
   * Search within a single file
   */
  private async searchInFile(
    fileUri: vscode.Uri,
    regex: RegExp,
    options: SearchOptions
  ): Promise<SearchResult[]> {
    const results: SearchResult[] = [];

    try {
      const content = await this.readFile(fileUri);
      const lines = content.split('\n');

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const match = line.match(regex);

        if (match) {
          const result: SearchResult = {
            file: fileUri.fsPath,
            line: i + 1, // 1-indexed
            column: match.index ? match.index + 1 : 1,
            matchText: line.trim(),
          };

          // Add context lines if needed
          if (options.maxResults === undefined || results.length < options.maxResults) {
            result.contextBefore = lines.slice(Math.max(0, i - 2), i).map((l) => l.trim());
            result.contextAfter = lines
              .slice(i + 1, Math.min(lines.length, i + 3))
              .map((l) => l.trim());
          }

          results.push(result);
        }
      }
    } catch (error) {
      // Skip files that can't be read (binary, permissions, etc.)
      log.warn(`Could not search file: ${fileUri.fsPath}`, error);
    }

    return results;
  }

  /**
   * Create regex from search options
   */
  private createSearchRegex(options: SearchOptions): RegExp {
    let pattern = options.pattern;

    // Escape regex special characters if not regex mode
    if (!options.isRegex) {
      pattern = pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    const flags = options.isCaseSensitive ? 'g' : 'gi';
    return new RegExp(pattern, flags);
  }

  // ============================================
  // File Operations
  // ============================================

  /**
   * Read file content as string
   *
   * @param uri - File URI
   * @returns File content as UTF-8 string
   */
  async readFile(uri: vscode.Uri): Promise<string> {
    try {
      const content = await vscode.workspace.fs.readFile(uri);
      return new TextDecoder('utf-8').decode(content);
    } catch (error) {
      throw new Error(`Failed to read file ${uri.fsPath}: ${(error as Error).message}`);
    }
  }

  /**
   * Read specific range from file
   *
   * @param uri - File URI
   * @param range - Range to read
   * @returns Content within range
   */
  async readFileRange(uri: vscode.Uri, range: vscode.Range): Promise<string> {
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      return doc.getText(range);
    } catch (error) {
      throw new Error(`Failed to read file range: ${(error as Error).message}`);
    }
  }

  /**
   * Write content to file
   *
   * @param uri - File URI
   * @param content - Content to write
   */
  async writeFile(uri: vscode.Uri, content: string): Promise<void> {
    try {
      const encoded = new TextEncoder().encode(content);
      await vscode.workspace.fs.writeFile(uri, encoded);
      log.info(`File written: ${uri.fsPath}`);
    } catch (error) {
      throw new Error(`Failed to write file: ${(error as Error).message}`);
    }
  }

  /**
   * Check if file or directory exists
   */
  async exists(uri: vscode.Uri): Promise<boolean> {
    try {
      await vscode.workspace.fs.stat(uri);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get file/directory stats
   */
  async stat(uri: vscode.Uri): Promise<vscode.FileStat> {
    return vscode.workspace.fs.stat(uri);
  }

  // ============================================
  // Workspace Structure
  // ============================================

  /**
   * Get workspace folder structure as tree
   * Results are cached for performance
   *
   * @param forceRefresh - Skip cache and rebuild
   * @returns File tree starting from workspace root
   */
  async getWorkspaceStructure(forceRefresh: boolean = false): Promise<FileTree | null> {
    // Check cache
    if (
      !forceRefresh &&
      this.cacheConfig.enabled &&
      this.workspaceStructureCache.data &&
      Date.now() - this.workspaceStructureCache.timestamp < this.cacheConfig.workspaceStructureTTL
    ) {
      log.info('Returning cached workspace structure');
      return this.workspaceStructureCache.data;
    }

    // Build structure
    const workspaceFolders = vscode.workspace.workspaceFolders;
    if (!workspaceFolders || workspaceFolders.length === 0) {
      log.warn('No workspace folders found');
      return null;
    }

    try {
      log.info('Building workspace structure');
      const startTime = Date.now();

      // For single folder workspace
      if (workspaceFolders.length === 1) {
        const root = workspaceFolders[0].uri;
        const tree = await this.buildFileTree(root, 3); // Max depth 3 for performance

        this.workspaceStructureCache = {
          data: tree,
          timestamp: Date.now(),
        };

        const duration = Date.now() - startTime;
        log.info(`Workspace structure built in ${duration}ms`);

        return tree;
      }

      // Multi-root workspace
      const trees: FileTree[] = [];
      for (const folder of workspaceFolders) {
        const tree = await this.buildFileTree(folder.uri, 3);
        if (tree) trees.push(tree);
      }

      const multiRootTree: FileTree = {
        name: 'Workspace',
        path: '',
        type: 'directory',
        children: trees,
      };

      this.workspaceStructureCache = {
        data: multiRootTree,
        timestamp: Date.now(),
      };

      const duration = Date.now() - startTime;
      log.info(`Workspace structure built in ${duration}ms`);

      return multiRootTree;
    } catch (error) {
      log.error('Failed to build workspace structure', error);
      return null;
    }
  }

  /**
   * Build file tree recursively
   */
  private async buildFileTree(
    uri: vscode.Uri,
    maxDepth: number,
    currentDepth: number = 0
  ): Promise<FileTree | null> {
    try {
      const stat = await vscode.workspace.fs.stat(uri);
      const name = path.basename(uri.fsPath);

      // Skip hidden directories and common build folders
      if (name.startsWith('.') || ['node_modules', 'dist', 'build', 'out'].includes(name)) {
        return null;
      }

      if (stat.type === vscode.FileType.File) {
        return {
          name,
          path: uri.fsPath,
          type: 'file',
          size: stat.size,
        };
      }

      if (stat.type === vscode.FileType.Directory) {
        const children: FileTree[] = [];

        // Only recurse if within depth limit
        if (currentDepth < maxDepth) {
          const entries = await vscode.workspace.fs.readDirectory(uri);

          for (const [childName, childType] of entries) {
            const childUri = vscode.Uri.joinPath(uri, childName);
            const childTree = await this.buildFileTree(childUri, maxDepth, currentDepth + 1);
            if (childTree) {
              children.push(childTree);
            }
          }
        }

        return {
          name,
          path: uri.fsPath,
          type: 'directory',
          children: children.length > 0 ? children : undefined,
        };
      }

      return null;
    } catch (error) {
      log.warn(`Could not access: ${uri.fsPath}`, error);
      return null;
    }
  }

  /**
   * Get workspace symbols (functions, classes, etc.)
   * Uses VSCode's symbol provider
   */
  async getWorkspaceSymbols(query?: string): Promise<vscode.SymbolInformation[]> {
    try {
      const symbols = await vscode.commands.executeCommand<vscode.SymbolInformation[]>(
        'vscode.executeWorkspaceSymbolProvider',
        query || ''
      );
      return symbols || [];
    } catch (error) {
      log.error('Failed to get workspace symbols', error);
      return [];
    }
  }

  /**
   * Get workspace root path
   */
  getWorkspaceRoot(): string | undefined {
    const folders = vscode.workspace.workspaceFolders;
    return folders && folders.length > 0 ? folders[0].uri.fsPath : undefined;
  }

  /**
   * Get all workspace folders
   */
  getWorkspaceFolders(): vscode.WorkspaceFolder[] {
    return vscode.workspace.workspaceFolders || [];
  }

  // ============================================
  // Cache Management
  // ============================================

  /**
   * Invalidate all caches
   */
  invalidateCache(): void {
    this.workspaceStructureCache = {
      data: null,
      timestamp: 0,
    };
    log.info('Workspace cache invalidated');
  }

  /**
   * Update cache configuration
   */
  setCacheConfig(config: Partial<CacheConfig>): void {
    this.cacheConfig = { ...this.cacheConfig, ...config };
    log.info('Cache config updated', this.cacheConfig);
  }

  /**
   * Get current cache configuration
   */
  getCacheConfig(): CacheConfig {
    return { ...this.cacheConfig };
  }
}

/**
 * Get singleton instance
 */
export function getWorkspaceService(): WorkspaceService {
  return WorkspaceService.getInstance();
}
