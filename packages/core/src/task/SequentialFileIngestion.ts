import { Task, TaskStatus, CreateTaskDto, TaskResult } from '@the-new-fuse/types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { EventEmitter } from 'events';

export interface FileIngestionItem {
  path: string;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface FileIngestionResult {
  path: string;
  success: boolean;
  content?: string;
  error?: string;
  sizeBytes?: number;
  processingTimeMs?: number;
  chunks?: ContentChunk[];
}

export interface ContentChunk {
  index: number;
  totalChunks: number;
  content: string;
  startOffset: number;
  endOffset: number;
  filePath: string;
}

export interface ChunkingOptions {
  enabled: boolean;
  maxChunkSize: number; // bytes
  overlapSize: number; // bytes of overlap between chunks
  preserveLineBreaks: boolean;
}

export interface IngestionProgress {
  total: number;
  completed: number;
  current: string | null;
  currentChunk?: number;
  totalChunks?: number;
  results: FileIngestionResult[];
}

export interface IngestionOptions {
  chunking?: Partial<ChunkingOptions>;
  delayBetweenFiles?: number; // ms
  maxConcurrent?: number; // for future parallel support
  retryOnError?: boolean;
  maxRetries?: number;
}

export type ProgressCallback = (progress: IngestionProgress) => void;
export type ChunkCallback = (chunk: ContentChunk) => Promise<void> | void;

const DEFAULT_CHUNKING: ChunkingOptions = {
  enabled: false,
  maxChunkSize: 8000, // ~8KB default, good for most LLM contexts
  overlapSize: 200, // 200 byte overlap for context continuity
  preserveLineBreaks: true,
};

const DEFAULT_OPTIONS: IngestionOptions = {
  chunking: DEFAULT_CHUNKING,
  delayBetweenFiles: 10,
  maxConcurrent: 1,
  retryOnError: true,
  maxRetries: 2,
};

/**
 * Sequential File Ingestion Primitive
 *
 * Processes a list of files one at a time to avoid memory overload.
 * Supports chunked delivery for large files.
 * Integrates with task queue for distributed processing.
 *
 * Usage:
 * ```typescript
 * const ingester = new SequentialFileIngestion();
 *
 * // Basic usage
 * const results = await ingester.ingestFiles([
 *   '/path/to/doc1.md',
 *   '/path/to/doc2.md'
 * ]);
 *
 * // With chunked delivery (for large files)
 * await ingester.ingestWithChunks(files, async (chunk) => {
 *   await sendToAI(chunk.content);  // Process each chunk
 * });
 *
 * // Generate tasks for queue integration
 * const tasks = ingester.generateQueueTasks(files);
 * await taskQueue.addBatch(tasks);
 * ```
 */
export class SequentialFileIngestion extends EventEmitter {
  private taskQueue: FileIngestionItem[] = [];
  private results: FileIngestionResult[] = [];
  private isProcessing = false;
  private options: IngestionOptions;

