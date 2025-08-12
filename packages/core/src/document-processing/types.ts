export interface DocumentSource {
  name?: string;
  content?: string;
  buffer?: Buffer;
  filePath?: string;
  url?: string;
  type?: DocumentType;
  mimeType?: string;
  metadata?: Record<string, any>;
}

export interface DocumentChunk {
  id: string;
  content: string;
  index: number;
  startPosition: number;
  endPosition: number;
  tokens?: number;
  metadata?: Record<string, any>;
}

export interface ContentExtractor {
  format: string;
  extract(source: DocumentSource) => Promise<string>;
}

export interface ChunkingStrategy {
  name: string;
  chunk(content: string) => Promise<string[]>;
}

export interface ProcessingStep {
  name: string;
  process(chunks: DocumentChunk[]) => Promise<DocumentChunk[]>;
}

export type DocumentProcessingPipeline = ProcessingStep[];
export interface DocumentProcessingOptions {
  chunkingStrategy?: ChunkingStrategyType;
  pipeline?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentProcessingResult {
  sourceDocument: DocumentSource;
  extractedContent: string;
  chunks: DocumentChunk[];
  metadata: unknown;
  // Implementation needed
}
    chunkCount: number;
    processingTime: number;
    strategy: string;
    [key: string]: any;
  };
}

export type DocumentType = 
  | 'pdf'
  | 'docx'
  | 'doc'
  | 'text'
  | 'markdown'
  | 'html'
  | 'json'
  | 'csv'
  | 'unknown'
  | 'default'
  | 'simple'
  | 'semantic'
  | 'paragraph'
  | 'sentence'