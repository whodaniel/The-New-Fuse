/**
 * The New Fuse VSCode Extension - Workspace Indexing Service
 *
 * Indexes the workspace for semantic search and intelligent code navigation
 * Builds symbol index, file relationships, and dependency graphs
 */

import * as vscode from 'vscode';
import { log } from '../utils/logger';

interface FileIndex {
  uri: vscode.Uri;
  symbols: vscode.DocumentSymbol[];
  imports: string[];
  exports: string[];
  language: string;
  lastIndexed: number;
}

interface SymbolIndex {
  name: string;
  kind: vscode.SymbolKind;
  uri: vscode.Uri;
  range: vscode.Range;
  containerName?: string;
}

interface WorkspaceStats {
  totalFiles: number;
  indexedFiles: number;
  totalSymbols: number;
  languages: Map<string, number>;
  lastIndexTime: number;
}

export class WorkspaceIndexingService {
  private static instance: WorkspaceIndexingService;

  private fileIndex: Map<string, FileIndex> = new Map();
  private symbolIndex: Map<string, SymbolIndex[]> = new Map();
  private stats: WorkspaceStats = {
    totalFiles: 0,
    indexedFiles: 0,
    totalSymbols: 0,
    languages: new Map(),
    lastIndexTime: 0,
  };

  private isIndexing = false;
  private indexingProgress?: vscode.Progress<{ message?: string; increment?: number }>;
  private fileWatchers: vscode.FileSystemWatcher[] = [];

  private readonly supportedLanguages = [
    'typescript',
    'javascript',
    'python',
    'java',
    'csharp',
    'go',
    'rust',
    'cpp',
    'c',
    'php',
    'ruby',
  ];

  private constructor() {}

  public static getInstance(): WorkspaceIndexingService {
    if (!WorkspaceIndexingService.instance) {
      WorkspaceIndexingService.instance = new WorkspaceIndexingService();
    }
    return WorkspaceIndexingService.instance;
  }

  /**
   * Initialize the workspace indexing service
   */
  public async initialize(): Promise<void> {
    log.info('Initializing workspace indexing service...');

    // Set up file watchers
    this.setupFileWatchers();

    // Start initial indexing in background
    this.startBackgroundIndexing();

    log.info('Workspace indexing service initialized');
  }

  /**
   * Start background indexing
   */
  private async startBackgroundIndexing(): Promise<void> {
    if (this.isIndexing) {
      log.warn('Indexing already in progress');
      return;
    }

    this.isIndexing = true;

    await vscode.window.withProgress(
      {
        location: vscode.ProgressLocation.Window,
        title: 'The New Fuse: Indexing workspace',
        cancellable: true,
      },
      async (progress, token) => {
        this.indexingProgress = progress;

        try {
          await this.indexWorkspace(progress, token);
        } catch (error) {
          log.error('Workspace indexing failed', error);
        } finally {
          this.isIndexing = false;
          this.indexingProgress = undefined;
        }
      }
    );
  }

  /**
   * Index the entire workspace
   */
  private async indexWorkspace(
    progress: vscode.Progress<{ message?: string; increment?: number }>,
    token: vscode.CancellationToken
  ): Promise<void> {
    const startTime = Date.now();
    log.info('Starting workspace indexing...');

    // Find all files
    const files = await this.findAllFiles();
    this.stats.totalFiles = files.length;

    log.info(`Found ${files.length} files to index`);

    let indexed = 0;
    const batchSize = 10;

    for (let i = 0; i < files.length; i += batchSize) {
      if (token.isCancellationRequested) {
        log.info('Indexing cancelled');
        return;
      }

      const batch = files.slice(i, Math.min(i + batchSize, files.length));

      await Promise.all(
        batch.map(async (file) => {
          try {
            await this.indexFile(file);
            indexed++;
          } catch (error) {
            log.warn(`Failed to index ${file.fsPath}`, error);
          }
        })
      );

      const percentComplete = Math.round((indexed / files.length) * 100);
      progress.report({
        message: `Indexing... ${indexed}/${files.length} files (${percentComplete}%)`,
        increment: (batchSize / files.length) * 100,
      });
    }

    this.stats.indexedFiles = indexed;
    this.stats.lastIndexTime = Date.now() - startTime;

    log.info(
      `Workspace indexing complete: ${indexed}/${files.length} files in ${this.stats.lastIndexTime}ms`
    );

    vscode.window.showInformationMessage(
      `✓ Indexed ${indexed} files with ${this.stats.totalSymbols} symbols`
    );
  }