  constructor(options: Partial<IngestionOptions> = {}) {
    super();
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  /**
   * Parse a list of file paths from various input formats
   */
  parseFileList(input: string | string[] | FileIngestionItem[]): FileIngestionItem[] {
    if (Array.isArray(input)) {
      return input.map((item, index) => {
        if (typeof item === 'string') {
          return { path: item.trim(), priority: index };
        }
        return { ...item, priority: item.priority ?? index };
      });
    }

    // Parse string input (newline or comma separated)
    const lines = input
      .split(/[\n,]/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && !line.startsWith('#'));

    return lines.map((line, index) => ({ path: line, priority: index }));
  }

  /**
   * Generate task definitions from file list
   */
  generateTaskList(files: FileIngestionItem[]): CreateTaskDto[] {
    return files.map((file, index) => ({
      title: `Ingest: ${path.basename(file.path)}`,
      description: `Read and process file: ${file.path}`,
      priority: file.priority ?? index,
      type: 'ANALYSIS' as const,
      metadata: {
        filePath: file.path,
        sequence: index,
        totalFiles: files.length,
        ...file.metadata,
      },
    }));
  }

  /**
   * Process a single file
   */
  private async processFile(file: FileIngestionItem): Promise<FileIngestionResult> {
    const startTime = Date.now();

    try {
      const absolutePath = path.isAbsolute(file.path)
        ? file.path
        : path.resolve(process.cwd(), file.path);

      const stats = await fs.stat(absolutePath);
      const content = await fs.readFile(absolutePath, 'utf-8');

      return {
        path: file.path,
        success: true,
        content,
        sizeBytes: stats.size,
        processingTimeMs: Date.now() - startTime,
      };
    } catch (error) {
      return {
        path: file.path,
        success: false,
        error: error instanceof Error ? error.message : String(error),
        processingTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Ingest files sequentially with progress callback
   */
  async ingestFiles(
    input: string | string[] | FileIngestionItem[],
    onProgress?: ProgressCallback,
  ): Promise<FileIngestionResult[]> {
    if (this.isProcessing) {
      throw new Error('Ingestion already in progress');
    }

    this.isProcessing = true;
    this.results = [];
    this.taskQueue = this.parseFileList(input);

    const total = this.taskQueue.length;

    try {
      for (let i = 0; i < this.taskQueue.length; i++) {
        const file = this.taskQueue[i];

        // Report progress before processing
        onProgress?.({
          total,
          completed: i,
          current: file.path,
          results: [...this.results],
        });

        // Process file
        const result = await this.processFile(file);
        this.results.push(result);

        // Small delay to allow garbage collection between files
        if (i < this.taskQueue.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }
      }

      // Final progress report
      onProgress?.({
        total,
        completed: total,
        current: null,
        results: [...this.results],
      });

      return this.results;
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Ingest files from a list file (one path per line)
   */
  async ingestFromListFile(
    listFilePath: string,
    onProgress?: ProgressCallback,
  ): Promise<FileIngestionResult[]> {
    const listContent = await fs.readFile(listFilePath, 'utf-8');
    return this.ingestFiles(listContent, onProgress);
  }

  /**
   * Create a reusable ingestion task from a dropped list
   * Returns the task definitions without executing
   */
  createIngestionPlan(input: string | string[] | FileIngestionItem[]): {
    files: FileIngestionItem[];
    tasks: CreateTaskDto[];
    estimatedCount: number;
  } {
    const files = this.parseFileList(input);
    const tasks = this.generateTaskList(files);

    return {
      files,
      tasks,
      estimatedCount: files.length,
    };
  }

  /**
   * Stream results as they complete (for large file lists)
   */
  async *ingestFilesStream(
    input: string | string[] | FileIngestionItem[],
  ): AsyncGenerator<FileIngestionResult, void, unknown> {
    const files = this.parseFileList(input);

    for (const file of files) {
      yield await this.processFile(file);
      await new Promise((resolve) => setTimeout(resolve, this.options.delayBetweenFiles || 10));
    }
  }

  /**
   * Split content into chunks with optional overlap
   */
  private chunkContent(content: string, filePath: string): ContentChunk[] {
    const opts = { ...DEFAULT_CHUNKING, ...this.options.chunking };

    if (!opts.enabled || content.length <= opts.maxChunkSize) {
      return [
        {
          index: 0,
          totalChunks: 1,
          content,
          startOffset: 0,
          endOffset: content.length,
          filePath,
        },
      ];
    }

    const chunks: ContentChunk[] = [];
    let offset = 0;
    let chunkIndex = 0;

    while (offset < content.length) {
      let endOffset = Math.min(offset + opts.maxChunkSize, content.length);

      // Preserve line breaks if enabled
      if (opts.preserveLineBreaks && endOffset < content.length) {
        const lastNewline = content.lastIndexOf('\n', endOffset);
        if (lastNewline > offset) {
          endOffset = lastNewline + 1;
        }
      }

      chunks.push({
        index: chunkIndex,
        totalChunks: 0, // Will be updated after
        content: content.slice(offset, endOffset),
        startOffset: offset,
        endOffset,
        filePath,
      });

      // Move offset, accounting for overlap
      offset = endOffset - opts.overlapSize;
      if (offset <= chunks[chunks.length - 1].startOffset) {
        offset = endOffset; // Prevent infinite loop
      }
      chunkIndex++;
    }

    // Update total chunks count
    chunks.forEach((chunk) => (chunk.totalChunks = chunks.length));

    return chunks;
  }

  /**
   * Ingest files with chunked delivery - processes each chunk via callback
   * Ideal for streaming to AI systems with context limits
   */
  async ingestWithChunks(
    input: string | string[] | FileIngestionItem[],
    onChunk: ChunkCallback,
    onProgress?: ProgressCallback,
  ): Promise<FileIngestionResult[]> {
    if (this.isProcessing) {
      throw new Error('Ingestion already in progress');
    }

    // Enable chunking for this operation
    const originalChunking = this.options.chunking;
    this.options.chunking = { ...DEFAULT_CHUNKING, ...originalChunking, enabled: true };

    this.isProcessing = true;
    this.results = [];
    this.taskQueue = this.parseFileList(input);

    const total = this.taskQueue.length;

    try {
      for (let i = 0; i < this.taskQueue.length; i++) {
        const file = this.taskQueue[i];
        const result = await this.processFile(file);

        if (result.success && result.content) {
          const chunks = this.chunkContent(result.content, file.path);
          result.chunks = chunks;

          // Deliver each chunk
          for (let c = 0; c < chunks.length; c++) {
            onProgress?.({
              total,
              completed: i,
              current: file.path,
              currentChunk: c + 1,
              totalChunks: chunks.length,
              results: [...this.results],
            });

            this.emit('chunk', chunks[c]);
            await onChunk(chunks[c]);

            // Small delay between chunks
            if (c < chunks.length - 1) {
              await new Promise((resolve) => setTimeout(resolve, 5));
            }
          }

          // Clear content from result to free memory
          delete result.content;
        }

        this.results.push(result);
        this.emit('file:complete', result);

        if (i < this.taskQueue.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, this.options.delayBetweenFiles || 10));
        }
      }

      onProgress?.({
        total,
        completed: total,
        current: null,
        results: [...this.results],
      });

      this.emit('complete', this.results);
      return this.results;
    } finally {
      this.isProcessing = false;
      this.options.chunking = originalChunking;
    }
  }

  /**
   * Generate task queue compatible task objects
   * For integration with Bull/Redis task queues
   */
  generateQueueTasks(input: string | string[] | FileIngestionItem[]): Array<{
    type: string;
    data: FileIngestionItem;
    priority: number;
    options: { attempts: number; timeout: number };
  }> {
    const files = this.parseFileList(input);

    return files.map((file, index) => ({
      type: 'FILE_INGESTION',
      data: file,
      priority: file.priority ?? index,
      options: {
        attempts: this.options.maxRetries || 2,
        timeout: 30000,
      },
    }));
  }

  /**
   * Process a single task from queue (for queue worker integration)
   */
  async processQueueTask(task: { data: FileIngestionItem }): Promise<FileIngestionResult> {
    return this.processFile(task.data);
  }

  /**
   * Create a processing pipeline that can be paused/resumed
   */
  createPipeline(input: string | string[] | FileIngestionItem[]): IngestionPipeline {
    return new IngestionPipeline(this.parseFileList(input), this.options);
  }
}

/**
 * Pausable/Resumable ingestion pipeline
 */
export class IngestionPipeline extends EventEmitter {
  private files: FileIngestionItem[];
  private options: IngestionOptions;
  private currentIndex = 0;
  private isPaused = false;
  private isRunning = false;
  private results: FileIngestionResult[] = [];

  constructor(files: FileIngestionItem[], options: IngestionOptions) {
    super();
    this.files = files;
    this.options = options;
  }

  get progress(): IngestionProgress {
    return {
      total: this.files.length,
      completed: this.currentIndex,
      current: this.currentIndex < this.files.length ? this.files[this.currentIndex].path : null,
      results: [...this.results],
    };
  }

  async start(): Promise<FileIngestionResult[]> {
    if (this.isRunning) return this.results;
    this.isRunning = true;
    this.isPaused = false;

    while (this.currentIndex < this.files.length && !this.isPaused) {
      const file = this.files[this.currentIndex];

      this.emit('processing', file.path);

      try {
        const absolutePath = path.isAbsolute(file.path)
          ? file.path
          : path.resolve(process.cwd(), file.path);

        const stats = await fs.stat(absolutePath);
        const content = await fs.readFile(absolutePath, 'utf-8');

        const result: FileIngestionResult = {
          path: file.path,
          success: true,
          content,
          sizeBytes: stats.size,
        };

        this.results.push(result);
        this.emit('file:complete', result);
      } catch (error) {
        const result: FileIngestionResult = {
          path: file.path,
          success: false,
          error: error instanceof Error ? error.message : String(error),
        };
        this.results.push(result);
        this.emit('file:error', result);
      }

      this.currentIndex++;
      this.emit('progress', this.progress);

      if (this.currentIndex < this.files.length && !this.isPaused) {
        await new Promise((resolve) => setTimeout(resolve, this.options.delayBetweenFiles || 10));
      }
    }

    this.isRunning = false;
    if (!this.isPaused) {
      this.emit('complete', this.results);
    }

    return this.results;
  }

  pause(): void {
    this.isPaused = true;
    this.emit('paused', this.progress);
  }

  resume(): Promise<FileIngestionResult[]> {
    this.isPaused = false;
    return this.start();
  }

  reset(): void {
    this.currentIndex = 0;
    this.results = [];
    this.isPaused = false;
    this.isRunning = false;
  }
}

// Export singleton for convenience
export const fileIngestion = new SequentialFileIngestion();

// Export helper function for quick use
export async function ingestFileList(
  files: string[],
  onProgress?: ProgressCallback,
): Promise<FileIngestionResult[]> {
  return fileIngestion.ingestFiles(files, onProgress);
}
