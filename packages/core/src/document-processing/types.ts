export interface DocumentSource {
  // Implementation needed
}
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
  // Implementation needed
}
  id: string;
  content: string;
  index: number;
  startPosition: number;
  endPosition: number;
  tokens?: number;
  metadata?: Record<string, any>;
}

export interface ContentExtractor {
  // Implementation needed
}
  format: string;
  extract(source: DocumentSource) => Promise<string>;
}

export interface ChunkingStrategy {
  // Implementation needed
}
  name: string;
  chunk(content: string) => Promise<string[]>;
}

export interface ProcessingStep {
  // Implementation needed
}
  name: string;
  process(chunks: DocumentChunk[]) => Promise<DocumentChunk[]>;
}

export type DocumentProcessingPipeline = ProcessingStep[];
export interface DocumentProcessingOptions {
  // Implementation needed
}
  chunkingStrategy?: ChunkingStrategyType;
  pipeline?: string[];
  metadata?: Record<string, any>;
}

export interface DocumentProcessingResult {
  // Implementation needed
}
  sourceDocument: DocumentSource;
  extractedContent: string;
  chunks: DocumentChunk[];
  metadata: {
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