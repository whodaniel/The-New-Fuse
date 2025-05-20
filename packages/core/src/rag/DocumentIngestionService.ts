import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { ConfigService } from '@nestjs/config';
import { RAGService, DocumentChunk } from './RAGService.js';
import * as fs from 'fs';
import * as path from 'path';
import * as matter from 'gray-matter';

/**
 * Document source types
 */
export enum DocumentSourceType {
  FILE = 'file',
  DIRECTORY = 'directory',
  URL = 'url',
  TEXT = 'text',
  API = 'api'
}

/**
 * Document ingestion options
 */
export interface IngestionOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  recursive?: boolean;
  fileExtensions?: string[];
  metadata?: Record<string, any>;
}

/**
 * Document ingestion service for RAG
 */
@Injectable()
export class DocumentIngestionService {
  private readonly logger = new Logger(DocumentIngestionService.name);
  private readonly defaultChunkSize: number;
  private readonly defaultChunkOverlap: number;
  private readonly defaultFileExtensions: string[];

  constructor(
    private configService: ConfigService,
    private ragService: RAGService
  ) {
    this.defaultChunkSize = this.configService.get<number>('RAG_CHUNK_SIZE', 1000);
    this.defaultChunkOverlap = this.configService.get<number>('RAG_CHUNK_OVERLAP', 200);
    this.defaultFileExtensions = this.configService.get<string>('RAG_FILE_EXTENSIONS', '.md,.txt,.html,.json,.yaml,.yml').split(',');
  }

