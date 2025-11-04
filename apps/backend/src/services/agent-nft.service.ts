import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AgentNFT, FractionalShare, RevenueStream, MarketplaceListing } from '@the-new-fuse/database/generated/prisma';
import { ethers, providers } from 'ethers';

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
  private provider: providers.JsonRpcProvider;
  private wallet: ethers.Wallet;

  constructor(private readonly prisma: PrismaService) {
    this.initializeContracts();
  }

  // Contract ABIs - Production ready implementations
  private readonly AGENT_NFT_ABI = [
    "function mint(address to, string memory tokenURI) public returns (uint256)",
    "function setTokenURI(uint256 tokenId, string memory tokenURI) public",
    "function ownerOf(uint256 tokenId) public view returns (address)",
    "function getAgent(uint256 tokenId) public view returns (tuple(string name, string description, string agentType, string[] capabilities, uint256 shares, bool isFractionalized))",
    "function transferFractionalShare(uint256 tokenId, address from, address to, uint256 shareAmount) external",
    "function setMarketplaceAuthorization(address marketplace, bool authorized) external",
    "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
    "event FractionalShareTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 shareAmount)"
  ];

  private readonly MARKETPLACE_ABI = [
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

  private readonly REVENUE_DISTRIBUTOR_ABI = [
    "function createRevenueStream(uint256 agentTokenId, string memory streamName, address tokenAddress, uint256 distributionThreshold) external returns (uint256)",
    "function addRevenue(uint256 streamId, uint256 amount) external payable",
    "function distributeRevenue(uint256 streamId) external returns (uint256)",
    "function getRevenueStream(uint256 streamId) public view returns (tuple(uint256 agentTokenId, string streamName, address tokenAddress, uint256 totalRevenue, uint256 distributedRevenue, uint256 distributionThreshold, bool active))",
    "function claimRevenue(uint256 streamId, address recipient) external returns (uint256)",
    "event RevenueStreamCreated(uint256 indexed streamId, uint256 indexed agentTokenId, string streamName, address tokenAddress)",
    "event RevenueAdded(uint256 indexed streamId, uint256 amount)",
    "event RevenueDistributed(uint256 indexed streamId, uint256 totalAmount, uint256 recipientCount)"
  ];

  private initializeContracts() {
    try {
      const rpcUrl = process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
      this.provider = new providers.JsonRpcProvider(rpcUrl);
      
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }
      this.wallet = new ethers.Wallet(privateKey, this.provider);
      
      this.agentNftContract = new ethers.Contract(
        process.env.AGENT_NFT_CONTRACT_ADDRESS || ethers.constants.AddressZero,
        this.AGENT_NFT_ABI,
        this.wallet
      );
      
      this.marketplaceContract = new ethers.Contract(
        process.env.MARKETPLACE_CONTRACT_ADDRESS || ethers.constants.AddressZero,
        this.MARKETPLACE_ABI,
        this.wallet
      );
      
      this.revenueDistributorContract = new ethers.Contract(
        process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS || ethers.constants.AddressZero,
        this.REVENUE_DISTRIBUTOR_ABI,
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
      // Validate inputs
      if (!ethers.utils.isAddress(data.ownerAddress)) {
        throw new BadRequestException('Invalid owner address');
      }
      
      if (data.metadataUri && !ethers.utils.isValidURI(data.metadataUri)) {
        throw new BadRequestException('Invalid metadata URI');
      }

      // Estimate gas before sending transaction
      const gasEstimate = await this.agentNftContract.estimateGas.mint(
        data.ownerAddress,
        data.metadataUri || `https://metadata.thenewfuse.com/agents/${data.agentId}`
      );
      
      // Add 20% buffer to gas estimate for safety
      const gasLimit = gasEstimate.mul(120).div(100);
      
      // Get current gas price for production
      const gasPrice = await this.provider.getGasPrice();
      const maxFeePerGas = gasPrice.mul(120).div(100); // 20% increase for priority
      
      // Mint NFT on blockchain with proper error handling
      const mintTx = await this.agentNftContract.mint(
        data.ownerAddress,
        data.metadataUri || `https://metadata.thenewfuse.com/agents/${data.agentId}`,
        {
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.mul(50).div(100) // 50% of base gas price as priority
        }
      );
      
      this.logger.log(`Transaction sent: ${mintTx.hash}`);
      
      // Wait for transaction confirmation with timeout
      const receipt = await mintTx.wait(1); // Wait for 1 confirmation
      
      if (receipt.status === 0) {
        throw new Error('Transaction failed during execution');
      }
      
      const transferEvent = receipt.events?.find(e => e.event === 'Transfer');
      const tokenId = transferEvent?.args?.tokenId;

      if (!tokenId) {
        throw new Error('Failed to extract token ID from transaction');
      }
      
      this.logger.log(`Agent ${data.agentId} successfully minted as NFT with token ID: ${tokenId}`);

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
      if (!ethers.utils.isValidURI(metadataUri)) {
        throw new BadRequestException('Invalid metadata URI format');
      }

      // Estimate gas
      const gasEstimate = await this.agentNftContract.estimateGas.setTokenURI(
        agentNft.tokenId,
        metadataUri
      );
      const gasLimit = gasEstimate.mul(120).div(100); // 20% buffer

      // Get current gas price
      const gasPrice = await this.provider.getGasPrice();
      const maxFeePerGas = gasPrice.mul(120).div(100);

      // Send transaction with proper error handling
      const updateTx = await this.agentNftContract.setTokenURI(
        agentNft.tokenId,
        metadataUri,
        {
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas: gasPrice.mul(50).div(100)
        }
      );

      this.logger.log(`Metadata update transaction sent: ${updateTx.hash}`);

      // Wait for confirmation
      const receipt = await updateTx.wait(1);
      
      if (receipt.status === 0) {
        throw new Error('Metadata update transaction failed');
      }

      this.logger.log(`Metadata successfully updated for agent ${agentId} (tokenId: ${agentNft.tokenId})`);

      // Update database
      return this.prisma.agentNFT.update({
        where: { agentId },
        data: { metadataUri }
      });
    } catch (error) {
      this.logger.error(`Failed to update agent metadata for ${agentId}:`, error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      if (error.message?.includes('execution reverted')) {
        throw new BadRequestException('Smart contract execution failed. Check token ownership and permissions.');
      }
      
      throw new BadRequestException(`Failed to update agent metadata: ${error.message}`);
    }
  }
}