  /**
   * Find all indexable files in the workspace
   */
  private async findAllFiles(): Promise<vscode.Uri[]> {
    const patterns = this.supportedLanguages.map((lang) => this.getGlobPattern(lang));
    const allFiles: vscode.Uri[] = [];

    for (const pattern of patterns) {
      const files = await vscode.workspace.findFiles(
        pattern,
        '**/node_modules/**,**/.git/**,**/dist/**,**/out/**,**/build/**'
      );
      allFiles.push(...files);
    }

    // Remove duplicates
    const uniqueFiles = Array.from(new Set(allFiles.map((f) => f.toString()))).map((f) =>
      vscode.Uri.parse(f)
    );

    return uniqueFiles;
  }

  /**
   * Get glob pattern for language
   */
  private getGlobPattern(language: string): string {
    const patterns: Record<string, string> = {
      typescript: '**/*.{ts,tsx}',
      javascript: '**/*.{js,jsx,mjs,cjs}',
      python: '**/*.py',
      java: '**/*.java',
      csharp: '**/*.cs',
      go: '**/*.go',
      rust: '**/*.rs',
      cpp: '**/*.{cpp,cc,cxx,hpp,hxx}',
      c: '**/*.{c,h}',
      php: '**/*.php',
      ruby: '**/*.rb',
    };

    return patterns[language] || `**/*.${language}`;
  }

