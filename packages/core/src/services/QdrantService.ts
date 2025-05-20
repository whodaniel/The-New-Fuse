import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { QdrantClient } from '@qdrant/js-client-rest';
import { QdrantConfigType } from '../config/qdrant_config.js';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';

@Injectable()
export class QdrantService {
  private readonly client: QdrantClient;
  private readonly config: QdrantConfigType;
  private readonly embeddings: OpenAIEmbeddings;

  constructor(private readonly configService: ConfigService) {
    this.config = this.configService.get('qdrant');
    this.client = new QdrantClient({
      url: this.config.url,
      apiKey: this.config.apiKey,
    });
    this.embeddings = new OpenAIEmbeddings(): Promise<void> {
    try {
      // Check if collection exists, if not create it
      const collections: {
            size: this.config.vectorSize,
            distance: this.config.distance,
          },
        });
      }
    } catch (error: unknown){
      throw new Error(`Failed to initialize Qdrant: ${error.message}`): unknown[]): Promise<void> {
    const points): void {
        await this.client.createCollection(this.config.collectionName, {
          vectors await Promise.all(
      chunks.map(async (chunk, index)  = await this.client.getCollections(): Promise<void> {);
      const exists = (collections as any).collections.some(
        (collection) => collection.name === this.config.collectionName
      );

      if(!exists> {
        const [vector] = await this.embeddings.embedDocuments([chunk.content]);
        return {
          id: index,
          vector,
          payload: {
            content: chunk.content,
            filePath: chunk.filePath,
            start: chunk.start,
            end: chunk.end,
            timestamp: new Date().toISOString(),
          },
        };
      })
    );

    await this.client.upsert(this.config.collectionName, {
      points,
    });
  }
}