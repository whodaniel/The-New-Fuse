
export {}
exports.MessageClassifier = void 0;
import types_1 from '../types.js';
class MessageClassifier {
    constructor() {
        if (MessageClassifier.instance) {
            return MessageClassifier.instance;
        }
        MessageClassifier.instance = this;
    }
    async classify(): Promise<void> {message, context) {
        const result = {
            messageType: types_1.MessageType.TEXT,
            contentType: types_1.ContentType.TEXT,
            pattern: types_1.CommunicationPattern.DIRECT,
            confidence: 0,
            metadata: {}
        };
        // Check for blockchain-related content
        if (this.isBlockchainContent(message)) {
            this.classifyBlockchainContent(message, result);
        }
        // Check for AI/ML model interactions
        if (this.isModelInteraction(message)) {
            this.classifyModelInteraction(message, result);
        }
        // Check for resource management
        if (this.isResourceManagement(message)) {
            this.classifyResourceManagement(message, result);
        }
        // Use context to enhance classification
        if (context) {
            this.enhanceClassificationWithContext(result, context);
        }
        return result;
    }
    /**
     * Detect blockchain-related content
     */
    isBlockchainContent(content) {
        const blockchainKeywords = [
            'transaction', 'wallet', 'token', 'nft', 'smart contract',
            'ethereum', 'solana', 'polygon', 'blockchain', 'web3',
            'defi', 'dao', 'crypto', 'mint', 'burn', 'stake',
            'swap', 'liquidity', 'yield', 'bridge'
        ];
        return blockchainKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
    }
    /**
     * Classify blockchain-related content
     */
    classifyBlockchainContent(content, result) {
        // Token Operations
        if (content.match(/\b(erc20|erc721|erc1155|token|nft)\b/i)) {
            result.contentType = this.detectTokenType(content);
            result.tokenType = this.detectTokenStandard(content);
        }
        // Wallet Operations
        else if (content.match(/\b(wallet|address|private key|seed phrase)\b/i)) {
            result.contentType = types_1.ContentType.WALLET;
            result.walletType = this.detectWalletType(content);
        }
        // Smart Contract Operations
        else if (content.match(/\b(smart contract|deploy|contract|function)\b/i)) {
            result.contentType = types_1.ContentType.SMART_CONTRACT;
        }
        // Transaction Operations
        else {
            result.contentType = types_1.ContentType.TRANSACTION;
        }
        result.pattern = types_1.CommunicationPattern.SMART_CONTRACT_EVENT;
        result.confidence = 0.8;
    }
    /**
     * Detect token type from content
     */
    detectTokenType(content) {
        if (content.match(/\b(nft|erc721|erc1155)\b/i)) {
            return types_1.ContentType.NFT;
        }
        if (content.match(/\b(erc1155|semi[- ]fungible)\b/i)) {
            return types_1.ContentType.SEMI_FUNGIBLE_TOKEN;
        }
        return types_1.ContentType.FUNGIBLE_TOKEN;
    }
    /**
     * Detect token standard from content
     */
    detectTokenStandard(content) {
        if (content.match(/\berc20\b/i))
            return types_1.TokenType.ERC20;
        if (content.match(/\berc721\b/i))
            return types_1.TokenType.ERC721;
        if (content.match(/\berc1155\b/i))
            return types_1.TokenType.ERC1155;
        if (content.match(/\bspl\b/i))
            return types_1.TokenType.SPL;
        return types_1.TokenType.CUSTOM;
    }
    /**
     * Detect wallet type from content
     */
    detectWalletType(content) {
        if (content.match(/\b(hardware|ledger|trezor)\b/i))
            return types_1.WalletType.HARDWARE;
        if (content.match(/\b(non[- ]custodial)\b/i))
            return types_1.WalletType.NON_CUSTODIAL;
        if (content.match(/\b(multi[- ]sig|multisig)\b/i))
            return types_1.WalletType.MULTISIG;
        if (content.match(/\b(smart[- ]contract[- ]wallet)\b/i))
            return types_1.WalletType.SMART_CONTRACT_WALLET;
        return types_1.WalletType.CUSTOM;
    }
    /**
     * Detect AI/ML model interactions
     */
    isModelInteraction(content) {
        const modelKeywords = [
            'gpt', 'llama', 'claude', 'dalle', 'stable diffusion',
            'whisper', 'bert', 'embedding', 'inference', 'training',
            'prompt', 'completion', 'tokens', 'temperature'
        ];
        return modelKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
    }
    /**
     * Classify AI/ML model interactions
     */
    classifyModelInteraction(content, result) {
        // Determine specific model type
        result.modelType = this.detectModelType(content);
        // Determine interaction type
        if (content.match(/\b(train|training|fine[- ]tun(e|ing))\b/i)) {
            result.contentType = types_1.ContentType.MODEL_TRAINING;
        }
        else if (content.match(/\b(infer|inference|predict|prediction)\b/i)) {
            result.contentType = types_1.ContentType.MODEL_INFERENCE;
        }
        else if (content.match(/\b(embed|embedding)\b/i)) {
            result.contentType = types_1.ContentType.EMBEDDING;
        }
        else if (content.match(/\b(prompt|instruction|task)\b/i)) {
            result.contentType = types_1.ContentType.PROMPT;
        }
        else {
            result.contentType = types_1.ContentType.MODEL_INTERACTION;
        }
        result.pattern = types_1.CommunicationPattern.REQUEST_RESPONSE;
        result.confidence = 0.9;
    }
    /**
     * Detect model type from content
     */
    detectModelType(content) {
        if (content.match(/\bgpt-?4\b/i))
            return types_1.ModelType.GPT4;
        if (content.match(/\bgpt-?3\.5\b/i))
            return types_1.ModelType.GPT35;
        if (content.match(/\bclaude\b/i))
            return types_1.ModelType.CLAUDE;
        if (content.match(/\bllama\b/i))
            return types_1.ModelType.LLAMA;
        if (content.match(/\bmistral\b/i))
            return types_1.ModelType.MISTRAL;
        if (content.match(/\bpalm\b/i))
            return types_1.ModelType.PALM;
        if (content.match(/\bdall-?e\b/i))
            return types_1.ModelType.DALLE;
        if (content.match(/\bstable[- ]diffusion\b/i))
            return types_1.ModelType.STABLE_DIFFUSION;
        if (content.match(/\bwhisper\b/i))
            return types_1.ModelType.WHISPER;
        if (content.match(/\bbert\b/i))
            return types_1.ModelType.BERT;
        return types_1.ModelType.UNKNOWN;
    }
    /**
     * Detect resource management content
     */
    isResourceManagement(content) {
        const resourceKeywords = [
            'cpu', 'gpu', 'memory', 'storage', 'bandwidth',
            'compute', 'resource', 'allocation', 'utilization',
            'capacity', 'scaling', 'performance', 'latency'
        ];
        return resourceKeywords.some(keyword => content.toLowerCase().includes(keyword.toLowerCase()));
    }
    /**
     * Classify resource management content
     */
    classifyResourceManagement(content, result) {
        // Determine resource type
        result.resourceType = this.detectResourceType(content);
        if (content.match(/\b(compute|cpu|gpu|tpu|processing)\b/i)) {
            result.contentType = types_1.ContentType.COMPUTE_RESOURCE;
        }
        else if (content.match(/\b(storage|disk|memory|database)\b/i)) {
            result.contentType = types_1.ContentType.STORAGE_RESOURCE;
        }
        else if (content.match(/\b(network|bandwidth|latency|throughput)\b/i)) {
            result.contentType = types_1.ContentType.NETWORK_RESOURCE;
        }
        else {
            result.contentType = types_1.ContentType.API_RESOURCE;
        }
        result.pattern = types_1.CommunicationPattern.PIPELINE;
        result.confidence = 0.7;
    }
    /**
     * Detect resource type from content
     */
    detectResourceType(content) {
        if (content.match(/\b(cpu)\b/i))
            return types_1.ResourceType.CPU;
        if (content.match(/\b(gpu)\b/i))
            return types_1.ResourceType.GPU;
        if (content.match(/\b(tpu)\b/i))
            return types_1.ResourceType.TPU;
        if (content.match(/\b(memory)\b/i))
            return types_1.ResourceType.MEMORY;
        if (content.match(/\b(disk)\b/i))
            return types_1.ResourceType.DISK;
        if (content.match(/\b(object[- ]storage)\b/i))
            return types_1.ResourceType.OBJECT_STORAGE;
        if (content.match(/\b(ipfs)\b/i))
            return types_1.ResourceType.IPFS;
        if (content.match(/\b(arweave)\b/i))
            return types_1.ResourceType.ARWEAVE;
        if (content.match(/\b(bandwidth)\b/i))
            return types_1.ResourceType.BANDWIDTH;
        if (content.match(/\b(latency)\b/i))
            return types_1.ResourceType.LATENCY;
        return types_1.ResourceType.CUSTOM;
    }
    /**
     * Enhance classification using context
     */
    enhanceClassificationWithContext(result, context) {
        // Use platform information
        if (context.platform?.type) {
            result.platformType = context.platform.type;
            result.confidence += 0.1;
        }
        // Use existing metadata
        if (context.content?.metadata) {
            const metadata = context.content.metadata;
            if (metadata.blockchain) {
                result.metadata.blockchain = metadata.blockchain;
                result.confidence += 0.1;
            }
            if (metadata.model) {
                result.metadata.model = metadata.model;
                result.confidence += 0.1;
            }
            if (metadata.token) {
                result.metadata.token = metadata.token;
                result.confidence += 0.1;
            }
            if (metadata.wallet) {
                result.metadata.wallet = metadata.wallet;
                result.confidence += 0.1;
            }
            if (metadata.resource) {
                result.metadata.resource = metadata.resource;
                result.confidence += 0.1;
            }
        }
        // Cap confidence at 1.0
        result.confidence = Math.min(result.confidence, 1.0);
    }
}
exports.MessageClassifier = MessageClassifier;
//# sourceMappingURL=MessageClassifier.js.mapexport {};
