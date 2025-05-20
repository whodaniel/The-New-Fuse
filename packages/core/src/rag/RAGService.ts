import { Injectable } from '@nestjs/common';
import { Logger } from '../utils/logger.js';
import { ConfigService } from '@nestjs/config';
import { VectorDatabaseService, VectorDocument, SearchOptions } from './VectorDatabaseService.js';

/**
 * Document chunk for RAG
 */
export interface DocumentChunk {
  id?: string;
  content: string;
  metadata: {
    source: string;
    title?: string;
    section?: string;
    page?: number;
    url?: string;
    author?: string;
    createdAt?: Date;
    updatedAt?: Date;
    [key: string]: any;
  };
}

/**
 * RAG query options
 */
export interface RAGQueryOptions {
  filter?: Record<string, any>;
  limit?: number;
  minScore?: number;
  includeMetadata?: boolean;
  includeContent?: boolean;
}

/**
 * RAG query result
 */
export interface RAGQueryResult {
  answer: string;
  sources: Array<{
    content: string;
    metadata: Record<string, any>;
    score: number;
  }>;
}

/**
 * Retrieval Augmented Generation service
 */
@Injectable()
export class RAGService {
  private readonly logger = new Logger(RAGService.name);
  private readonly llmProvider: string;
  private readonly llmModel: string;
  private readonly systemPrompt: string;

  constructor(
    private configService: ConfigService,
    private vectorDatabaseService: VectorDatabaseService
  ) {
    this.llmProvider = this.configService.get<string>('LLM_PROVIDER', 'openai');
    this.llmModel = this.configService.get<string>('LLM_MODEL', 'gpt-4');
    this.systemPrompt = this.configService.get<string>(
      'RAG_SYSTEM_PROMPT',
      'You are a helpful assistant for The New Fuse platform. Use the provided context to answer the user\'s question. If you don\'t know the answer, say so.'
    );
  }

  /**
   * Index documents for RAG
   * @param documents Documents to index
   * @returns IDs of indexed documents
   */
  async indexDocuments(documents: DocumentChunk[]): Promise<string[]> {
    try {
      this.logger.debug(`Indexing ${documents.length} documents`);
      
      // Convert to vector documents
      const vectorDocuments: VectorDocument[] = documents.map(doc => ({
        id: doc.id,
        content: doc.content,
        metadata: doc.metadata
      }));
      
      // Store in vector database
      return await this.vectorDatabaseService.storeDocuments(vectorDocuments);
    } catch (error) {
      this.logger.error(`Failed to index documents: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Query the RAG system
   * @param query User query
   * @param options Query options
   * @returns RAG query result
   */
  async query(query: string, options: RAGQueryOptions = {}): Promise<RAGQueryResult> {
    try {
      this.logger.debug(`RAG query: ${query}`);
      
      // Search for relevant documents
      const searchOptions: SearchOptions = {
        filter: options.filter,
        limit: options.limit || 5,
        minScore: options.minScore || 0.7,
        includeMetadata: options.includeMetadata !== false,
        includeContent: options.includeContent !== false
      };
      
      const searchResults = await this.vectorDatabaseService.search(query, searchOptions);
      
      this.logger.debug(`Found ${searchResults.length} relevant documents`);
      
      if (searchResults.length === 0) {
        return {
          answer: "I don't have enough information to answer that question. Please try asking something else about The New Fuse platform.",
          sources: []
        };
      }
      
      // Format context from search results
      const context = searchResults
        .map(result => {
          const source = result.metadata?.source || 'Unknown';
          return `[Source: ${source}]\n${result.content}`;
        })
        .join('\n\n');
      
      // Generate answer using LLM
      const answer = await this.generateAnswer(query, context);
      
      // Format sources
      const sources = searchResults.map(result => ({
        content: result.content,
        metadata: result.metadata,
        score: result.score
      }));
      
      return {
        answer,
        sources
      };
    } catch (error) {
      this.logger.error(`Failed to query RAG: ${error.message}`, error.stack);
      
      return {
        answer: "I'm sorry, I encountered an error while trying to answer your question. Please try again later.",
        sources: []
      };
    }
  }

  /**
   * Generate answer using LLM
   * @param query User query
   * @param context Context from retrieved documents
   * @returns Generated answer
   */
  private async generateAnswer(query: string, context: string): Promise<string> {
    try {
      switch (this.llmProvider) {
        case 'openai':
          return this.generateOpenAIAnswer(query, context);
        case 'anthropic':
          return this.generateAnthropicAnswer(query, context);
        default:
          throw new Error(`Unsupported LLM provider: ${this.llmProvider}`);
      }
    } catch (error) {
      this.logger.error(`Failed to generate answer: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate answer using OpenAI
   */
  private async generateOpenAIAnswer(query: string, context: string): Promise<string> {
    try {
      const { OpenAI } = await import('openai');
      
      const openai = new OpenAI({
        apiKey: this.configService.get<string>('OPENAI_API_KEY')
      });
      
      const response = await openai.chat.completions.create({
        model: this.llmModel,
        messages: [
          { role: 'system', content: this.systemPrompt },
          { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      return response.choices[0].message.content;
    } catch (error) {
      this.logger.error(`OpenAI error: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Generate answer using Anthropic
   */
  private async generateAnthropicAnswer(query: string, context: string): Promise<string> {
    try {
      const { Anthropic } = await import('@anthropic-ai/sdk');
      
      const anthropic = new Anthropic({
        apiKey: this.configService.get<string>('ANTHROPIC_API_KEY')
      });
      
      const response = await anthropic.messages.create({
        model: this.llmModel,
        system: this.systemPrompt,
        messages: [
          { role: 'user', content: `Context:\n${context}\n\nQuestion: ${query}` }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });
      
      return response.content[0].text;
    } catch (error) {
      this.logger.error(`Anthropic error: ${error.message}`, error.stack);
      throw error;
    }
  }
}
