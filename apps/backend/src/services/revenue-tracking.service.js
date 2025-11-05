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
var RevenueTrackingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RevenueTrackingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const smart_contract_service_1 = require("./smart-contract.service");
const schedule_1 = require("@nestjs/schedule");
const ethers_1 = require("ethers");
let RevenueTrackingService = RevenueTrackingService_1 = class RevenueTrackingService {
    prisma;
    smartContractService;
    logger = new common_1.Logger(RevenueTrackingService_1.name);
    constructor(prisma, smartContractService) {
        this.prisma = prisma;
        this.smartContractService = smartContractService;
    }
    async trackRevenue(data) {
        this.logger.log(`Tracking revenue for agent ${data.agentId}: ${data.amount} ${data.tokenAddress}`);
        try {
            // Find the agent NFT
            const agentNft = await this.prisma.agentNFT.findUnique({
                where: { agentId: data.agentId },
                include: {
                    revenueStreams: {
                        where: {
                            isActive: true,
                            tokenAddress: data.tokenAddress
                        }
                    }
                }
            });
            if (!agentNft) {
                this.logger.warn(`Agent NFT not found for agent ${data.agentId}`);
                return;
            }
            // Find or create revenue stream
            let revenueStream = agentNft.revenueStreams.find(stream => stream.tokenAddress.toLowerCase() === data.tokenAddress.toLowerCase());
            if (!revenueStream) {
                revenueStream = await this.prisma.revenueStream.create({
                    data: {
                        agentNFTId: agentNft.id,
                        streamName: `${data.source} Revenue`,
                        tokenAddress: data.tokenAddress,
                        totalRevenue: '0',
                        distributionThreshold: ethers_1.utils.parseEther('0.1').toString(), // Default threshold
                    }
                });
            }
            // Update revenue stream
            await this.prisma.revenueStream.update({
                where: { id: revenueStream.id },
                data: {
                    totalRevenue: {
                        increment: data.amount
                    }
                }
            });
            // Add revenue to smart contract if it's an active NFT
            if (agentNft.isFractionalized) {
                try {
                    await this.smartContractService.addRevenue(parseInt(revenueStream.id), // This would need to be the on-chain stream ID
                    ethers_1.utils.formatEther(data.amount), data.tokenAddress);
                }
                catch (error) {
                    this.logger.error('Failed to add revenue to smart contract:', error);
                }
            }
            // Check if we should trigger automatic distribution
            await this.checkAndTriggerDistribution(revenueStream.id);
            this.logger.log(`Revenue tracked successfully for agent ${data.agentId}`);
        }
        catch (error) {
            this.logger.error('Failed to track revenue:', error);
            throw error;
        }
    }
    async checkAndTriggerDistribution(revenueStreamId) {
        try {
            const revenueStream = await this.prisma.revenueStream.findUnique({
                where: { id: revenueStreamId },
                include: {
                    agentNFT: {
                        include: {
                            fractionalShares: true
                        }
                    }
                }
            });
            if (!revenueStream || !revenueStream.isActive || !revenueStream.agentNFT.isFractionalized) {
                return;
            }
            const totalRevenue = ethers_1.utils.parseEther(revenueStream.totalRevenue);
            const distributedRevenue = ethers_1.utils.parseEther(revenueStream.distributedRevenue);
            const pendingRevenue = totalRevenue - distributedRevenue;
            const distributionThreshold = ethers_1.utils.parseEther(revenueStream.distributionThreshold);
            if (pendingRevenue >= distributionThreshold) {
                this.logger.log(`Triggering automatic distribution for stream ${revenueStreamId}`);
                await this.distributeRevenue(revenueStreamId);
            }
        }
        catch (error) {
            this.logger.error('Failed to check distribution trigger:', error);
        }
    }
    async distributeRevenue(revenueStreamId) {
        this.logger.log(`Distributing revenue for stream ${revenueStreamId}`);
        try {
            const revenueStream = await this.prisma.revenueStream.findUnique({
                where: { id: revenueStreamId },
                include: {
                    agentNFT: {
                        include: {
                            fractionalShares: true
                        }
                    }
                }
            });
            if (!revenueStream || !revenueStream.agentNFT.isFractionalized) {
                throw new Error('Revenue stream not found or not fractionalized');
            }
            const totalRevenue = ethers_1.utils.parseEther(revenueStream.totalRevenue);
            const distributedRevenue = ethers_1.utils.parseEther(revenueStream.distributedRevenue);
            const pendingRevenue = totalRevenue - distributedRevenue;
            if (pendingRevenue <= 0) {
                throw new Error('No pending revenue to distribute');
            }
            // Calculate distribution amounts
            const totalShares = revenueStream.agentNFT.fractionalShares
                .reduce((sum, share) => sum + share.shareAmount, 0);
            const recipients = revenueStream.agentNFT.fractionalShares.map(share => {
                const sharePercentage = share.shareAmount / totalShares;
                const amount = (pendingRevenue * BigInt(share.shareAmount)) / BigInt(totalShares);
                return {
                    address: share.ownerAddress,
                    amount: amount.toString(),
                    sharePercentage: sharePercentage * 100
                };
            });
            // Distribute revenue through smart contract
            const { distributedAmount, txHash } = await this.smartContractService.distributeRevenue(parseInt(revenueStreamId) // This would need to be the on-chain stream ID
            );
            const blockNumber = await this.smartContractService.getBlockNumber();
            // Record the distribution in database
            await this.prisma.revenueDistribution.create({
                data: {
                    revenueStreamId,
                    txHash,
                    totalAmount: pendingRevenue.toString(),
                    distributedTo: recipients.map(r => ({ address: r.address, amount: r.amount })),
                    blockNumber,
                }
            });
            // Update revenue stream
            await this.prisma.revenueStream.update({
                where: { id: revenueStreamId },
                data: {
                    distributedRevenue: totalRevenue.toString()
                }
            });
            const result = {
                streamId: revenueStreamId,
                totalAmount: pendingRevenue.toString(),
                recipients,
                txHash,
                blockNumber
            };
            this.logger.log(`Revenue distributed successfully: ${ethers_1.utils.formatEther(pendingRevenue)} ETH to ${recipients.length} recipients`);
            return result;
        }
        catch (error) {
            this.logger.error('Failed to distribute revenue:', error);
            throw error;
        }
    }
    // Automated revenue tracking from blockchain events
    async scanForRevenueEvents() {
        this.logger.log('Scanning for revenue events...');
        try {
            // Get the latest block we've processed
            const lastProcessedBlock = await this.getLastProcessedBlock();
            const currentBlock = await this.smartContractService.getBlockNumber();
            if (currentBlock <= lastProcessedBlock) {
                return;
            }
            // Scan for revenue events in the new blocks
            await this.processRevenueEvents(lastProcessedBlock + 1, currentBlock);
            // Update the last processed block
            await this.updateLastProcessedBlock(currentBlock);
            this.logger.log(`Processed blocks ${lastProcessedBlock + 1} to ${currentBlock}`);
        }
        catch (error) {
            this.logger.error('Failed to scan for revenue events:', error);
        }
    }
    async processRevenueEvents(fromBlock, toBlock) {
        // This would scan smart contract events for revenue additions
        // For now, we'll implement a placeholder that could be extended
        try {
            // Example: Listen for task completion events, marketplace sales, etc.
            // These would trigger revenue tracking
            // Mock revenue event for demonstration
            const mockRevenueEvents = await this.getMockRevenueEvents(fromBlock, toBlock);
            for (const event of mockRevenueEvents) {
                await this.trackRevenue(event);
            }
        }
        catch (error) {
            this.logger.error('Failed to process revenue events:', error);
        }
    }
    async getMockRevenueEvents(fromBlock, toBlock) {
        // This is a mock implementation - in reality, you'd scan blockchain events
        // or integrate with external systems that generate revenue
        return [];
    }
    async getLastProcessedBlock() {
        // This would be stored in a configuration table or cache
        return parseInt(process.env.LAST_PROCESSED_BLOCK || '0');
    }
    async updateLastProcessedBlock(blockNumber) {
        // Update the last processed block in storage
        process.env.LAST_PROCESSED_BLOCK = blockNumber.toString();
    }
    // Manual revenue distribution check
    async checkPendingDistributions() {
        this.logger.log('Checking for pending revenue distributions...');
        try {
            const pendingStreams = await this.prisma.revenueStream.findMany({
                where: {
                    isActive: true,
                    agentNFT: {
                        isFractionalized: true
                    }
                },
                include: {
                    agentNFT: {
                        include: {
                            fractionalShares: true
                        }
                    }
                }
            });
            for (const stream of pendingStreams) {
                await this.checkAndTriggerDistribution(stream.id);
            }
            this.logger.log(`Checked ${pendingStreams.length} revenue streams for pending distributions`);
        }
        catch (error) {
            this.logger.error('Failed to check pending distributions:', error);
        }
    }
    // Analytics and reporting methods
    async getRevenueAnalytics(agentNftId, timeframe = 'month') {
        try {
            const startDate = this.getStartDate(timeframe);
            const revenueStreams = await this.prisma.revenueStream.findMany({
                where: {
                    agentNFTId: agentNftId,
                    createdAt: {
                        gte: startDate
                    }
                },
                include: {
                    distributions: {
                        where: {
                            createdAt: {
                                gte: startDate
                            }
                        }
                    }
                }
            });
            const totalRevenue = revenueStreams.reduce((sum, stream) => sum + parseFloat(ethers_1.utils.formatEther(stream.totalRevenue || '0')), 0);
            const totalDistributed = revenueStreams.reduce((sum, stream) => sum + parseFloat(ethers_1.utils.formatEther(stream.distributedRevenue || '0')), 0);
            const distributionCount = revenueStreams.reduce((sum, stream) => sum + stream.distributions.length, 0);
            return {
                timeframe,
                startDate,
                totalRevenue,
                totalDistributed,
                pendingRevenue: totalRevenue - totalDistributed,
                distributionCount,
                averageDistribution: distributionCount > 0 ? totalDistributed / distributionCount : 0,
                streams: revenueStreams.length
            };
        }
        catch (error) {
            this.logger.error('Failed to get revenue analytics:', error);
            throw error;
        }
    }
    getStartDate(timeframe) {
        const now = new Date();
        switch (timeframe) {
            case 'day':
                return new Date(now.getTime() - 24 * 60 * 60 * 1000);
            case 'week':
                return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            case 'month':
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            case 'year':
                return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            default:
                return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
    }
};
exports.RevenueTrackingService = RevenueTrackingService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_5_MINUTES),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RevenueTrackingService.prototype, "scanForRevenueEvents", null);
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], RevenueTrackingService.prototype, "checkPendingDistributions", null);
exports.RevenueTrackingService = RevenueTrackingService = RevenueTrackingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        smart_contract_service_1.SmartContractService])
], RevenueTrackingService);
//# sourceMappingURL=revenue-tracking.service.js.map