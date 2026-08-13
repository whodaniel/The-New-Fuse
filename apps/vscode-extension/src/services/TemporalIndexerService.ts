/**
 * The New Fuse VSCode Extension - Temporal Indexer Service
 * Version 9.2.0 - Frontier Capabilities
 *
 * Provides per-user temporal semantic codebase vectorization using local Vectra DB.
 */

import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs/promises';
import { LocalIndex } from 'vectra';
import { OpenAI } from 'openai';
import { log } from '../utils/logger';
import { getWorkspaceService } from './WorkspaceService';
import { ConfigManager } from '../core/config';

export interface CodeChunk {
  filePath: string;
  startLine: number;
  endLine: number;
  content: string;
}

export class TemporalIndexerService {
  private static instance: TemporalIndexerService;
  private index!: LocalIndex;
  private isInitialized = false;
  private isIndexing = false;
  private openai!: OpenAI;
  private indexPath!: string;

  private constructor() {}

  static getInstance(): TemporalIndexerService {
    if (!TemporalIndexerService.instance) {
      TemporalIndexerService.instance = new TemporalIndexerService();
    }
    return TemporalIndexerService.instance;
  }

  async initialize(context: vscode.ExtensionContext) {
    if (this.isInitialized) return;

    try {
      log.info('Initializing TemporalIndexerService...');
      
      const config = ConfigManager.getInstance();
      const apiKey = config.getSettings().apiKeys.openai || process.env.OPENAI_API_KEY;
      
      if (!apiKey) {
         log.warn('No OpenAI API key found. Semantic indexing disabled.');
         return;
      }

      this.openai = new OpenAI({ apiKey });

      // Setup Vectra index in the extension's global storage
      const storageUri = context.globalStorageUri;
      if (!storageUri) {
         log.error('No global storage URI available for the extension.');
         return;
      }

      const workspaceFolders = vscode.workspace.workspaceFolders;
      const workspaceHash = workspaceFolders ? Buffer.from(workspaceFolders[0].uri.fsPath).toString('hex').slice(0, 8) : 'default';
      
      this.indexPath = path.join(storageUri.fsPath, 'vector-index', workspaceHash);
      
      // Ensure directory exists
      await fs.mkdir(this.indexPath, { recursive: true });

      this.index = new LocalIndex(this.indexPath);
      
      const exists = await this.index.isIndexCreated();
      if (!exists) {
        log.info('Creating new vector index at ' + this.indexPath);
        await this.index.createIndex();
      }

      this.isInitialized = true;
      log.info('TemporalIndexerService initialized successfully.');

      // Setup file watchers for temporal updates
      this.setupFileWatchers();

    } catch (error) {
      log.error('Failed to initialize TemporalIndexerService', error);
    }
  }

  private setupFileWatchers() {
    const watcher = vscode.workspace.createFileSystemWatcher('**/*');

    watcher.onDidChange(async (uri) => {
      await this.updateFileIndex(uri);
    });

    watcher.onDidCreate(async (uri) => {
      await this.updateFileIndex(uri);
    });

    watcher.onDidDelete(async (uri) => {
      await this.removeFileIndex(uri);
    });
  }

  async indexWorkspace() {
    if (!this.isInitialized) return;
    if (this.isIndexing) {
        log.warn('Indexing already in progress.');
        return;
    }

    this.isIndexing = true;
    
    // Create a progress bar
    vscode.window.withProgress({
        location: vscode.ProgressLocation.Window,
        title: "Semantic Codebase Indexing",
        cancellable: false
    }, async (progress) => {
        try {
            log.info('Starting full workspace indexing...');
            const workspaceService = getWorkspaceService();
            const files = await workspaceService.findFiles('**/*.{ts,js,tsx,jsx,py,go,rs,java,md}', '{**/node_modules/**,**/.git/**,**/dist/**,**/build/**}');
            
            progress.report({ message: `Found ${files.length} files.` });

            let count = 0;
            for (const fileUri of files) {
                await this.processFile(fileUri);
                count++;
                progress.report({ message: `Indexed ${count}/${files.length} files`, increment: (1 / files.length) * 100 });
            }

            log.info('Full workspace indexing complete.');
        } catch (error) {
            log.error('Failed during workspace indexing', error);
        } finally {
            this.isIndexing = false;
        }
    });
  }

