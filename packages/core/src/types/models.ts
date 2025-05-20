
export {}
exports.CommunicationPattern = exports.ResourceType = exports.WalletType = exports.TokenType = exports.ModelType = void 0;
// Model Types
var ModelType;
(function (ModelType): any {
    // Language Models
    ModelType["GPT"] = "gpt";
    ModelType["BERT"] = "bert";
    ModelType["T5"] = "t5";
    ModelType["LLAMA"] = "llama";
    ModelType["CLAUDE"] = "claude";
    // Vision Models
    ModelType["RESNET"] = "resnet";
    ModelType["YOLO"] = "yolo";
    ModelType["VISION_TRANSFORMER"] = "vision_transformer";
    // Audio Models
    ModelType["WHISPER"] = "whisper";
    ModelType["WAVE2VEC"] = "wave2vec";
    // Multimodal Models
    ModelType["GPT4V"] = "gpt4v";
    ModelType["DALLE"] = "dalle";
    ModelType["STABLE_DIFFUSION"] = "stable_diffusion";
    // Custom/Other
    ModelType["CUSTOM"] = "custom";
    ModelType["UNKNOWN"] = "unknown";
})(ModelType || (exports.ModelType = ModelType = {}));
// Token Types
var TokenType;
(function (TokenType): any {
    // Fungible Tokens
    TokenType["ERC20"] = "erc20";
    TokenType["BEP20"] = "bep20";
    // Non-Fungible Tokens
    TokenType["ERC721"] = "erc721";
    TokenType["ERC1155"] = "erc1155";
    // Other Standards
    TokenType["CUSTOM"] = "custom";
    TokenType["UNKNOWN"] = "unknown";
})(TokenType || (exports.TokenType = TokenType = {}));
// Wallet Types
var WalletType;
(function (WalletType): any {
    // Hot Wallets
    WalletType["METAMASK"] = "metamask";
    WalletType["TRUST"] = "trust";
    WalletType["COINBASE"] = "coinbase";
    // Cold Wallets
    WalletType["LEDGER"] = "ledger";
    WalletType["TREZOR"] = "trezor";
    // Smart Contract Wallets
    WalletType["SAFE"] = "safe";
    WalletType["ARGENT"] = "argent";
    // Other
    WalletType["CUSTOM"] = "custom";
    WalletType["UNKNOWN"] = "unknown";
})(WalletType || (exports.WalletType = WalletType = {}));
// Resource Types
var ResourceType;
(function (ResourceType): any {
    // Compute Resources
    ResourceType["CPU"] = "cpu";
    ResourceType["GPU"] = "gpu";
    ResourceType["TPU"] = "tpu";
    // Storage Resources
    ResourceType["SSD"] = "ssd";
    ResourceType["HDD"] = "hdd";
    ResourceType["OBJECT_STORAGE"] = "object_storage";
    // Network Resources
    ResourceType["BANDWIDTH"] = "bandwidth";
    ResourceType["LATENCY"] = "latency";
    // Other
    ResourceType["CUSTOM"] = "custom";
    ResourceType["UNKNOWN"] = "unknown";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
// Communication Patterns
var CommunicationPattern;
(function (CommunicationPattern): any {
    // Basic Patterns
    CommunicationPattern["DIRECT"] = "direct";
    CommunicationPattern["BROADCAST"] = "broadcast";
    CommunicationPattern["MULTICAST"] = "multicast";
    // Advanced Patterns
    CommunicationPattern["REQUEST_RESPONSE"] = "request_response";
    CommunicationPattern["PUBLISH_SUBSCRIBE"] = "publish_subscribe";
    CommunicationPattern["QUEUE"] = "queue";
    // Streaming Patterns
    CommunicationPattern["STREAM"] = "stream";
    CommunicationPattern["EVENT_DRIVEN"] = "event_driven";
    // Other
    CommunicationPattern["CUSTOM"] = "custom";
    CommunicationPattern["UNKNOWN"] = "unknown";
})(CommunicationPattern || (exports.CommunicationPattern = CommunicationPattern = {}));
//# sourceMappingURL=models.js.mapexport {};
