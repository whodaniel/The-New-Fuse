import { SmartAPIGateway } from '../api-management/SmartAPIGateway.js';
import { Logger } from '../logging.js';

export class EmbeddingService {
  private apiGateway: SmartAPIGateway;
  private logger: Logger;
  private modelId: string;
  private provider: string;
  private dimensionality: number;
  
  constructor(apiGateway: SmartAPIGateway, logger: Logger, config: {
    modelId: string;
    provider?: string;
    dimensionality?: number;
  }) {
    this.apiGateway = apiGateway;
    this.logger = logger;
    this.modelId = config.modelId;
    this.provider = config.provider || 'openai';
    this.dimensionality = config.dimensionality || 1536; // Default for OpenAI
  }
  
  /**
   * Generate embeddings for a text
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      this.logger.debug(`Generating embedding for text (${text.length} chars)`);
      
      // Use our existing SmartAPIGateway to call the embedding API
      const response = await this.apiGateway.callLLM({
        prompt: text,
        model: this.modelId,
        provider: this.provider
      });
      
      if (!response.embedding) {
        throw new Error('Embedding not returned from API');
      }
      
      return response.embedding;
    } catch (error) {
      this.logger.error('Error generating embedding:', error);
      throw error;
    }
  }
  
  /**
   * Generate embeddings for multiple texts in batch
   */
  async generateBatchEmbeddings(texts: string[]): Promise<number[][]> {
    // For simplicity, we'll just call the single embedding method for each text
    // In a real implementation, we'd use the batch API if available
    return Promise.all(texts.map(text => this.generateEmbedding(text)));
  }
}
