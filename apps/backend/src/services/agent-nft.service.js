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
var AgentNftService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentNftService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const ethers_1 = require("ethers");
let AgentNftService = AgentNftService_1 = class AgentNftService {
    prisma;
    logger = new common_1.Logger(AgentNftService_1.name);
    agentNftContract;
    marketplaceContract;
    revenueDistributorContract;
    provider;
    wallet;
    constructor(prisma) {
        this.prisma = prisma;
        this.initializeContracts();
    }
    initializeContracts() {
        try {
            // Initialize provider
            this.provider = new ethers_1.providers.JsonRpcProvider(process.env.RPC_URL);
            // Initialize wallet
            this.wallet = new ethers_1.ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
            // Initialize contracts
            this.agentNftContract = new ethers_1.ethers.Contract(process.env.AGENT_NFT_CONTRACT_ADDRESS, [], // Contract ABI would go here
            this.wallet);
            this.marketplaceContract = new ethers_1.ethers.Contract(process.env.MARKETPLACE_CONTRACT_ADDRESS, [], // Contract ABI would go here
            this.wallet);
            this.revenueDistributorContract = new ethers_1.ethers.Contract(process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS, [], // Contract ABI would go here
            this.wallet);
            this.logger.log('Smart contracts initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize smart contracts:', error);
        }
    }
    async mintAgentAsNft(data) {
        this.logger.log(`Minting agent ${data.agentId} as NFT for owner ${data.ownerAddress}`);
        // Check if agent exists
        const agent = await this.prisma.agent.findUnique({
            where: { id: data.agentId }
        });
        if (!agent) {
            throw new common_1.NotFoundException('Agent not found');
        }
        // Check if agent is already minted as NFT
        const existingNft = await this.prisma.agentNFT.findUnique({
            where: { agentId: data.agentId }
        });
        if (existingNft) {
            throw new common_1.BadRequestException('Agent is already minted as NFT');
        }
        try {
            // Mint NFT on blockchain
            const mintTx = await this.agentNftContract.mint(data.ownerAddress, data.metadataUri || `https://metadata.thenewfuse.com/agents/${data.agentId}`);
            const receipt = await mintTx.wait();
            const tokenId = receipt.events.find(e => e.event === 'Transfer')?.args?.tokenId;
            if (!tokenId) {
                throw new Error('Failed to extract token ID from transaction');
            }
            // Store NFT information in database
            const agentNft = await this.prisma.agentNFT.create({
                data: {
                    agentId: data.agentId,
                    tokenId: tokenId.toNumber(),
                    contractAddress: this.agentNftContract.address,
                    smartAccountAddress: data.smartAccountAddress,
                    metadataUri: data.metadataUri,
                },
                include: {
                    agent: true
                }
            });
            this.logger.log(`Agent ${data.agentId} minted as NFT with token ID ${tokenId}`);
            return agentNft;
        }
        catch (error) {
            this.logger.error('Failed to mint agent as NFT:', error);
            throw new common_1.BadRequestException('Failed to mint agent as NFT');
        }
    }
    async fractionalizeAgent(data) {
        this.logger.log(`Fractionalizing agent NFT ${data.agentNftId}`);
        const agentNft = await this.prisma.agentNFT.findUnique({
            where: { id: data.agentNftId },
            include: { agent: true }
        });
        if (!agentNft) {
            throw new common_1.NotFoundException('Agent NFT not found');
        }
        if (agentNft.isFractionalized) {
            throw new common_1.BadRequestException('Agent NFT is already fractionalized');
        }
        try {
            // Update NFT to fractionalized state
            const updatedNft = await this.prisma.agentNFT.update({
                where: { id: data.agentNftId },
                data: {
                    isFractionalized: true,
                    totalShares: data.totalShares,
                }
            });
            // Create initial fractional share for the owner
            await this.prisma.fractionalShare.create({
                data: {
                    agentNFTId: data.agentNftId,
                    ownerAddress: data.initialOwner,
                    shareAmount: data.totalShares, // Initially, owner owns all shares
                }
            });
            this.logger.log(`Agent NFT ${data.agentNftId} fractionalized successfully`);
            return updatedNft;
        }
        catch (error) {
            this.logger.error('Failed to fractionalize agent NFT:', error);
            throw new common_1.BadRequestException('Failed to fractionalize agent NFT');
        }
    }
    async createRevenueStream(data) {
        this.logger.log(`Creating revenue stream for agent NFT ${data.agentNftId}`);
        const agentNft = await this.prisma.agentNFT.findUnique({
            where: { id: data.agentNftId }
        });
        if (!agentNft) {
            throw new common_1.NotFoundException('Agent NFT not found');
        }
        const revenueStream = await this.prisma.revenueStream.create({
            data: {
                agentNFTId: data.agentNftId,
                streamName: data.streamName,
                description: data.description,
                tokenAddress: data.tokenAddress,
                totalRevenue: '0',
                distributionThreshold: data.distributionThreshold,
            }
        });
        this.logger.log(`Revenue stream created for agent NFT ${data.agentNftId}`);
        return revenueStream;
    }
    async distributeRevenue(data) {
        this.logger.log(`Distributing revenue for stream ${data.revenueStreamId}`);
        const revenueStream = await this.prisma.revenueStream.findUnique({
            where: { id: data.revenueStreamId },
            include: {
                agentNFT: {
                    include: {
                        fractionalShares: true
                    }
                }
            }
        });
        if (!revenueStream) {
            throw new common_1.NotFoundException('Revenue stream not found');
        }
        if (!revenueStream.agentNFT.isFractionalized) {
            throw new common_1.BadRequestException('Agent NFT is not fractionalized');
        }
        try {
            // Calculate distribution amounts
            const totalShares = revenueStream.agentNFT.totalShares;
            const distributionAmount = ethers_1.ethers.BigNumber.from(data.amount);
            const distributions = [];
            for (const share of revenueStream.agentNFT.fractionalShares) {
                const sharePercentage = share.shareAmount / totalShares;
                const ownerAmount = distributionAmount.mul(share.shareAmount).div(totalShares);
                distributions.push({
                    address: share.ownerAddress,
                    amount: ownerAmount.toString()
                });
            }
            // Store distribution record
            await this.prisma.revenueDistribution.create({
                data: {
                    revenueStreamId: data.revenueStreamId,
                    txHash: data.txHash,
                    totalAmount: data.amount,
                    distributedTo: distributions,
                    blockNumber: data.blockNumber,
                }
            });
            // Update revenue stream totals
            await this.prisma.revenueStream.update({
                where: { id: data.revenueStreamId },
                data: {
                    totalRevenue: {
                        increment: data.amount
                    },
                    distributedRevenue: {
                        increment: data.amount
                    }
                }
            });
            this.logger.log(`Revenue distributed successfully for stream ${data.revenueStreamId}`);
        }
        catch (error) {
            this.logger.error('Failed to distribute revenue:', error);
            throw new common_1.BadRequestException('Failed to distribute revenue');
        }
    }
    async getAgentNft(agentId) {
        return this.prisma.agentNFT.findUnique({
            where: { agentId },
            include: {
                agent: true,
                fractionalShares: true,
                revenueStreams: {
                    include: {
                        distributions: true
                    }
                },
                marketplaceListings: {
                    where: { status: 'ACTIVE' },
                    include: {
                        offers: {
                            where: { status: 'ACTIVE' }
                        }
                    }
                }
            }
        });
    }
    async getAgentNftByTokenId(tokenId) {
        return this.prisma.agentNFT.findUnique({
            where: { tokenId },
            include: {
                agent: true,
                fractionalShares: true,
                revenueStreams: true,
                marketplaceListings: true
            }
        });
    }
    async getUserFractionalShares(ownerAddress) {
        return this.prisma.fractionalShare.findMany({
            where: { ownerAddress },
            include: {
                agentNFT: {
                    include: {
                        agent: true
                    }
                }
            }
        });
    }
    async getActiveMarketplaceListings() {
        return this.prisma.marketplaceListing.findMany({
            where: { status: 'ACTIVE' },
            include: {
                agentNFT: {
                    include: {
                        agent: true
                    }
                },
                offers: {
                    where: { status: 'ACTIVE' }
                }
            }
        });
    }
    async updateAgentMetadata(agentId, metadataUri) {
        const agentNft = await this.prisma.agentNFT.findUnique({
            where: { agentId }
        });
        if (!agentNft) {
            throw new common_1.NotFoundException('Agent NFT not found');
        }
        // Update metadata URI on blockchain
        try {
            const updateTx = await this.agentNftContract.setTokenURI(agentNft.tokenId, metadataUri);
            await updateTx.wait();
            // Update database
            return this.prisma.agentNFT.update({
                where: { agentId },
                data: { metadataUri }
            });
        }
        catch (error) {
            this.logger.error('Failed to update agent metadata:', error);
            throw new common_1.BadRequestException('Failed to update agent metadata');
        }
    }
};
exports.AgentNftService = AgentNftService;
exports.AgentNftService = AgentNftService = AgentNftService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], AgentNftService);
//# sourceMappingURL=agent-nft.service.js.map