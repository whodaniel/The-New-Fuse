import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '../../config/ConfigService';

export interface Chunk {
  id: string;
  text: string;
  startIndex: number;
  endIndex: number;
  metadata?: Record<string, any>;
}

export interface SemanticChunkerConfig {
  maxChunkSize?: number;
  overlap?: number;
  provider?: 'openai' | 'anthropic' | 'local';
  similarityThreshold?: number;
  minChunkSize?: number;
}

export interface SentenceEmbedding {
  sentence: string;
  embedding: number[];
  index: number;
}

@Injectable()
export class SemanticChunker {
  private readonly logger = new Logger(SemanticChunker.name);
  private readonly config: Required<SemanticChunkerConfig>;

  constructor(private readonly configService?: ConfigService) {
    this.config = {
      maxChunkSize: this.configService?.get<number>('chunking.maxChunkSize', 1000) || 1000,
      overlap: this.configService?.get<number>('chunking.overlap', 100) || 100,
      provider: this.configService?.get<'openai' | 'anthropic' | 'local'>('chunking.provider', 'local') || 'local',
      similarityThreshold: this.configService?.get<number>('chunking.similarityThreshold', 0.7) || 0.7,
      minChunkSize: this.configService?.get<number>('chunking.minChunkSize', 100) || 100
    };
  }

  async chunk(text: string): Promise<Chunk[]> {
    try {
      // Split text into sentences
      const sentences = this.splitIntoSentences(text);
      
      if (sentences.length === 0) {
        return [];
      }

      // For semantic chunking, we would typically:
      // 1. Generate embeddings for each sentence
      // 2. Calculate semantic similarity between adjacent sentences
      // 3. Group sentences based on semantic similarity
      
      // For now, we'll use a simplified approach with paragraph-based chunking
      return await this.simpleSemanticChunk(sentences);
    } catch (error) {
      this.logger.error('Error in semantic chunking:', error);
      // Fallback to simple chunking
      return this.fallbackChunk(text);
    }
  }

  private splitIntoSentences(text: string): string[] {
    // Improved sentence splitting that handles abbreviations better
    const sentences = text
      .replace(/([.!?])\s*(?=[A-Z])/g, '$1|')
      .split('|')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    return sentences;
  }

  private async simpleSemanticChunk(sentences: string[]): Promise<Chunk[]> {
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkStartIndex = 0;
    let chunkIndex = 0;
    let globalIndex = 0;

    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      const potentialChunk = currentChunk + (currentChunk ? ' ' : '') + sentence;

      if (potentialChunk.length > this.config.maxChunkSize && currentChunk) {
        // Create chunk from current content
        chunks.push({
          id: `semantic_chunk_${chunkIndex}`,
          text: currentChunk.trim(),
          startIndex: chunkStartIndex,
          endIndex: globalIndex - 1,
          metadata: {
            chunkIndex,
            strategy: 'semantic',
            sentenceCount: currentChunk.split(/[.!?]+/).length - 1
          }
        });

        // Start new chunk with overlap
        currentChunk = sentence;
        chunkStartIndex = globalIndex;
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
        if (!currentChunk || currentChunk === sentence) {
          chunkStartIndex = globalIndex;
        }
      }

      globalIndex += sentence.length + 1; // +1 for space
    }

    // Add the last chunk if it has content
    if (currentChunk.trim()) {
      chunks.push({
        id: `semantic_chunk_${chunkIndex}`,
        text: currentChunk.trim(),
        startIndex: chunkStartIndex,
        endIndex: globalIndex - 1,
        metadata: {
          chunkIndex,
          strategy: 'semantic',
          sentenceCount: currentChunk.split(/[.!?]+/).length - 1
        }
      });
    }

