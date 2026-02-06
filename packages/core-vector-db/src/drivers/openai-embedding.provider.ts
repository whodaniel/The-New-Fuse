import { Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import type { EmbeddingConfig, IEmbeddingProvider } from '../interface/vector-database.interface';

@Injectable()
export class OpenAIEmbeddingProvider implements IEmbeddingProvider {
  private readonly logger = new Logger(OpenAIEmbeddingProvider.name);
  private readonly client: OpenAI;
  private readonly model: string;
  private readonly dimension: number;

  constructor(private readonly config: EmbeddingConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });

    this.model = config.model || 'text-embedding-3-small';
    this.dimension = config.dimension || this.getDefaultDimension(this.model);
  }

  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimension,
      });

      const embedding = response.data[0].embedding;
      this.logger.debug(`Generated embedding for text of length ${text.length}`);

      return embedding;
    } catch (error) {
      this.logger.error('Failed to generate embedding', error);
      throw new Error(
        `Failed to generate embedding: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // Process in batches to avoid rate limits
      const batchSize = 100;
      const results: number[][] = [];

      for (let i = 0; i < texts.length; i += batchSize) {
        const batch = texts.slice(i, i + batchSize);

        const response = await this.client.embeddings.create({
          model: this.model,
          input: batch,
          dimensions: this.dimension,
        });

        const batchEmbeddings = response.data.map((item) => item.embedding);
        results.push(...batchEmbeddings);
      }

      this.logger.debug(`Generated ${results.length} embeddings for batch of texts`);
      return results;
    } catch (error) {
      this.logger.error('Failed to generate batch embeddings', error);
      throw new Error(
        `Failed to generate batch embeddings: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  getDimension(): number {
    return this.dimension;
  }

  getModelName(): string {
    return this.model;
  }

  private getDefaultDimension(model: string): number {
    const dimensionMap: Record<string, number> = {
      'text-embedding-ada-002': 1536,
      'text-embedding-3-small': 1536,
      'text-embedding-3-large': 3072,
    };

    return dimensionMap[model] || 1536;
  }
}
