"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SmartContractService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartContractService = exports.SMART_ACCOUNT_FACTORY_ABI = exports.REVENUE_DISTRIBUTOR_ABI = exports.MARKETPLACE_ABI = exports.AGENT_NFT_ABI = void 0;
const common_1 = require("@nestjs/common");
const ethers_1 = require("ethers");
// Contract ABIs (would normally be imported from compiled contracts)
exports.AGENT_NFT_ABI = [
    "function mint(address to, string memory tokenURI) public returns (uint256)",
    "function setTokenURI(uint256 tokenId, string memory tokenURI) public",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function getAgent(uint256 tokenId) public view returns (tuple(string name, string description, string agentType, string[] capabilities, uint256 shares, bool isFractionalized))",
    "function transferFractionalShare(uint256 tokenId, address from, address to, uint256 shareAmount) external",
    "function setMarketplaceAuthorization(address marketplace, bool authorized) external",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event FractionalShareTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 shareAmount)"
];
exports.MARKETPLACE_ABI = [
    "function listShares(uint256 agentTokenId, uint256 shareAmount, uint256 pricePerShare, uint256 duration) external returns (uint256)",
    "function buyShares(uint256 listingId) external payable",
    "function makeOffer(uint256 listingId, uint256 shareAmount) external payable returns (uint256)",
    "function acceptOffer(uint256 offerId) external",
    "function cancelListing(uint256 listingId) external",
    "function cancelOffer(uint256 offerId) external",
    "function getListing(uint256 listingId) public view returns (tuple(uint256 agentTokenId, address seller, uint256 shareAmount, uint256 pricePerShare, uint256 totalPrice, bool active, uint256 expiresAt))",
    "function getOffer(uint256 offerId) public view returns (tuple(uint256 listingId, address buyer, uint256 offerPrice, uint256 shareAmount, bool active, uint256 expiresAt))",
    "event SharesListed(uint256 indexed listingId, uint256 indexed agentTokenId, address indexed seller, uint256 shareAmount, uint256 pricePerShare)",
    "event SharesSold(uint256 indexed listingId, address indexed buyer, uint256 shareAmount, uint256 totalPrice)",
    "event OfferMade(uint256 indexed offerId, uint256 indexed listingId, address indexed buyer, uint256 offerPrice, uint256 shareAmount)",
    "event OfferAccepted(uint256 indexed offerId, address indexed seller, address indexed buyer, uint256 shareAmount, uint256 totalPrice)"
];
exports.REVENUE_DISTRIBUTOR_ABI = [
    "function createRevenueStream(uint256 agentTokenId, string memory streamName, address tokenAddress, uint256 distributionThreshold) external returns (uint256)",
    "function addRevenue(uint256 streamId, uint256 amount) external payable",
    "function distributeRevenue(uint256 streamId) external returns (uint256)",
    "function getRevenueStream(uint256 streamId) public view returns (tuple(uint256 agentTokenId, string streamName, address tokenAddress, uint256 totalRevenue, uint256 distributedRevenue, uint256 distributionThreshold, bool active))",
    "function claimRevenue(uint256 streamId, address recipient) external returns (uint256)",
    "event RevenueStreamCreated(uint256 indexed streamId, uint256 indexed agentTokenId, string streamName, address tokenAddress)",
    "event RevenueAdded(uint256 indexed streamId, uint256 amount)",
    "event RevenueDistributed(uint256 indexed streamId, uint256 totalAmount, uint256 recipientCount)"
];
exports.SMART_ACCOUNT_FACTORY_ABI = [
    "function createAccount(address owner, uint256 salt) external returns (address)",
    "function getAddress(address owner, uint256 salt) public view returns (address)",
    "event AccountCreated(address indexed account, address indexed owner, uint256 salt)"
];
let SmartContractService = SmartContractService_1 = class SmartContractService {
    logger = new common_1.Logger(SmartContractService_1.name);
    provider;
    wallet;
    agentNftContract;
    marketplaceContract;
    revenueDistributorContract;
    smartAccountFactoryContract;
    constructor() {
        this.initializeContracts();
    }
    initializeContracts() {
        try {
            // Initialize provider based on environment
            const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
            this.provider = new ethers_1.providers.JsonRpcProvider(rpcUrl);
            // Initialize wallet
            const privateKey = process.env.PRIVATE_KEY;
            if (!privateKey) {
                throw new Error('PRIVATE_KEY environment variable is required');
            }
            this.wallet = new ethers_1.ethers.Wallet(privateKey, this.provider);
            // Initialize contract instances
            this.agentNftContract = new ethers_1.ethers.Contract(process.env.AGENT_NFT_CONTRACT_ADDRESS || ethers_1.constants.AddressZero, exports.AGENT_NFT_ABI, this.wallet);
            this.marketplaceContract = new ethers_1.ethers.Contract(process.env.MARKETPLACE_CONTRACT_ADDRESS || ethers_1.constants.AddressZero, exports.MARKETPLACE_ABI, this.wallet);
            this.revenueDistributorContract = new ethers_1.ethers.Contract(process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS || ethers_1.constants.AddressZero, exports.REVENUE_DISTRIBUTOR_ABI, this.wallet);
            this.smartAccountFactoryContract = new ethers_1.ethers.Contract(process.env.SMART_ACCOUNT_FACTORY_ADDRESS || ethers_1.constants.AddressZero, exports.SMART_ACCOUNT_FACTORY_ABI, this.wallet);
            this.logger.log('Smart contracts initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize smart contracts:', error);
        }
    }
    // Agent NFT Contract Methods
    async mintAgentNft(ownerAddress, metadataUri) {
        try {
            const tx = await this.agentNftContract.mint(ownerAddress, metadataUri);
            const receipt = await tx.wait();
            const transferEvent = receipt.events?.find(e => e.event === 'Transfer');
            const tokenId = transferEvent?.args?.tokenId?.toNumber();
            return {
                tokenId,
                txHash: receipt.transactionHash
            };
        }
        catch (error) {
            this.logger.error('Failed to mint agent NFT:', error);
            throw error;
        }
    }
    async updateTokenMetadata(tokenId, metadataUri) {
        try {
            const tx = await this.agentNftContract.setTokenURI(tokenId, metadataUri);
            const receipt = await tx.wait();
            return receipt.transactionHash;
        }
        catch (error) {
            this.logger.error('Failed to update token metadata:', error);
            throw error;
        }
    }
    async transferFractionalShare(tokenId, from, to, shareAmount) {
        try {
            const tx = await this.agentNftContract.transferFractionalShare(tokenId, from, to, shareAmount);
            const receipt = await tx.wait();
            return receipt.transactionHash;
        }
        catch (error) {
            this.logger.error('Failed to transfer fractional share:', error);
            throw error;
        }
    }
    // Marketplace Contract Methods
    async listShares(agentTokenId, shareAmount, pricePerShare, duration) {
        try {
            const tx = await this.marketplaceContract.listShares(agentTokenId, shareAmount, ethers_1.utils.parseEther(pricePerShare), duration);
            const receipt = await tx.wait();
            const listEvent = receipt.events?.find(e => e.event === 'SharesListed');
            const listingId = listEvent?.args?.listingId?.toNumber();
            return {
                listingId,
                txHash: receipt.transactionHash
            };
        }
        catch (error) {
            this.logger.error('Failed to list shares:', error);
            throw error;
        }
    }
    async buyShares(listingId, totalPrice) {
        try {
            const tx = await this.marketplaceContract.buyShares(listingId, {
                value: ethers_1.utils.parseEther(totalPrice)
            });
            const receipt = await tx.wait();
            return receipt.transactionHash;
        }
        catch (error) {
            this.logger.error('Failed to buy shares:', error);
            throw error;
        }
    }
    async makeOffer(listingId, shareAmount, offerPrice) {
        try {
            const tx = await this.marketplaceContract.makeOffer(listingId, shareAmount, {
                value: ethers_1.utils.parseEther(offerPrice)
            });
            const receipt = await tx.wait();
            const offerEvent = receipt.events?.find(e => e.event === 'OfferMade');
            const offerId = offerEvent?.args?.offerId?.toNumber();
            return {
                offerId,
                txHash: receipt.transactionHash
            };
        }
        catch (error) {
            this.logger.error('Failed to make offer:', error);
            throw error;
        }
    }
    async acceptOffer(offerId) {
        try {
            const tx = await this.marketplaceContract.acceptOffer(offerId);
            const receipt = await tx.wait();
            return receipt.transactionHash;
        }
        catch (error) {
            this.logger.error('Failed to accept offer:', error);
            throw error;
        }
    }
    // Revenue Distributor Contract Methods
    async createRevenueStream(agentTokenId, streamName, tokenAddress, distributionThreshold) {
        try {
            const tx = await this.revenueDistributorContract.createRevenueStream(agentTokenId, streamName, tokenAddress, ethers_1.utils.parseEther(distributionThreshold));
            const receipt = await tx.wait();
            const streamEvent = receipt.events?.find(e => e.event === 'RevenueStreamCreated');
            const streamId = streamEvent?.args?.streamId?.toNumber();
            return {
                streamId,
                txHash: receipt.transactionHash
            };
        }
        catch (error) {
            this.logger.error('Failed to create revenue stream:', error);
            throw error;
        }
    }
    async addRevenue(streamId, amount, tokenAddress) {
        try {
            let tx;
            if (tokenAddress === ethers_1.constants.AddressZero || !tokenAddress) {
                // ETH payment
                tx = await this.revenueDistributorContract.addRevenue(streamId, ethers_1.utils.parseEther(amount), {
                    value: ethers_1.utils.parseEther(amount)
                });
            }
            else {
                // ERC20 token payment (would need approval first)
                tx = await this.revenueDistributorContract.addRevenue(streamId, ethers_1.utils.parseEther(amount));
            }
            const receipt = await tx.wait();
            return receipt.transactionHash;
        }
        catch (error) {
            this.logger.error('Failed to add revenue:', error);
            throw error;
        }
    }
    async distributeRevenue(streamId) {
        try {
            const tx = await this.revenueDistributorContract.distributeRevenue(streamId);
            const receipt = await tx.wait();
            const distributeEvent = receipt.events?.find(e => e.event === 'RevenueDistributed');
            const distributedAmount = distributeEvent?.args?.totalAmount?.toString();
            return {
                distributedAmount: ethers_1.utils.formatEther(distributedAmount || '0'),
                txHash: receipt.transactionHash
            };
        }
        catch (error) {
            this.logger.error('Failed to distribute revenue:', error);
            throw error;
        }
    }
    // Smart Account Factory Methods
    async createSmartAccount(ownerAddress, salt) {
        try {
            const tx = await this.smartAccountFactoryContract.createAccount(ownerAddress, salt);
            const receipt = await tx.wait();
            const accountEvent = receipt.events?.find(e => e.event === 'AccountCreated');
            const accountAddress = accountEvent?.args?.account;
            return {
                accountAddress,
                txHash: receipt.transactionHash
            };
        }
        catch (error) {
            this.logger.error('Failed to create smart account:', error);
            throw error;
        }
    }
    async getSmartAccountAddress(ownerAddress, salt) {
        try {
            return await this.smartAccountFactoryContract.getAddress(ownerAddress, salt);
        }
        catch (error) {
            this.logger.error('Failed to get smart account address:', error);
            throw error;
        }
    }
    // Utility Methods
    getContractAddresses() {
        return {
            agentNft: this.agentNftContract.address,
            marketplace: this.marketplaceContract.address,
            revenueDistributor: this.revenueDistributorContract.address,
            smartAccountFactory: this.smartAccountFactoryContract.address
        };
    }
    async getBlockNumber() {
        return await this.provider.getBlockNumber();
    }
    async getTransaction(txHash) {
        return await this.provider.getTransaction(txHash);
    }
    async getTransactionReceipt(txHash) {
        return await this.provider.getTransactionReceipt(txHash);
    }
};
exports.SmartContractService = SmartContractService;
exports.SmartContractService = SmartContractService = SmartContractService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], SmartContractService);
//# sourceMappingURL=smart-contract.service.js.map