    return chunks;
  }

  private fallbackChunk(text: string): Chunk[] {
    // Simple fallback chunking when semantic analysis fails
    const chunks: Chunk[] = [];
    const maxSize = this.config.maxChunkSize;
    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + maxSize, text.length);
      const chunkText = text.slice(startIndex, endIndex);

      chunks.push({
        id: `fallback_chunk_${chunkIndex}`,
        text: chunkText.trim(),
        startIndex,
        endIndex: endIndex - 1,
        metadata: {
          chunkIndex,
          strategy: 'fallback',
          isFallback: true
        }
      });

      startIndex = endIndex - this.config.overlap;
      chunkIndex++;
    }

    return chunks;
  }

  async chunkByParagraphs(text: string): Promise<Chunk[]> {
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    const chunks: Chunk[] = [];
    let currentChunk = '';
    let chunkIndex = 0;
    let globalIndex = 0;
    let chunkStartIndex = 0;

    for (const paragraph of paragraphs) {
      const potentialChunk = currentChunk + (currentChunk ? '\n\n' : '') + paragraph;

      if (potentialChunk.length > this.config.maxChunkSize && currentChunk) {
        // Create chunk from current content
        chunks.push({
          id: `paragraph_chunk_${chunkIndex}`,
          text: currentChunk.trim(),
          startIndex: chunkStartIndex,
          endIndex: globalIndex - 1,
          metadata: {
            chunkIndex,
            strategy: 'paragraph',
            paragraphCount: currentChunk.split(/\n\s*\n/).length
          }
        });

        // Start new chunk
        currentChunk = paragraph;
        chunkStartIndex = globalIndex;
        chunkIndex++;
      } else {
        currentChunk = potentialChunk;
        if (!currentChunk || currentChunk === paragraph) {
          chunkStartIndex = globalIndex;
        }
      }

      globalIndex += paragraph.length + 2; // +2 for double newline
    }

    // Add the last chunk
    if (currentChunk.trim()) {
      chunks.push({
        id: `paragraph_chunk_${chunkIndex}`,
        text: currentChunk.trim(),
        startIndex: chunkStartIndex,
        endIndex: globalIndex - 1,
        metadata: {
          chunkIndex,
          strategy: 'paragraph',
          paragraphCount: currentChunk.split(/\n\s*\n/).length
        }
      });
    }

    return chunks;
  }

  private calculateSimilarity(text1: string, text2: string): number {
    // Simple word-based similarity calculation
    // In a real implementation, you'd use proper embeddings
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set(Array.from(words1).filter(x => words2.has(x)));
    const union = new Set([...Array.from(words1), ...Array.from(words2)]);
    
    return intersection.size / union.size;
  }

  async mergeSmallChunks(chunks: Chunk[]): Promise<Chunk[]> {
    const merged: Chunk[] = [];
    let currentChunk: Chunk | null = null;

    for (const chunk of chunks) {
      if (!currentChunk) {
        currentChunk = { ...chunk };
        continue;
      }

      if (currentChunk.text.length < this.config.minChunkSize) {
        // Merge with next chunk
        const combinedContent = currentChunk.text + ' ' + chunk.text;
        currentChunk = {
          ...currentChunk,
          text: combinedContent,
          endIndex: chunk.endIndex,
          metadata: {
            ...currentChunk.metadata,
            merged: true,
            originalChunks: [currentChunk.id, chunk.id]
          }
        };
      } else {
        merged.push(currentChunk);
        currentChunk = { ...chunk };
      }
    }

    if (currentChunk) {
      merged.push(currentChunk);
    }

    return merged;
  }

  async optimizeChunks(chunks: Chunk[]): Promise<Chunk[]> {
    // Apply various optimization strategies
    let optimizedChunks = [...chunks];

    // Remove empty chunks
    optimizedChunks = optimizedChunks.filter(chunk => chunk.text.trim().length > 0);

    // Merge small chunks
    optimizedChunks = await this.mergeSmallChunks(optimizedChunks);

    // Update chunk IDs to be sequential
    optimizedChunks = optimizedChunks.map((chunk, index) => ({
      ...chunk,
      id: `optimized_chunk_${index}`,
      metadata: {
        ...chunk.metadata,
        optimized: true,
        finalIndex: index
      }
    }));

    return optimizedChunks;
  }

  getChunkingStats(chunks: Chunk[]): {
    totalChunks: number;
    averageChunkSize: number;
    minChunkSize: number;
    maxChunkSize: number;
    totalCharacters: number;
  } {
    if (chunks.length === 0) {
      return {
        totalChunks: 0,
        averageChunkSize: 0,
        minChunkSize: 0,
        maxChunkSize: 0,
        totalCharacters: 0
      };
    }

    const sizes = chunks.map(chunk => chunk.text.length);
    const totalCharacters = sizes.reduce((sum, size) => sum + size, 0);

    return {
      totalChunks: chunks.length,
      averageChunkSize: Math.round(totalCharacters / chunks.length),
      minChunkSize: Math.min(...sizes),
      maxChunkSize: Math.max(...sizes),
      totalCharacters
    };
  }
}