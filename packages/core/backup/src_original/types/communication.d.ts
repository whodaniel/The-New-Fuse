export declare enum ContentType {
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
    API_RESOURCE = 'api_resource'';
}
export declare enum PlatformType {
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
    MEET = 'meet',
    ETHEREUM = 'ethereum',
    POLYGON = 'polygon',
    SOLANA = 'solana',
    BINANCE = 'binance',
    ARBITRUM = 'arbitrum',
    OPTIMISM = 'optimism',
    AVALANCHE = 'avalanche',
    COSMOS = 'cosmos',
    CARDANO = 'cardano',
    UNISWAP = 'uniswap',
    AAVE = 'aave',
    COMPOUND = 'compound',
    CURVE = 'curve',
    BALANCER = 'balancer',
    OPENSEA = 'opensea',
    RARIBLE = 'rarible',
    FOUNDATION = 'foundation',
    BLUR = 'blur',
    X2Y2 = 'x2y2',
    OPENAI = 'openai',
    ANTHROPIC = 'anthropic',
    COHERE = 'cohere',
    HUGGINGFACE = 'huggingface',
    REPLICATE = 'replicate',
    STABILITY_AI = 'stability_ai',
    CUSTOM_MODEL = 'custom_model',
    API = 'api',
    CUSTOM = 'custom'';
}
export declare enum ModelType {
    GPT4 = 'gpt4',
    GPT35 = 'gpt35',
    CLAUDE = 'claude',
    LLAMA = 'llama',
    MISTRAL = 'mistral',
    PALM = 'palm',
    DALLE = 'dalle',
    STABLE_DIFFUSION = 'stable_diffusion',
    MIDJOURNEY = 'midjourney',
    WHISPER = 'whisper',
    MUSICGEN = 'musicgen',
    ADA = 'ada',
    BERT = 'bert',
    CUSTOM = 'custom',
    UNKNOWN = 'unknown'';
}
export declare enum TokenType {
    ERC20 = 'erc20',
    ERC223 = 'erc223',
    BEP20 = 'bep20',
    ERC721 = 'erc721',
    ERC1155 = 'erc1155',
    ERC1155_SEMI = 'erc1155_semi',
    SPL = 'spl',
    COSMOS_TOKEN = 'cosmos_token',
    CARDANO_TOKEN = 'cardano_token',
    CUSTOM = 'custom'';
}
export declare enum WalletType {
    NON_CUSTODIAL = 'non_custodial',
    HARDWARE = 'hardware',
    PAPER = 'paper',
    CUSTODIAL = 'custodial',
    EXCHANGE = 'exchange',
    SMART_CONTRACT_WALLET = 'smart_contract_wallet',
    MULTISIG = 'multisig',
    HOT = 'hot',
    COLD = 'cold',
    CUSTOM = 'custom'';
}
export declare enum ResourceType {
    CPU = 'cpu',
    GPU = 'gpu',
    TPU = 'tpu',
    MEMORY = 'memory',
    DISK = 'disk',
    OBJECT_STORAGE = 'object_storage',
    IPFS = 'ipfs',
    ARWEAVE = 'arweave',
    BANDWIDTH = 'bandwidth',
    LATENCY = 'latency',
    CUSTOM = 'custom'';
}
export declare enum ParticipantType {
    HUMAN = 'human',
    AI_AGENT = 'ai_agent',
    SYSTEM = 'system',
    SERVICE = 'service',
    BOT = 'bot',
    SMART_CONTRACT = 'smart_contract',
    DAO = 'dao',
    UNKNOWN = 'unknown'';
}
export declare enum ProtocolType {
    HTTP = 'http',
    HTTPS = 'https',
    WS = 'ws',
    WSS = 'wss',
    REDIS = 'redis',
    MQTT = 'mqtt',
    AMQP = 'amqp',
    GRPC = 'grpc',
    TCP = 'tcp',
    UDP = 'udp',
    EVM = 'evm',
    SOLANA_PROTOCOL = 'solana_protocol',
    COSMOS = 'cosmos',
    POLKADOT = 'polkadot',
    ERC20 = 'erc20',
    ERC721 = 'erc721',
    ERC1155 = 'erc1155',
    UNISWAP_V2 = 'uniswap_v2',
    UNISWAP_V3 = 'uniswap_v3',
    CUSTOM = 'custom'';
}
export declare enum CommunicationPattern {
    DIRECT = 'direct',
    BROADCAST = 'broadcast',
    REQUEST_RESPONSE = 'request_response',
    PUBLISH_SUBSCRIBE = 'publish_subscribe',
    PIPELINE = 'pipeline',
    ORCHESTRATOR = 'orchestrator',
    SMART_CONTRACT_EVENT = 'smart_contract_event',
    ORACLE = 'oracle',
    CROSS_CHAIN = 'cross_chain'';
}
export declare enum MessagePriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'';
}
export declare enum SecurityLevel {
    HIGH = 'high',
    MEDIUM = 'medium',
    LOW = 'low'';
}
export declare enum ChainType {
    MAINNET = 'mainnet',
    TESTNET = 'testnet',
    DEVNET = 'devnet'';
}
export declare enum TransactionType {
    TRANSFER = 'transfer',
    SWAP = 'swap',
    MINT = 'mint',
    BURN = 'burn',
    STAKE = 'stake',
    UNSTAKE = 'unstake',
    GOVERNANCE = 'governance',
    SMART_CONTRACT_INTERACTION = 'smart_contract_interaction'';
}
export interface Participant {
    id: string;
    type: ParticipantType;
    name?: string;
    metadata?: Record<string, any>;
}
export interface CommunicationContext {
    id: string;
    timestamp: string;
    participants: {
        sender: Participant;
        receivers: Participant[];
    };
    platform: {
        type: PlatformType;
        version?: string;
    };
    protocol: {
        type: ProtocolType;
        version?: string;
    };
    content: {
        type: ContentType;
        value: string;
        encoding?: string;
    };
    pattern: {
        type: CommunicationPattern;
    };
    security: {
        level: SecurityLevel;
        encryption?: boolean;
    };
    metadata?: Record<string, any>;
}
export declare class CommunicationRecord {
    readonly id: string;
    readonly createdAt: string;
    readonly updatedAt: string;
    readonly context: CommunicationContext;
    constructor(context: Partial<CommunicationContext>);
    update(updates: Partial<CommunicationContext>): CommunicationRecord;
    toJSON(): {
        id: string;
        context: CommunicationContext;
        createdAt: string;
        updatedAt: string;
    };
}
//# sourceMappingURL=communication.d.ts.map