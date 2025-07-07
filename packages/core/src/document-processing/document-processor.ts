import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '../config/ConfigService';
import { SemanticChunker, Chunk } from './chunkers/semantic-chunker';

export interface DocumentSource {
  type: 'buffer' | 'file' | 'url' | 'text';
  name?: string;
  buffer?: Buffer;
  filePath?: string;
  url?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface ProcessingOptions {
  chunkingStrategy?: ChunkingStrategyType;
  maxChunkSize?: number;
  overlap?: number;
  preserveFormatting?: boolean;
  extractMetadata?: boolean;
  postProcessing?: PostProcessingStep[];
}

export interface ProcessingResult {
  chunks: Chunk[];
  metadata: DocumentMetadata;
  processingTime: number;
  totalChunks: number;
}

export interface DocumentMetadata {
  source: DocumentSource;
  extractedAt: Date;
  contentLength: number;
  language?: string;
  encoding?: string;
  strategy: ChunkingStrategyType;
}

export type ChunkingStrategyType = 'default' | 'semantic' | 'fixed' | 'sentence' | 'paragraph';
export type PostProcessingStep = 'deduplicate' | 'filter_empty' | 'normalize' | 'merge_small';

@Injectable()
export class DocumentProcessor extends EventEmitter2 {
  private readonly logger = new Logger(DocumentProcessor.name);
  private readonly semanticChunker: SemanticChunker;

  constructor(private readonly configService: ConfigService) {
    super();
    this.semanticChunker = new SemanticChunker(this.configService);
  }

  async processDocument(
    source: DocumentSource,
    options: ProcessingOptions = {}
  ): Promise<ProcessingResult> {
    const startTime = Date.now();
    
    try {
      this.logger.debug(`Processing document: ${source.name || 'unnamed'}`);
      
      this.emit('processing:start', { source, options });

      // Extract content from source
      const content = await this.extractContent(source);
      
      // Chunk the content
      const chunks = await this.chunkContent(content, options.chunkingStrategy || 'default');
      
      // Apply post-processing steps
      const processedChunks = await this.postProcess(chunks, options.postProcessing || []);
      
      const processingTime = Date.now() - startTime;
      
      const result: ProcessingResult = {
        chunks: processedChunks,
        metadata: {
          source,
          extractedAt: new Date(),
          contentLength: content.length,
          strategy: options.chunkingStrategy || 'default'
        },
        processingTime,
        totalChunks: processedChunks.length
      };

      this.emit('processing:complete', result);
      this.logger.debug(`Document processed successfully. ${result.totalChunks} chunks created in ${processingTime}ms`);
      
      return result;
    } catch (error) {
      this.logger.error('Error processing document:', error);
      this.emit('processing:error', { source, error });
      throw error;
    }
  }

  private async extractContent(source: DocumentSource): Promise<string> {
    this.logger.debug(`Extracting content from ${source.type || 'unknown'}`);
    
    switch (source.type) {
      case 'text':
        return source.text || '';
        
      case 'buffer':
        return source.buffer?.toString('utf8') || '';
        
      case 'file':
        // This is a placeholder - in practice you'd use fs.readFile
        throw new Error('File extraction not implemented yet');
        
      case 'url':
        // This is a placeholder - in practice you'd fetch the URL
        throw new Error('URL extraction not implemented yet');
        
      default:
        throw new Error(`Unsupported source type: ${source.type}`);
    }
  }

  private async chunkContent(
    content: string,
    strategy: ChunkingStrategyType = 'default'
  ): Promise<Chunk[]> {
    switch (strategy) {
      case 'semantic':
        return await this.semanticChunker.chunk(content);
        
      case 'default':
      case 'fixed':
        return this.fixedSizeChunk(content);
        
      case 'sentence':
        return this.sentenceChunk(content);
        
      case 'paragraph':
        return this.paragraphChunk(content);
        
      default:
        throw new Error(`Unsupported chunking strategy: ${strategy}`);
    }
  }

  private async postProcess(
    chunks: Chunk[],
    steps: PostProcessingStep[]
  ): Promise<Chunk[]> {
    let processedChunks = [...chunks];
    
    for (const step of steps) {
      switch (step) {
        case 'deduplicate':
          processedChunks = this.deduplicate(processedChunks);
          break;
          
        case 'filter_empty':
          processedChunks = this.filterEmpty(processedChunks);
          break;
          
        case 'normalize':
          processedChunks = this.normalize(processedChunks);
          break;
          
        case 'merge_small':
          processedChunks = this.mergeSmallChunks(processedChunks);
          break;
          
        default:
          this.logger.warn(`Unknown post-processing step: ${step}`);
      }
    }
    
    return processedChunks;
  }

  private fixedSizeChunk(content: string, maxSize: number = 1000, overlap: number = 100): Chunk[] {
    const chunks: Chunk[] = [];
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < content.length) {
      const endIndex = Math.min(startIndex + maxSize, content.length);
      const text = content.slice(startIndex, endIndex);
      
      chunks.push({
        id: `chunk_${chunkIndex}`,
        text: text.trim(),
        startIndex,
        endIndex: endIndex - 1,
        metadata: {
          chunkIndex,
          strategy: 'fixed'
        }
      });
      
      startIndex = endIndex - overlap;
      chunkIndex++;
    }

    return chunks;
  }

  private sentenceChunk(content: string): Chunk[] {
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    
    return sentences.map((sentence, index) => ({
      id: `sentence_${index}`,
      text: sentence.trim(),
      startIndex: 0, // Would need proper calculation
      endIndex: sentence.length,
      metadata: {
        chunkIndex: index,
        strategy: 'sentence'
      }
    }));
  }

  private paragraphChunk(content: string): Chunk[] {
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    
    return paragraphs.map((paragraph, index) => ({
      id: `paragraph_${index}`,
      text: paragraph.trim(),
      startIndex: 0, // Would need proper calculation
      endIndex: paragraph.length,
      metadata: {
        chunkIndex: index,
        strategy: 'paragraph'
      }
    }));
  }

  private deduplicate(chunks: Chunk[]): Chunk[] {
    const seen = new Set<string>();
    return chunks.filter(chunk => {
      const hash = this.hashString(chunk.text);
      if (seen.has(hash)) {
        return false;
      }
      seen.add(hash);
      return true;
    });
  }

  private filterEmpty(chunks: Chunk[]): Chunk[] {
    return chunks.filter(chunk => chunk.text.trim().length > 0);
  }

  private normalize(chunks: Chunk[]): Chunk[] {
    return chunks.map(chunk => ({
      ...chunk,
      text: chunk.text.trim().replace(/\s+/g, ' ')
    }));
  }

  private mergeSmallChunks(chunks: Chunk[], minSize: number = 50): Chunk[] {
    const merged: Chunk[] = [];
    let current: Chunk | null = null;

    for (const chunk of chunks) {
      if (!current) {
        current = { ...chunk };
        continue;
      }

      if (current.text.length < minSize) {
        current.text += ' ' + chunk.text;
        current.endIndex = chunk.endIndex;
      } else {
        merged.push(current);
        current = { ...chunk };
      }
    }

    if (current) {
      merged.push(current);
    }

    return merged;
  }

  private hashString(text: string): string {
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      const char = text.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  async getProcessingStats(): Promise<{
    totalProcessed: number;
    averageProcessingTime: number;
    totalChunksCreated: number;
  }> {
    // This would typically be stored in a database or cache
    return {
      totalProcessed: 0,
      averageProcessingTime: 0,
      totalChunksCreated: 0
    };
  }
}