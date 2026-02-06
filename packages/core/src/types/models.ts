/**
 * Core model types and enums
 */

// Model Types
export enum ModelType {
  // Language Models
  GPT = 'gpt',
  BERT = 'bert',
  T5 = 't5',
  LLAMA = 'llama',
  CLAUDE = 'claude',
  // Vision Models
  RESNET = 'resnet',
  YOLO = 'yolo',
  VISION_TRANSFORMER = 'vision_transformer',
  // Audio Models
  WHISPER = 'whisper',
  WAVE2VEC = 'wave2vec',
  // Multimodal Models
  GPT4V = 'gpt4v',
  DALLE = 'dalle',
  STABLE_DIFFUSION = 'stable_diffusion',
  // Generic
  CUSTOM = 'custom',
  UNKNOWN = 'unknown',
}

// Token Types
export enum TokenType {
  ERC20 = 'erc20',
  BEP20 = 'bep20',
  ERC721 = 'erc721',
  ERC1155 = 'erc1155',
  CUSTOM = 'custom',
  UNKNOWN = 'unknown',
}

// Wallet Types
export enum WalletType {
  METAMASK = 'metamask',
  TRUST = 'trust',
  COINBASE = 'coinbase',
  LEDGER = 'ledger',
  TREZOR = 'trezor',
  SAFE = 'safe',
  ARGENT = 'argent',
  CUSTOM = 'custom',
  UNKNOWN = 'unknown',
}

// Resource Types
export enum ResourceType {
  CPU = 'cpu',
  GPU = 'gpu',
  TPU = 'tpu',
  SSD = 'ssd',
  HDD = 'hdd',
  OBJECT_STORAGE = 'object_storage',
  BANDWIDTH = 'bandwidth',
  LATENCY = 'latency',
  CUSTOM = 'custom',
  UNKNOWN = 'unknown',
}

// Communication Patterns
export enum CommunicationPattern {
  DIRECT = 'direct',
  BROADCAST = 'broadcast',
  MULTICAST = 'multicast',
  REQUEST_RESPONSE = 'request_response',
  PUBLISH_SUBSCRIBE = 'publish_subscribe',
  QUEUE = 'queue',
  STREAM = 'stream',
  EVENT_DRIVEN = 'event_driven',
  CUSTOM = 'custom',
  UNKNOWN = 'unknown',
}

export {};
