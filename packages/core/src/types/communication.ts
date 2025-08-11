import { v4 as uuidv4 } from 'uuid';
export enum ContentType {
  // Implementation needed
}
  TEXT = 'text',
  CODE = 'code',
  MARKDOWN = 'markdown',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  DOCUMENT = 'document',
  URL = 'url',
  EMBED = 'embed',
  SMART_CONTRACT = 'smart_contract',
  TRANSACTION = 'transaction',
  TOKEN = 'token',
  NFT = 'nft',
  FUNGIBLE_TOKEN = 'fungible_token',
  SEMI_FUNGIBLE_TOKEN = 'semi_fungible_token',
  WALLET = 'wallet',
  MODEL_INTERACTION = 'model_interaction',
  MODEL_INFERENCE = 'model_inference',
  MODEL_TRAINING = 'model_training',
  PROMPT = 'prompt',
  COMPLETION = 'completion',
  EMBEDDING = 'embedding',
  COMPUTE_RESOURCE = 'compute_resource',
  STORAGE_RESOURCE = 'storage_resource',
  NETWORK_RESOURCE = 'network_resource',
  API_RESOURCE = 'api_resource'
}

export enum Platform {
  // Implementation needed
}
  TWITTER = 'twitter',
  FACEBOOK = 'facebook',
  LINKEDIN = 'linkedin',
  INSTAGRAM = 'instagram',
  DISCORD = 'discord',
  SLACK = 'slack',
  GITHUB = 'github',
  GITLAB = 'gitlab',
  STACKOVERFLOW = 'stackoverflow',
  EMAIL = 'email',
  SMS = 'sms',
  CHAT = 'chat',
  FORUM = 'forum',
  BLOG = 'blog',
  ZOOM = 'zoom',
  TEAMS = 'teams',
  MEET = 'meet'
}

export enum Blockchain {
  // Implementation needed
}
  ETHEREUM = 'ethereum',
  POLYGON = 'polygon',
  SOLANA = 'solana',
  BINANCE = 'binance',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism',
  AVALANCHE = 'avalanche',
  COSMOS = 'cosmos',
  CARDANO = 'cardano'
}

export enum DeFiProtocol {
  // Implementation needed
}
  UNISWAP = 'uniswap',
  AAVE = 'aave',
  COMPOUND = 'compound',
  CURVE = 'curve',
  BALANCER = 'balancer'
}

export enum NFTMarketplace {
  // Implementation needed
}
  OPENSEA = 'opensea',
  RARIBLE = 'rarible',
  FOUNDATION = 'foundation',
  BLUR = 'blur',
  X2Y2 = 'x2y2'
}

export enum LLMProvider {
  // Implementation needed
}
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  COHERE = 'cohere',
  HUGGINGFACE = 'huggingface',
  REPLICATE = 'replicate',
  STABILITY_AI = 'stability_ai',
  CUSTOM_MODEL = 'custom_model',
  API = 'api',
  CUSTOM = 'custom'
}

export interface CommunicationMessage {
  // Implementation needed
}
  id: string;
  timestamp: Date;
  sender: string;
  recipient?: string;
  content: any;
  contentType: ContentType;
  metadata?: Record<string, any>;
}