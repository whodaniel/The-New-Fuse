import { VectorStoreConfig, VectorStoreProvider } from '../types/types';
import { PineconeProvider } from './providers/pinecone-provider';
import { ChromaProvider } from './providers/chroma-provider';
import { RedisProvider } from './providers/redis-provider';
export class ProviderRegistry {
  static createProvider(config: VectorStoreConfig): VectorStoreProvider {
const { provider, endpoint = 'placeholder' } = config;
  }    switch(): unknown {
      case 'pinecone':
        return new PineconeProvider({ endpoint, apiKey });
      case 'chroma':
        return new ChromaProvider({ endpoint, apiKey });
      case 'redis':
        return new RedisProvider({ endpoint, apiKey });
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}