  /**
   * Ingest documents from various sources
   * @param source Source of documents
   * @param type Type of source
   * @param options Ingestion options
   * @returns IDs of ingested documents
   */
  async ingestDocuments(
    source: string,
    type: DocumentSourceType,
    options: IngestionOptions = {}
  ): Promise<string[]> {
    try {
      this.logger.debug(`Ingesting documents from ${type} source: ${source}`);
      
      const {
        chunkSize = this.defaultChunkSize,
        chunkOverlap = this.defaultChunkOverlap,
        recursive = true,
        fileExtensions = this.defaultFileExtensions,
        metadata = {}
      } = options;
      
      // Get documents based on source type
      let documents: DocumentChunk[] = [];
      
      switch (type) {
        case DocumentSourceType.FILE:
          documents = await this.processFile(source, { ...metadata });
          break;
        case DocumentSourceType.DIRECTORY:
          documents = await this.processDirectory(source, { recursive, fileExtensions, metadata });
          break;
        case DocumentSourceType.URL:
          documents = await this.processUrl(source, { ...metadata });
          break;
        case DocumentSourceType.TEXT:
          documents = this.processText(source, { ...metadata });
          break;
        case DocumentSourceType.API:
          documents = await this.processApi(source, { ...metadata });
          break;
        default:
          throw new Error(`Unsupported document source type: ${type}`);
      }
      
      // Chunk documents
      const chunkedDocuments = this.chunkDocuments(documents, chunkSize, chunkOverlap);
      
      this.logger.debug(`Created ${chunkedDocuments.length} chunks from ${documents.length} documents`);
      
      // Index documents
      return await this.ragService.indexDocuments(chunkedDocuments);
    } catch (error) {
      this.logger.error(`Failed to ingest documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a single file
   */
  private async processFile(filePath: string, metadata: Record<string, any>): Promise<DocumentChunk[]> {
    try {
      if (!fs.existsSync(filePath)) {
        throw new Error(`File not found: ${filePath}`);
      }
      
      const content = await fs.promises.readFile(filePath, 'utf-8');
      const extension = path.extname(filePath).toLowerCase();
      
      // Parse content based on file type
      let parsedContent = content;
      let frontmatter = {};
      
      if (extension === '.md') {
        // Parse markdown frontmatter
        const { content: mdContent, data } = matter(content);
        parsedContent = mdContent;
        frontmatter = data;
      }
      
      return [{
        content: parsedContent,
        metadata: {
          source: filePath,
          title: path.basename(filePath),
          extension,
          ...frontmatter,
          ...metadata
        }
      }];
    } catch (error) {
      this.logger.error(`Failed to process file ${filePath}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a directory of files
   */
  private async processDirectory(
    dirPath: string,
    options: { recursive: boolean; fileExtensions: string[]; metadata: Record<string, any> }
  ): Promise<DocumentChunk[]> {
    try {
      if (!fs.existsSync(dirPath)) {
        throw new Error(`Directory not found: ${dirPath}`);
      }
      
      const { recursive, fileExtensions, metadata } = options;
      const documents: DocumentChunk[] = [];
      
      // Read directory contents
      const entries = await fs.promises.readdir(dirPath, { withFileTypes: true });
      
      for (const entry of entries) {
        const entryPath = path.join(dirPath, entry.name);
        
        if (entry.isDirectory() && recursive) {
          // Recursively process subdirectories
          const subdirDocs = await this.processDirectory(entryPath, options);
          documents.push(...subdirDocs);
        } else if (entry.isFile()) {
          // Check file extension
          const extension = path.extname(entry.name).toLowerCase();
          if (fileExtensions.includes(extension)) {
            const fileDocs = await this.processFile(entryPath, metadata);
            documents.push(...fileDocs);
          }
        }
      }
      
      return documents;
    } catch (error) {
      this.logger.error(`Failed to process directory ${dirPath}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process a URL
   */
  private async processUrl(url: string, metadata: Record<string, any>): Promise<DocumentChunk[]> {
    try {
      // Fetch content from URL
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${url}, status: ${response.status}`);
      }
      
      const content = await response.text();
      
      // Extract title from HTML if possible
      let title = url;
      if (content.includes('<title>')) {
        const titleMatch = content.match(/<title>(.*?)<\/title>/i);
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim();
        }
      }
      
      return [{
        content: this.extractTextFromHtml(content),
        metadata: {
          source: url,
          title,
          url,
          ...metadata
        }
      }];
    } catch (error) {
      this.logger.error(`Failed to process URL ${url}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Process raw text
   */
  private processText(text: string, metadata: Record<string, any>): DocumentChunk[] {
    return [{
      content: text,
      metadata: {
        source: 'text',
        ...metadata
      }
    }];
  }

  /**
   * Process API source
   */
  private async processApi(apiEndpoint: string, metadata: Record<string, any>): Promise<DocumentChunk[]> {
    try {
      // Fetch content from API
      const response = await fetch(apiEndpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch API: ${apiEndpoint}, status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Process API response based on structure
      // This is a simplified implementation that assumes the API returns an array of documents
      if (Array.isArray(data)) {
        return data.map(item => ({
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item),
          metadata: {
            source: apiEndpoint,
            ...item.metadata,
            ...metadata
          }
        }));
      } else if (data.documents && Array.isArray(data.documents)) {
        return data.documents.map(item => ({
          content: typeof item.content === 'string' ? item.content : JSON.stringify(item),
          metadata: {
            source: apiEndpoint,
            ...item.metadata,
            ...metadata
          }
        }));
      } else {
        // Treat the entire response as a single document
        return [{
          content: JSON.stringify(data),
          metadata: {
            source: apiEndpoint,
            ...metadata
          }
        }];
      }
    } catch (error) {
      this.logger.error(`Failed to process API ${apiEndpoint}: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Extract text from HTML
   */
  private extractTextFromHtml(html: string): string {
    // Simple HTML to text conversion
    // In a real implementation, you would use a proper HTML parser
    return html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Chunk documents into smaller pieces
   */
  private chunkDocuments(
    documents: DocumentChunk[],
    chunkSize: number,
    chunkOverlap: number
  ): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    for (const doc of documents) {
      // Skip empty documents
      if (!doc.content.trim()) {
        continue;
      }
      
      // If document is smaller than chunk size, keep it as is
      if (doc.content.length <= chunkSize) {
        chunks.push(doc);
        continue;
      }
      
      // Split document into paragraphs
      const paragraphs = doc.content.split(/\n\s*\n/);
      let currentChunk = '';
      
      for (const paragraph of paragraphs) {
        // If adding this paragraph would exceed chunk size, create a new chunk
        if (currentChunk.length + paragraph.length > chunkSize) {
          if (currentChunk) {
            chunks.push({
              content: currentChunk.trim(),
              metadata: { ...doc.metadata }
            });
          }
          
          // Start new chunk with overlap from previous chunk
          if (currentChunk.length > chunkOverlap) {
            const overlapStart = currentChunk.length - chunkOverlap;
            currentChunk = currentChunk.substring(overlapStart) + '\n\n';
          } else {
            currentChunk = '';
          }
        }
        
        // Add paragraph to current chunk
        currentChunk += paragraph + '\n\n';
      }
      
      // Add final chunk if not empty
      if (currentChunk.trim()) {
        chunks.push({
          content: currentChunk.trim(),
          metadata: { ...doc.metadata }
        });
      }
    }
    
    return chunks;
  }
}