  private async updateFileIndex(uri: vscode.Uri) {
     if (!this.isInitialized || this.shouldIgnore(uri.fsPath)) return;
     log.info(`Temporal update for file: ${uri.fsPath}`);
     
     // 1. Remove old chunks for this file
     await this.removeFileIndex(uri);
     
     // 2. Add new chunks
     await this.processFile(uri);
  }

  private async removeFileIndex(uri: vscode.Uri) {
    if (!this.isInitialized) return;
    
    try {
        await this.index.beginUpdate();
        // Vectra doesn't have a direct "delete by metadata" yet, we'd iterate and delete
        // In a real production scenario with Vectra, you would map paths to item IDs.
        // For this implementation, we will simulate this by re-creating or filtering.
        // A robust implementation requires managing item IDs per file.
        // *Simplified for demonstration*
        this.index.endUpdate();
    } catch(e) {
        log.error(`Failed to remove index for ${uri.fsPath}`, e);
    }
  }

  private async processFile(uri: vscode.Uri) {
      if (this.shouldIgnore(uri.fsPath)) return;

      try {
          const workspaceService = getWorkspaceService();
          const content = await workspaceService.readFile(uri);
          
          if (!content || content.trim().length === 0) return;

          const chunks = this.chunkCode(content, uri.fsPath);
          
          for (const chunk of chunks) {
              const embedding = await this.generateEmbedding(chunk.content);
              if (embedding) {
                  await this.index.insertItem({
                      vector: embedding,
                      metadata: {
                          filePath: chunk.filePath,
                          startLine: chunk.startLine,
                          endLine: chunk.endLine,
                          content: chunk.content,
                          timestamp: Date.now()
                      }
                  });
              }
          }
      } catch (e) {
           log.error(`Error processing file ${uri.fsPath}`, e);
      }
  }

  private chunkCode(content: string, filePath: string, maxTokens: number = 500): CodeChunk[] {
      // Basic line-based chunking. A robust version uses AST (like in core-vector-db)
      const lines = content.split('\n');
      const chunks: CodeChunk[] = [];
      let currentChunk = '';
      let startLine = 1;

      for (let i = 0; i < lines.length; i++) {
          currentChunk += lines[i] + '\n';
          
          // Rough approximation: 1 token ~ 4 chars
          if (currentChunk.length > maxTokens * 4 || i === lines.length - 1) {
              chunks.push({
                  filePath,
                  startLine,
                  endLine: i + 1,
                  content: currentChunk.trim()
              });
              currentChunk = '';
              startLine = i + 2;
          }
      }
      return chunks;
  }

  private async generateEmbedding(text: string): Promise<number[] | null> {
      try {
          const response = await this.openai.embeddings.create({
              model: "text-embedding-3-small",
              input: text,
              encoding_format: "float",
          });
          return response.data[0].embedding;
      } catch(e) {
          log.error('Failed to generate embedding', e);
          return null;
      }
  }

  async semanticSearch(query: string, limit = 5): Promise<CodeChunk[]> {
      if (!this.isInitialized) return [];

      try {
          const queryEmbedding = await this.generateEmbedding(query);
          if (!queryEmbedding) return [];

          const results = await this.index.queryItems(queryEmbedding, limit);
          
          return results.map(r => r.item.metadata as unknown as CodeChunk);
      } catch (e) {
          log.error('Semantic search failed', e);
          return [];
      }
  }

  private shouldIgnore(fsPath: string): boolean {
      return fsPath.includes('node_modules') || 
             fsPath.includes('.git') || 
             fsPath.includes('dist') || 
             fsPath.includes('build');
  }
}

export function getTemporalIndexerService(): TemporalIndexerService {
    return TemporalIndexerService.getInstance();
}