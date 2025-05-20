import { VectorStoreConfig, VectorStoreProvider } from './types.js';
import { PineconeProvider } from './providers/pinecone-provider.js';
import { ChromaProvider } from './providers/chroma-provider.js';
import { RedisProvider } from './providers/redis-provider.js';

export function createVectorStoreProvider(config: VectorStoreConfig): VectorStoreProvider {
  const { provider, endpoint = '', apiKey = '', namespace } = config;
  switch (provider) {
    case 'pinecone':
      // endpoint expected as environment, apiKey as key
      return new PineconeProvider(apiKey, endpoint, namespace);
    case 'chroma':
      return new ChromaProvider(endpoint, apiKey, namespace);
    case 'redis':
      return new RedisProvider(endpoint, apiKey, namespace);
    default:
      throw new Error(`Unsupported vector store provider: ${provider}`);
  }
}