
export {}
exports.CommunicationPattern = exports.ResourceType = exports.WalletType = exports.TokenType = exports.ModelType = void 0;
// Model Types
export enum ModelType {
    // Language Models
    GPT = "gpt",
    BERT = "bert",
    T5 = "t5",
    LLAMA = "llama",
    CLAUDE = "claude",
    // Vision Models
    RESNET = "resnet",
    YOLO = "yolo",
    VISION_TRANSFORMER = "vision_transformer",
    // Audio Models
    WHISPER = "whisper",
    WAVE2VEC = "wave2vec",
    // Multimodal Models
    GPT4V = "gpt4v",
    DALLE = "dalle",
    STABLE_DIFFUSION = "stable_diffusion",
    // Custom/Other
    CUSTOM = "custom",
    UNKNOWN = "unknown"
}
// Token Types
export enum TokenType {
    // Fungible Tokens
    ERC20 = "erc20",
    BEP20 = "bep20",
    // Non-Fungible Tokens
    ERC721 = "erc721",
    ERC1155 = "erc1155",
    // Other Standards
    CUSTOM = "custom",
    UNKNOWN = "unknown"
}
// Wallet Types
export enum WalletType {
    // Hot Wallets
    METAMASK = "metamask",
    TRUST = "trust",
    COINBASE = "coinbase",
    // Cold Wallets
    LEDGER = "ledger",
    TREZOR = "trezor",
    // Smart Contract Wallets
    SAFE = "safe",
    ARGENT = "argent",
    // Other
    CUSTOM = "custom",
    UNKNOWN = "unknown"
}
// Resource Types
export enum ResourceType {
    // Compute Resources
    CPU = "cpu",
    GPU = "gpu",
    TPU = "tpu",
    // Storage Resources
    SSD = "ssd",
    HDD = "hdd",
    OBJECT_STORAGE = "object_storage",
    // Network Resources
    BANDWIDTH = "bandwidth",
    LATENCY = "latency",
    // Other
    CUSTOM = "custom",
    UNKNOWN = "unknown"
}
// Communication Patterns
export enum CommunicationPattern {
    // Basic Patterns
    DIRECT = "direct",
    BROADCAST = "broadcast",
    MULTICAST = "multicast",
    // Advanced Patterns
    REQUEST_RESPONSE = "request_response",
    PUBLISH_SUBSCRIBE = "publish_subscribe",
    QUEUE = "queue",
    // Streaming Patterns
    STREAM = "stream",
    EVENT_DRIVEN = "event_driven",
    // Other
    CUSTOM = "custom",
    UNKNOWN = "unknown"
}
//# sourceMappingURL=models.js.mapexport {};
