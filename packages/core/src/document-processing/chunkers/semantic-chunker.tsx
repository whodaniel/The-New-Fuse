import { ChunkingStrategy } from '../types.js';
import { SmartAPIGateway } from '../../api-management/SmartAPIGateway.js';

/**
 * Chunker that uses an LLM to identify semantic boundaries
 */
export class SemanticChunker implements ChunkingStrategy {
  public readonly name = 'semantic';
  private apiGateway: SmartAPIGateway;
  private modelId: string;
  private provider: string;
  private maxTokensPerChunk: number;
  
  constructor(apiGateway: SmartAPIGateway, config: {
    modelId: string;
    provider?: string;
    maxTokensPerChunk?: number;
  }) {
    this.apiGateway = apiGateway;
    this.modelId = config.modelId;
    this.provider = config.provider || 'anthropic';
    this.maxTokensPerChunk = config.maxTokensPerChunk || 1000;
  }
  
  async chunk(content: string): Promise<string[]> {
    // First do a rough split by paragraphs to avoid exceeding token limits
    const roughChunks = content.split(/\n\s*\n/);
    
    // If content is small enough, ask LLM to split it directly
    if (content.length < 10000) {
      return this.splitWithLLM(content);
    }
    
    // For larger content, process in batches
    const batches: string[] = [];
    let currentBatch = '';
    
    for (const paragraph of roughChunks) {
      if ((currentBatch.length + paragraph.length) < 10000) {
        currentBatch += paragraph + '\n\n';
      } else {
        if (currentBatch) {
          batches.push(currentBatch);
        }
        currentBatch = paragraph + '\n\n';
      }
    }
    
    if (currentBatch) {
      batches.push(currentBatch);
    }
    
    // Process each batch with the LLM
    const results = await Promise.all(batches.map(batch => this.splitWithLLM(batch)));
    
    // Flatten results
    return results.flat();
  }
  
  private async splitWithLLM(text: string): Promise<string[]> {
    const response = await this.apiGateway.callLLM({
      prompt: `Split the following text into semantically coherent chunks for a vector database. Create logical breakpoints based on topic changes, keeping each chunk standalone and meaningful. Use the tag <CHUNK> to mark the start of each new chunk.\n\nText to split:\n${text}`,
      model: this.modelId,
      provider: this.provider
    });
    
    // Parse chunks from response
    const chunks = response.completion.split(/<CHUNK>/g)
      .map(c => c.trim())
      .filter(c => c.length > 0);
    
    return chunks;
  }
}
