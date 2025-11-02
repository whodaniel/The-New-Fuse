import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

@Injectable()
export class QdrantService {
  private readonly logger = new Logger(QdrantService.name);
  private readonly qdrantClient: QdrantClient;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.qdrantClient = new QdrantClient({
      url: this.configService.get<string>('QDRANT_URL'),
      apiKey: this.configService.get<string>('QDRANT_API_KEY'),
    });
    this.embeddings = new OpenAIEmbeddings({
      openAIApiKey: this.configService.get<string>('OPENAI_API_KEY'),
    });
  }

  async search(collectionName: string, query: string, limit: number = 10) {
    try {
      const queryEmbedding = await this.embeddings.embedQuery(query);
      const searchResult = await this.qdrantClient.search(collectionName, {
        vector: queryEmbedding,
        limit,
      });
      return searchResult;
    } catch (error) {
      this.logger.error('Error searching Qdrant', error);
      throw new Error('Error searching Qdrant');
    }
  }

  async upsert(collectionName: string, points: any[]) {
    try {
      await this.qdrantClient.upsert(collectionName, { points });
    } catch (error) {
      this.logger.error('Error upserting to Qdrant', error);
      throw new Error('Error upserting to Qdrant');
    }
  }
}
