import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { VectorDatabaseService } from './VectorDatabaseService.js';
import { RAGService } from './RAGService.js';
import { DocumentIngestionService } from './DocumentIngestionService.js';

@Module({
  imports: [ConfigModule],
  providers: [
    VectorDatabaseService,
    RAGService,
    DocumentIngestionService
  ],
  exports: [
    VectorDatabaseService,
    RAGService,
    DocumentIngestionService
  ]
})
export class RAGModule {}
