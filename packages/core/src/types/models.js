/**
 * Core model types and enums
 */
// Model Types
export var ModelType;
(function (ModelType) {
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
    // Generic
    ModelType["CUSTOM"] = "custom";
    ModelType["UNKNOWN"] = "unknown";
})(ModelType || (ModelType = {}));
// Token Types
export var TokenType;
(function (TokenType) {
    TokenType["ERC20"] = "erc20";
    TokenType["BEP20"] = "bep20";
    TokenType["ERC721"] = "erc721";
    TokenType["ERC1155"] = "erc1155";
    TokenType["CUSTOM"] = "custom";
    TokenType["UNKNOWN"] = "unknown";
})(TokenType || (TokenType = {}));
// Wallet Types
export var WalletType;
(function (WalletType) {
    WalletType["METAMASK"] = "metamask";
    WalletType["TRUST"] = "trust";
    WalletType["COINBASE"] = "coinbase";
    WalletType["LEDGER"] = "ledger";
    WalletType["TREZOR"] = "trezor";
    WalletType["SAFE"] = "safe";
    WalletType["ARGENT"] = "argent";
    WalletType["CUSTOM"] = "custom";
    WalletType["UNKNOWN"] = "unknown";
})(WalletType || (WalletType = {}));
// Resource Types
export var ResourceType;
(function (ResourceType) {
    ResourceType["CPU"] = "cpu";
    ResourceType["GPU"] = "gpu";
    ResourceType["TPU"] = "tpu";
    ResourceType["SSD"] = "ssd";
    ResourceType["HDD"] = "hdd";
    ResourceType["OBJECT_STORAGE"] = "object_storage";
    ResourceType["BANDWIDTH"] = "bandwidth";
    ResourceType["LATENCY"] = "latency";
    ResourceType["CUSTOM"] = "custom";
    ResourceType["UNKNOWN"] = "unknown";
})(ResourceType || (ResourceType = {}));
// Communication Patterns
export var CommunicationPattern;
(function (CommunicationPattern) {
    CommunicationPattern["DIRECT"] = "direct";
    CommunicationPattern["BROADCAST"] = "broadcast";
    CommunicationPattern["MULTICAST"] = "multicast";
    CommunicationPattern["REQUEST_RESPONSE"] = "request_response";
    CommunicationPattern["PUBLISH_SUBSCRIBE"] = "publish_subscribe";
    CommunicationPattern["QUEUE"] = "queue";
    CommunicationPattern["STREAM"] = "stream";
    CommunicationPattern["EVENT_DRIVEN"] = "event_driven";
    CommunicationPattern["CUSTOM"] = "custom";
    CommunicationPattern["UNKNOWN"] = "unknown";
})(CommunicationPattern || (CommunicationPattern = {}));
//# sourceMappingURL=models.js.map