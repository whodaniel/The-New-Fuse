export interface DocumentSource {
  name?: string;
  content?: Buffer;
  path?: string;
  url?: string;
  format?: string;
  mimeType?: string;
  filename?: string;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  content: string;
  index: number;
  metadata?: Record<string, any>;
}

export interface ContentExtractor {
  format: string;
  extract: (source: DocumentSource) => Promise<string>;
}

export interface ChunkingStrategy {
  name: string;
  chunk: (content: string) => Promise<string[]>;
}

export interface ProcessingStep {
  name: string;
  process: (chunks: DocumentChunk[]) => Promise<DocumentChunk[]>;
}

export type DocumentProcessingPipeline = ProcessingStep[];

export interface ProcessingOptions {
  chunkingStrategy?: string;
  pipeline?: DocumentProcessingPipeline;
  metadata?: Record<string, any>;
}

export interface DocumentProcessingResult {
  sourceDocument: DocumentSource;
  extractedContent: string;
  chunks: DocumentChunk[];
  metadata: {
    chunkCount: number;
    processingTime: number;
    strategy: string;
    [key: string]: any;
  };
}