  /**
   * Index a single file
   */
  private async indexFile(uri: vscode.Uri): Promise<void> {
    try {
      const document = await vscode.workspace.openTextDocument(uri);

      // Skip if language not supported
      if (!this.supportedLanguages.includes(document.languageId)) {
        return;
      }

      // Get symbols from document
      const symbols = await vscode.commands.executeCommand<vscode.DocumentSymbol[]>(
        'vscode.executeDocumentSymbolProvider',
        uri
      );

      if (!symbols) {
        return;
      }

      // Build file index
      const fileIndex: FileIndex = {
        uri,
        symbols,
        imports: this.extractImports(document),
        exports: this.extractExports(document),
        language: document.languageId,
        lastIndexed: Date.now(),
      };

      this.fileIndex.set(uri.toString(), fileIndex);

      // Build symbol index
      this.indexSymbols(uri, symbols);

      // Update stats
      this.updateStats(document.languageId, symbols);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Index symbols from a file
   */
  private indexSymbols(uri: vscode.Uri, symbols: vscode.DocumentSymbol[]): void {
    const flattenSymbols = (
      symbols: vscode.DocumentSymbol[],
      containerName?: string
    ): SymbolIndex[] => {
      const result: SymbolIndex[] = [];

      for (const symbol of symbols) {
        const symbolIndex: SymbolIndex = {
          name: symbol.name,
          kind: symbol.kind,
          uri,
          range: symbol.range,
          containerName,
        };

        result.push(symbolIndex);

        // Add to symbol index
        const existing = this.symbolIndex.get(symbol.name) || [];
        existing.push(symbolIndex);
        this.symbolIndex.set(symbol.name, existing);

        // Process children recursively
        if (symbol.children && symbol.children.length > 0) {
          result.push(...flattenSymbols(symbol.children, symbol.name));
        }
      }

      return result;
    };

    flattenSymbols(symbols);
  }

  /**
   * Extract imports from document
   */
  private extractImports(document: vscode.TextDocument): string[] {
    const imports: string[] = [];
    const text = document.getText();

    // Match common import patterns
    const patterns = [
      /import\s+.*\s+from\s+['"](.+)['"]/g, // ES6 imports
      /require\(['"](.+)['"]\)/g, // CommonJS
      /from\s+(.+)\s+import/g, // Python
      /import\s+(.+);/g, // Java/C#/Go
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        imports.push(match[1]);
      }
    }

    return imports;
  }

  /**
   * Extract exports from document
   */
  private extractExports(document: vscode.TextDocument): string[] {
    const exports: string[] = [];
    const text = document.getText();

    // Match common export patterns
    const patterns = [
      /export\s+(default\s+)?(class|function|const|let|var)\s+(\w+)/g, // ES6 exports
      /export\s+\{([^}]+)\}/g, // Named exports
      /module\.exports\s*=\s*(\w+)/g, // CommonJS
    ];

    for (const pattern of patterns) {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        const exportName = match[3] || match[1] || match[0];
        exports.push(exportName.trim());
      }
    }

    return exports;
  }

  /**
   * Update statistics
   */
  private updateStats(language: string, symbols: vscode.DocumentSymbol[]): void {
    const count = this.stats.languages.get(language) || 0;
    this.stats.languages.set(language, count + 1);

    this.stats.totalSymbols += this.countSymbols(symbols);
  }

  /**
   * Count total symbols recursively
   */
  private countSymbols(symbols: vscode.DocumentSymbol[]): number {
    let count = symbols.length;

    for (const symbol of symbols) {
      if (symbol.children) {
        count += this.countSymbols(symbol.children);
      }
    }

    return count;
  }

  /**
   * Search for symbols by name
   */
  public searchSymbols(query: string): SymbolIndex[] {
    const results: SymbolIndex[] = [];
    const lowerQuery = query.toLowerCase();

    for (const [name, symbols] of this.symbolIndex.entries()) {
      if (name.toLowerCase().includes(lowerQuery)) {
        results.push(...symbols);
      }
    }

    return results;
  }

  /**
   * Get file index
   */
  public getFileIndex(uri: vscode.Uri): FileIndex | undefined {
    return this.fileIndex.get(uri.toString());
  }

  /**
   * Get all files that import a given module
   */
  public getFilesThatImport(moduleName: string): vscode.Uri[] {
    const files: vscode.Uri[] = [];

    for (const [uriString, fileIndex] of this.fileIndex.entries()) {
      if (fileIndex.imports.some((imp) => imp.includes(moduleName))) {
        files.push(vscode.Uri.parse(uriString));
      }
    }

    return files;
  }

  /**
   * Get workspace statistics
   */
  public getStats(): WorkspaceStats {
    return { ...this.stats };
  }

  /**
   * Setup file watchers
   */
  private setupFileWatchers(): void {
    for (const language of this.supportedLanguages) {
      const pattern = this.getGlobPattern(language);
      const watcher = vscode.workspace.createFileSystemWatcher(pattern);

      watcher.onDidCreate((uri) => {
        this.indexFile(uri).catch((error) =>
          log.warn(`Failed to index new file ${uri.fsPath}`, error)
        );
      });

      watcher.onDidChange((uri) => {
        this.indexFile(uri).catch((error) =>
          log.warn(`Failed to re-index changed file ${uri.fsPath}`, error)
        );
      });

      watcher.onDidDelete((uri) => {
        this.fileIndex.delete(uri.toString());
      });

      this.fileWatchers.push(watcher);
    }
  }

  /**
   * Dispose resources
   */
  public dispose(): void {
    for (const watcher of this.fileWatchers) {
      watcher.dispose();
    }

    this.fileIndex.clear();
    this.symbolIndex.clear();
  }
}

/**
 * Get the singleton instance
 */
export function getWorkspaceIndexingService(): WorkspaceIndexingService {
  return WorkspaceIndexingService.getInstance();
}
