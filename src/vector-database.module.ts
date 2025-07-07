import { Module } from '@nestjs/common';
import { VectorDatabaseService } from './vector-database.service';
import { OpenAIEmbeddingProvider } from './drivers/openai-embedding.provider';

@Module({
  providers: [VectorDatabaseService, OpenAIEmbeddingProvider],
  exports: [VectorDatabaseService],
})
export class VectorDatabaseModule {}
