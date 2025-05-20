import { EventEmitter } from 'events';
import { Logger } from '../logging.js';
import {
  DocumentSource,
  DocumentProcessingPipeline,
  DocumentProcessingResult,
  DocumentChunk,
  ProcessingOptions,
  ContentExtractor,
  ChunkingStrategy
} from './types.js';

export class DocumentProcessor extends EventEmitter {
  private logger: Logger;
  private extractors: Map<string, ContentExtractor> = new Map();
  private chunkingStrategies: Map<string, ChunkingStrategy> = new Map();
  
  constructor(logger: Logger) {
    super();
    this.logger = logger;
  }
  
  /**
   * Register a content extractor
   */
  registerExtractor(extractor: ContentExtractor): void {
    this.extractors.set(extractor.format, extractor);
    this.logger.info(`Registered document extractor for format: ${extractor.format}`);
  }
  
  /**
   * Register a chunking strategy
   */
  registerChunkingStrategy(strategy: ChunkingStrategy): void {
    this.chunkingStrategies.set(strategy.name, strategy);
    this.logger.info(`Registered chunking strategy: ${strategy.name}`);
  }
  
  /**
   * Process a document through the entire pipeline
   */
  async processDocument(
    source: DocumentSource,
    options: ProcessingOptions = {}
  ): Promise<DocumentProcessingResult> {
    const startTime = Date.now();
    this.logger.info(`Processing document: ${source.name || 'unnamed'}`);
    this.emit('processing:start', { source });
    
    try {
      // 1. Extract content from the document
      const content = await this.extractContent(source);
      
      // 2. Split content into chunks
      const chunks = await this.chunkContent(content, options.chunkingStrategy || 'default');
      
      // 3. Apply additional processing steps if specified
      let processedChunks = chunks;
      if (options.pipeline) {
        processedChunks = await this.applyPipeline(chunks, options.pipeline);
      }
      
      const result: DocumentProcessingResult = {
        sourceDocument: source,
        extractedContent: content,
        chunks: processedChunks,
        metadata: {
          chunkCount: processedChunks.length,
          processingTime: Date.now() - startTime,
          strategy: options.chunkingStrategy || 'default'
        }
      };
      
      this.logger.info(`Document processed successfully: ${processedChunks.length} chunks created`);
      this.emit('processing:complete', { result });
      
      return result;
    } catch (error) {
      this.logger.error('Error processing document:', error);
      this.emit('processing:error', { source, error });
      throw error;
    }
  }
  
  /**
   * Extract content from a document based on its format
   */
  private async extractContent(source: DocumentSource): Promise<string> {
    const format = this.detectFormat(source);
    const extractor = this.extractors.get(format);
    
    if (!extractor) {
      throw new Error(`No extractor registered for format: ${format}`);
    }
    
    this.logger.debug(`Extracting content using ${format} extractor`);
    const content = await extractor.extract(source);
    
    return content;
  }
  
  /**
   * Split content into chunks using the specified chunking strategy
   */
  private async chunkContent(content: string, strategyName: string): Promise<DocumentChunk[]> {
    const strategy = this.chunkingStrategies.get(strategyName);
    
    if (!strategy) {
      throw new Error(`Chunking strategy not found: ${strategyName}`);
    }
    
    this.logger.debug(`Chunking content using ${strategyName} strategy`);
    const chunks = await strategy.chunk(content);
    
    return chunks.map((text, index) => ({
      id: `chunk-${index}`,
      content: text,
      index,
      metadata: {
        strategy: strategyName,
        length: text.length
      }
    }));
  }
  
  /**
   * Apply a processing pipeline to document chunks
   */
  private async applyPipeline(
    chunks: DocumentChunk[],
    pipeline: DocumentProcessingPipeline
  ): Promise<DocumentChunk[]> {
    let processedChunks = chunks;
    
    for (const step of pipeline) {
      this.logger.debug(`Applying pipeline step: ${step.name}`);
      processedChunks = await step.process(processedChunks);
    }
    
    return processedChunks;
  }
  
  /**
   * Detect the format of a document
   */
  private detectFormat(source: DocumentSource): string {
    if (source.format) {
      return source.format;
    }
    
    if (source.filename) {
      const extension = source.filename.split('.').pop()?.toLowerCase();
      switch (extension) {
        case 'pdf': return 'pdf';
        case 'docx': return 'docx';
        case 'doc': return 'doc';
        case 'txt': return 'text';
        case 'md': return 'markdown';
        case 'html': return 'html';
        case 'json': return 'json';
        case 'csv': return 'csv';
        default: return 'unknown';
      }
    }
    
    if (source.mimeType) {
      switch (source.mimeType) {
        case 'application/pdf': return 'pdf';
        case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document': return 'docx';
        case 'application/msword': return 'doc';
        case 'text/plain': return 'text';
        case 'text/markdown': return 'markdown';
        case 'text/html': return 'html';
        case 'application/json': return 'json';
        case 'text/csv': return 'csv';
        default: return 'unknown';
      }
    }
    
    return 'unknown';
  }
}
