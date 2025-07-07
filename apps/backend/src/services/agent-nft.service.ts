import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentNFT, FractionalShare, RevenueStream, MarketplaceListing } from '@prisma/client';
import { ethers, BigNumber } from 'ethers';

export interface MintAgentNftDto {
  agentId: string;
  ownerAddress: string;
  smartAccountAddress?: string;
  metadataUri?: string;
}

export interface FractionalizeAgentDto {
  agentNftId: string;
  totalShares: number;
  initialOwner: string;
}

export interface CreateRevenueStreamDto {
  agentNftId: string;
  streamName: string;
  description?: string;
  tokenAddress: string;
  distributionThreshold: string;
}

export interface DistributeRevenueDto {
  revenueStreamId: string;
  amount: string;
  txHash: string;
  blockNumber: number;
}

@Injectable()
export class AgentNftService {
  private readonly logger = new Logger(AgentNftService.name);
  private agentNftContract: ethers.Contract;
  private marketplaceContract: ethers.Contract;
  private revenueDistributorContract: ethers.Contract;
  private provider: ethers.Provider;
  private wallet: ethers.Wallet;

  constructor(private readonly prisma: PrismaService) {
    this.initializeContracts();
  }

  private initializeContracts() {
    try {
      // Initialize provider
      this.provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
      
      // Initialize wallet
      this.wallet = new ethers.Wallet(process.env.PRIVATE_KEY, this.provider);
      
      // Initialize contracts
      this.agentNftContract = new ethers.Contract(
        process.env.AGENT_NFT_CONTRACT_ADDRESS,
        [], // Contract ABI would go here
        this.wallet
      );
      
      this.marketplaceContract = new ethers.Contract(
        process.env.MARKETPLACE_CONTRACT_ADDRESS,
        [], // Contract ABI would go here
        this.wallet
      );
      
      this.revenueDistributorContract = new ethers.Contract(
        process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS,
        [], // Contract ABI would go here
        this.wallet
      );
      
      this.logger.log('Smart contracts initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize smart contracts:', error);
    }
  }

  async mintAgentAsNft(data: MintAgentNftDto): Promise<AgentNFT> {
    this.logger.log(`Minting agent ${data.agentId} as NFT for owner ${data.ownerAddress}`);

    // Check if agent exists
    const agent = await this.prisma.agent.findUnique({
      where: { id: data.agentId }
    });

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Check if agent is already minted as NFT
    const existingNft = await this.prisma.agentNFT.findUnique({
      where: { agentId: data.agentId }
    });

    if (existingNft) {
      throw new BadRequestException('Agent is already minted as NFT');
    }

    try {
      // Mint NFT on blockchain
      const mintTx = await this.agentNftContract.mint(
        data.ownerAddress,
        data.metadataUri || `https://metadata.thenewfuse.com/agents/${data.agentId}`
      );
      
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
    } catch (error) {
      this.logger.error('Failed to mint agent as NFT:', error);
      throw new BadRequestException('Failed to mint agent as NFT');
    }
  }

  async fractionalizeAgent(data: FractionalizeAgentDto): Promise<AgentNFT> {
    this.logger.log(`Fractionalizing agent NFT ${data.agentNftId}`);

    const agentNft = await this.prisma.agentNFT.findUnique({
      where: { id: data.agentNftId },
      include: { agent: true }
    });

    if (!agentNft) {
      throw new NotFoundException('Agent NFT not found');
    }

    if (agentNft.isFractionalized) {
      throw new BadRequestException('Agent NFT is already fractionalized');
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
    } catch (error) {
      this.logger.error('Failed to fractionalize agent NFT:', error);
      throw new BadRequestException('Failed to fractionalize agent NFT');
    }
  }

  async createRevenueStream(data: CreateRevenueStreamDto): Promise<RevenueStream> {
    this.logger.log(`Creating revenue stream for agent NFT ${data.agentNftId}`);

    const agentNft = await this.prisma.agentNFT.findUnique({
      where: { id: data.agentNftId }
    });

    if (!agentNft) {
      throw new NotFoundException('Agent NFT not found');
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

  async distributeRevenue(data: DistributeRevenueDto): Promise<void> {
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
      throw new NotFoundException('Revenue stream not found');
    }

    if (!revenueStream.agentNFT.isFractionalized) {
      throw new BadRequestException('Agent NFT is not fractionalized');
    }

    try {
      // Calculate distribution amounts
      const totalShares = revenueStream.agentNFT.totalShares;
      const distributionAmount = ethers.BigNumber.from(data.amount);
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
    } catch (error) {
      this.logger.error('Failed to distribute revenue:', error);
      throw new BadRequestException('Failed to distribute revenue');
    }
  }

  async getAgentNft(agentId: string): Promise<AgentNFT | null> {
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

  async getAgentNftByTokenId(tokenId: number): Promise<AgentNFT | null> {
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

  async getUserFractionalShares(ownerAddress: string): Promise<FractionalShare[]> {
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

  async getActiveMarketplaceListings(): Promise<MarketplaceListing[]> {
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

  async updateAgentMetadata(agentId: string, metadataUri: string): Promise<AgentNFT> {
    const agentNft = await this.prisma.agentNFT.findUnique({
      where: { agentId }
    });

    if (!agentNft) {
      throw new NotFoundException('Agent NFT not found');
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
    } catch (error) {
      this.logger.error('Failed to update agent metadata:', error);
      throw new BadRequestException('Failed to update agent metadata');
    }
  }
}