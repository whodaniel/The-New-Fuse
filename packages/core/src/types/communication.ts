
export {}
exports.CommunicationRecord = exports.TransactionType = exports.ChainType = exports.SecurityLevel = exports.MessagePriority = exports.CommunicationPattern = exports.ProtocolType = exports.ParticipantType = exports.ResourceType = exports.WalletType = exports.TokenType = exports.ModelType = exports.PlatformType = exports.ContentType = void 0;
import uuid_1 from ''uuid';
// Content Types
export enum ContentType {
    // Basic Types
    TEXT = "text",
    CODE = "code",
    MARKDOWN = "markdown",
    IMAGE = "image",
    VIDEO = "video",
    AUDIO = "audio",
    DOCUMENT = "document",
    URL = "url",
    EMBED = "embed",
    // Blockchain Types
    SMART_CONTRACT = "smart_contract",
    TRANSACTION = "transaction",
    TOKEN = "token",
    NFT = "nft",
    FUNGIBLE_TOKEN = "fungible_token",
    SEMI_FUNGIBLE_TOKEN = "semi_fungible_token",
    WALLET = "wallet",
    // AI/ML Types
    MODEL_INTERACTION = "model_interaction",
    MODEL_INFERENCE = "model_inference",
    MODEL_TRAINING = "model_training",
    PROMPT = "prompt",
    COMPLETION = "completion",
    EMBEDDING = "embedding",
    // Resource Types
    COMPUTE_RESOURCE = "compute_resource",
    STORAGE_RESOURCE = "storage_resource",
    NETWORK_RESOURCE = "network_resource",
    API_RESOURCE = "api_resource"
}
// Platform Types
export enum PlatformType {
    // Social Media
    TWITTER = "twitter",
    FACEBOOK = "facebook",
    LINKEDIN = "linkedin",
    INSTAGRAM = "instagram",
    DISCORD = "discord",
    SLACK = "slack",
    // Development
    GITHUB = "github",
    GITLAB = "gitlab",
    STACKOVERFLOW = "stackoverflow",
    // Communication
    EMAIL = "email",
    SMS = "sms",
    CHAT = "chat",
    FORUM = "forum",
    BLOG = "blog",
    // Video/Audio
    ZOOM = "zoom",
    TEAMS = "teams",
    MEET = "meet",
    // Blockchain
    ETHEREUM = "ethereum",
    POLYGON = "polygon",
    SOLANA = "solana",
    BINANCE = "binance",
    ARBITRUM = "arbitrum",
    OPTIMISM = "optimism",
    AVALANCHE = "avalanche",
    COSMOS = "cosmos",
    CARDANO = "cardano",
    // DeFi
    UNISWAP = "uniswap",
    AAVE = "aave",
    COMPOUND = "compound",
    CURVE = "curve",
    BALANCER = "balancer",
    // NFT Marketplaces
    OPENSEA = "opensea",
    RARIBLE = "rarible",
    FOUNDATION = "foundation",
    BLUR = "blur",
    X2Y2 = "x2y2",
    // AI/ML Platforms
    OPENAI = "openai",
    ANTHROPIC = "anthropic",
    COHERE = "cohere",
    HUGGINGFACE = "huggingface",
    REPLICATE = "replicate",
    STABILITY_AI = "stability_ai",
    CUSTOM_MODEL = "custom_model",
    // Custom
    API = "api",
    CUSTOM = "custom"
}
// Model Types for AI/ML
var ModelType;
(function (ModelType): any {
    // Language Models
    ModelType["GPT4"] = "gpt4";
    ModelType["GPT35"] = "gpt35";
    ModelType["CLAUDE"] = "claude";
    ModelType["LLAMA"] = "llama";
    ModelType["MISTRAL"] = "mistral";
    ModelType["PALM"] = "palm";
    // Image Models
    ModelType["DALLE"] = "dalle";
    ModelType["STABLE_DIFFUSION"] = "stable_diffusion";
    ModelType["MIDJOURNEY"] = "midjourney";
    // Audio Models
    ModelType["WHISPER"] = "whisper";
    ModelType["MUSICGEN"] = "musicgen";
    // Embedding Models
    ModelType["ADA"] = "ada";
    ModelType["BERT"] = "bert";
    // Custom/Unknown
    ModelType["CUSTOM"] = "custom";
    ModelType["UNKNOWN"] = "unknown";
})(ModelType || (exports.ModelType = ModelType = {}));
// Token Types
var TokenType;
(function (TokenType): any {
    // Fungible
    TokenType["ERC20"] = "erc20";
    TokenType["ERC223"] = "erc223";
    TokenType["BEP20"] = "bep20";
    // Non-Fungible
    TokenType["ERC721"] = "erc721";
    TokenType["ERC1155"] = "erc1155";
    // Semi-Fungible
    TokenType["ERC1155_SEMI"] = "erc1155_semi";
    // Other Standards
    TokenType["SPL"] = "spl";
    TokenType["COSMOS_TOKEN"] = "cosmos_token";
    TokenType["CARDANO_TOKEN"] = "cardano_token";
    // Custom
    TokenType["CUSTOM"] = "custom";
})(TokenType || (exports.TokenType = TokenType = {}));
// Wallet Types
var WalletType;
(function (WalletType): any {
    // Non-Custodial
    WalletType["NON_CUSTODIAL"] = "non_custodial";
    WalletType["HARDWARE"] = "hardware";
    WalletType["PAPER"] = "paper";
    // Custodial
    WalletType["CUSTODIAL"] = "custodial";
    WalletType["EXCHANGE"] = "exchange";
    // Smart Contract
    WalletType["SMART_CONTRACT_WALLET"] = "smart_contract_wallet";
    WalletType["MULTISIG"] = "multisig";
    // Types
    WalletType["HOT"] = "hot";
    WalletType["COLD"] = "cold";
    // Custom
    WalletType["CUSTOM"] = "custom";
})(WalletType || (exports.WalletType = WalletType = {}));
// Resource Types
var ResourceType;
(function (ResourceType): any {
    // Compute
    ResourceType["CPU"] = "cpu";
    ResourceType["GPU"] = "gpu";
    ResourceType["TPU"] = "tpu";
    ResourceType["MEMORY"] = "memory";
    // Storage
    ResourceType["DISK"] = "disk";
    ResourceType["OBJECT_STORAGE"] = "object_storage";
    ResourceType["IPFS"] = "ipfs";
    ResourceType["ARWEAVE"] = "arweave";
    // Network
    ResourceType["BANDWIDTH"] = "bandwidth";
    ResourceType["LATENCY"] = "latency";
    // Custom
    ResourceType["CUSTOM"] = "custom";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
// Participant Types
var ParticipantType;
(function (ParticipantType): any {
    ParticipantType["HUMAN"] = "human";
    ParticipantType["AI_AGENT"] = "ai_agent";
    ParticipantType["SYSTEM"] = "system";
    ParticipantType["SERVICE"] = "service";
    ParticipantType["BOT"] = "bot";
    ParticipantType["SMART_CONTRACT"] = "smart_contract";
    ParticipantType["DAO"] = "dao";
    ParticipantType["UNKNOWN"] = "unknown";
})(ParticipantType || (exports.ParticipantType = ParticipantType = {}));
// Protocol Types
var ProtocolType;
(function (ProtocolType): any {
    ProtocolType["HTTP"] = "http";
    ProtocolType["HTTPS"] = "https";
    ProtocolType["WS"] = "ws";
    ProtocolType["WSS"] = "wss";
    ProtocolType["REDIS"] = "redis";
    ProtocolType["MQTT"] = "mqtt";
    ProtocolType["AMQP"] = "amqp";
    ProtocolType["GRPC"] = "grpc";
    ProtocolType["TCP"] = "tcp";
    ProtocolType["UDP"] = "udp";
    // Blockchain Protocols
    ProtocolType["EVM"] = "evm";
    ProtocolType["SOLANA_PROTOCOL"] = "solana_protocol";
    ProtocolType["COSMOS"] = "cosmos";
    ProtocolType["POLKADOT"] = "polkadot";
    // DeFi Protocols
    ProtocolType["ERC20"] = "erc20";
    ProtocolType["ERC721"] = "erc721";
    ProtocolType["ERC1155"] = "erc1155";
    ProtocolType["UNISWAP_V2"] = "uniswap_v2";
    ProtocolType["UNISWAP_V3"] = "uniswap_v3";
    ProtocolType["CUSTOM"] = "custom";
})(ProtocolType || (exports.ProtocolType = ProtocolType = {}));
// Communication Patterns
var CommunicationPattern;
(function (CommunicationPattern): any {
    CommunicationPattern["DIRECT"] = "direct";
    CommunicationPattern["BROADCAST"] = "broadcast";
    CommunicationPattern["REQUEST_RESPONSE"] = "request_response";
    CommunicationPattern["PUBLISH_SUBSCRIBE"] = "publish_subscribe";
    CommunicationPattern["PIPELINE"] = "pipeline";
    CommunicationPattern["ORCHESTRATOR"] = "orchestrator";
    CommunicationPattern["SMART_CONTRACT_EVENT"] = "smart_contract_event";
    CommunicationPattern["ORACLE"] = "oracle";
    CommunicationPattern["CROSS_CHAIN"] = "cross_chain";
})(CommunicationPattern || (exports.CommunicationPattern = CommunicationPattern = {}));
// Message Priority
var MessagePriority;
(function (MessagePriority): any {
    MessagePriority["CRITICAL"] = "critical";
    MessagePriority["HIGH"] = "high";
    MessagePriority["MEDIUM"] = "medium";
    MessagePriority["LOW"] = "low";
})(MessagePriority || (exports.MessagePriority = MessagePriority = {}));
// Security Level
var SecurityLevel;
(function (SecurityLevel): any {
    SecurityLevel["HIGH"] = "high";
    SecurityLevel["MEDIUM"] = "medium";
    SecurityLevel["LOW"] = "low";
})(SecurityLevel || (exports.SecurityLevel = SecurityLevel = {}));
// Blockchain-specific Types
var ChainType;
(function (ChainType): any {
    ChainType["MAINNET"] = "mainnet";
    ChainType["TESTNET"] = "testnet";
    ChainType["DEVNET"] = "devnet";
})(ChainType || (exports.ChainType = ChainType = {}));
var TransactionType;
(function (TransactionType): any {
    TransactionType["TRANSFER"] = "transfer";
    TransactionType["SWAP"] = "swap";
    TransactionType["MINT"] = "mint";
    TransactionType["BURN"] = "burn";
    TransactionType["STAKE"] = "stake";
    TransactionType["UNSTAKE"] = "unstake";
    TransactionType["GOVERNANCE"] = "governance";
    TransactionType["SMART_CONTRACT_INTERACTION"] = "smart_contract_interaction";
})(TransactionType || (exports.TransactionType = TransactionType = {}));
// Communication Record
class CommunicationRecord {
    constructor(context) {
        this.id = (0, uuid_1.v4)();
        this.createdAt = new Date().toISOString();
        this.updatedAt = this.createdAt;
        this.context = {
            id: (0, uuid_1.v4)(),
            timestamp: new Date().toISOString(),
            participants: {
                sender: {
                    id:, // Corrected unterminated string literal
                    type: ParticipantType.UNKNOWN
                },
                receivers: []
            },
            platform: {
                type: PlatformType.CUSTOM
            },
            protocol: {
                type: ProtocolType.CUSTOM
            },
            content: {
                type: ContentType.TEXT,
                value: ' // Corrected unterminated string literal
            },
            pattern: {
                type: CommunicationPattern.DIRECT
            },
            security: {
                level: SecurityLevel.LOW
            },
            ...context
        };
    }
    update(updates) {
        const updatedContext = {
            ...this.context,
            ...updates,
            metadata: {
                ...this.context.metadata,
                ...updates.metadata
            }
        };
        return new CommunicationRecord(updatedContext);
    }
    toJSON() {
        return {
            id: this.id,
            context: this.context,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }
}
exports.CommunicationRecord = CommunicationRecord;
//# sourceMappingURL=communication.js.mapexport {};
