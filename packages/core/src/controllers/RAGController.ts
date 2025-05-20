import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { RAGService, RAGQueryOptions, RAGQueryResult } from '../rag/RAGService.js';
import { DocumentIngestionService, DocumentSourceType, IngestionOptions } from '../rag/DocumentIngestionService.js';
import { AuthGuard } from '../guards/auth.guard.js';
import { Logger } from '../utils/logger.js';

/**
 * DTO for RAG query
 */
interface RAGQueryDto {
  query: string;
  options?: RAGQueryOptions;
}

/**
 * DTO for document ingestion
 */
interface DocumentIngestionDto {
  source: string;
  type: DocumentSourceType;
  options?: IngestionOptions;
}

/**
 * Controller for RAG API
 */
@Controller('api/rag')
export class RAGController {
  private readonly logger = new Logger(RAGController.name);

  constructor(
    private readonly ragService: RAGService,
    private readonly documentIngestionService: DocumentIngestionService
  ) {}

  /**
   * Query the RAG system
   */
  @Post('query')
  async query(@Body() dto: RAGQueryDto): Promise<RAGQueryResult> {
    this.logger.debug(`RAG query: ${dto.query}`);
    return this.ragService.query(dto.query, dto.options);
  }

  /**
   * Ingest documents
   */
  @Post('ingest')
  @UseGuards(AuthGuard)
  async ingestDocuments(@Body() dto: DocumentIngestionDto): Promise<{ ids: string[] }> {
    this.logger.debug(`Ingesting documents from ${dto.type} source: ${dto.source}`);
    const ids = await this.documentIngestionService.ingestDocuments(
      dto.source,
      dto.type,
      dto.options
    );
    return { ids };
  }

  /**
   * Get RAG status
   */
  @Get('status')
  async getStatus(): Promise<{ status: string; message: string }> {
    return {
      status: 'ok',
      message: 'RAG system is operational'
    };
  }
}
