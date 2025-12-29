import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import {
  agentNftRepository,
  agentNfts,
  db,
  drizzleAgentRepository,
  fractionalShareRepository,
  fractionalShares,
  marketplaceListings,
  revenueDistributionRepository,
  revenueStreamRepository,
} from '@the-new-fuse/database';
import { eq } from 'drizzle-orm';
import { Contract, ethers, JsonRpcProvider, Wallet, ZeroAddress } from 'ethers';

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
  private agentNftContract!: Contract;
  private marketplaceContract!: Contract;
  private revenueDistributorContract!: Contract;
  private provider!: JsonRpcProvider;
  private wallet!: Wallet;

  constructor() {
    this.initializeContracts();
  }

  // Contract ABIs - Production ready implementations
  private readonly AGENT_NFT_ABI = [
    'function mint(address to, string memory tokenURI) public returns (uint256)',
    'function setTokenURI(uint256 tokenId, string memory tokenURI) public',
    'function ownerOf(uint256 tokenId) public view returns (address)',
    'function getAgent(uint256 tokenId) public view returns (tuple(string name, string description, string agentType, string[] capabilities, uint256 shares, bool isFractionalized))',
    'function transferFractionalShare(uint256 tokenId, address from, address to, uint256 shareAmount) external',
    'function setMarketplaceAuthorization(address marketplace, bool authorized) external',
    'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
    'event FractionalShareTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 shareAmount)',
  ];

  private readonly MARKETPLACE_ABI = [
    'function listShares(uint256 agentTokenId, uint256 shareAmount, uint256 pricePerShare, uint256 duration) external returns (uint256)',
    'function buyShares(uint256 listingId) external payable',
    'function makeOffer(uint256 listingId, uint256 shareAmount) external payable returns (uint256)',
    'function acceptOffer(uint256 offerId) external',
    'function cancelListing(uint256 listingId) external',
    'function cancelOffer(uint256 offerId) external',
    'function getListing(uint256 listingId) public view returns (tuple(uint256 agentTokenId, address seller, uint256 shareAmount, uint256 pricePerShare, uint256 totalPrice, bool active, uint256 expiresAt))',
    'function getOffer(uint256 offerId) public view returns (tuple(uint256 listingId, address buyer, uint256 offerPrice, uint256 shareAmount, bool active, uint256 expiresAt))',
    'event SharesListed(uint256 indexed listingId, uint256 indexed agentTokenId, address indexed seller, uint256 shareAmount, uint256 pricePerShare)',
    'event SharesSold(uint256 indexed listingId, address indexed buyer, uint256 shareAmount, uint256 totalPrice)',
    'event OfferMade(uint256 indexed offerId, uint256 indexed listingId, address indexed buyer, uint256 offerPrice, uint256 shareAmount)',
    'event OfferAccepted(uint256 indexed offerId, address indexed seller, address indexed buyer, uint256 shareAmount, uint256 totalPrice)',
  ];

  private readonly REVENUE_DISTRIBUTOR_ABI = [
    'function createRevenueStream(uint256 agentTokenId, string memory streamName, address tokenAddress, uint256 distributionThreshold) external returns (uint256)',
    'function addRevenue(uint256 streamId, uint256 amount) external payable',
    'function distributeRevenue(uint256 streamId) external returns (uint256)',
    'function getRevenueStream(uint256 streamId) public view returns (tuple(uint256 agentTokenId, string streamName, address tokenAddress, uint256 totalRevenue, uint256 distributedRevenue, uint256 distributionThreshold, bool active))',
    'function claimRevenue(uint256 streamId, address recipient) external returns (uint256)',
    'event RevenueStreamCreated(uint256 indexed streamId, uint256 indexed agentTokenId, string streamName, address tokenAddress)',
    'event RevenueAdded(uint256 indexed streamId, uint256 amount)',
    'event RevenueDistributed(uint256 indexed streamId, uint256 totalAmount, uint256 recipientCount)',
  ];

  private initializeContracts() {
    try {
      const rpcUrl = process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
      this.provider = new JsonRpcProvider(rpcUrl);

      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }
      this.wallet = new Wallet(privateKey, this.provider);

      this.agentNftContract = new Contract(
        process.env.AGENT_NFT_CONTRACT_ADDRESS || ZeroAddress,
        this.AGENT_NFT_ABI,
        this.wallet
      );

      this.marketplaceContract = new Contract(
        process.env.MARKETPLACE_CONTRACT_ADDRESS || ZeroAddress,
        this.MARKETPLACE_ABI,
        this.wallet
      );

      this.revenueDistributorContract = new Contract(
        process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS || ZeroAddress,
        this.REVENUE_DISTRIBUTOR_ABI,
        this.wallet
      );

      this.logger.log('Smart contracts initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize smart contracts:', error);
    }
  }

  async mintAgentAsNft(data: MintAgentNftDto): Promise<any> {
    this.logger.log(`Minting agent ${data.agentId} as NFT for owner ${data.ownerAddress}`);

    // Check if agent exists using Drizzle
    const agent = await drizzleAgentRepository.findById(data.agentId);

    if (!agent) {
      throw new NotFoundException('Agent not found');
    }

    // Check if agent is already minted as NFT
    const existingNft = await agentNftRepository.findByAgentId(data.agentId);

    if (existingNft) {
      throw new BadRequestException('Agent is already minted as NFT');
    }

    try {
      // Validate inputs
      if (!ethers.isAddress(data.ownerAddress)) {
        throw new BadRequestException('Invalid owner address');
      }

      // Estimate gas before sending transaction
      const gasEstimate = await this.agentNftContract.mint.estimateGas(
        data.ownerAddress,
        data.metadataUri || `https://metadata.thenewfuse.com/agents/${data.agentId}`
      );

      // Add 20% buffer to gas estimate for safety
      const gasLimit = (BigInt(gasEstimate) * 120n) / 100n;

      // Get current gas price for production
      const gasPrice = (await this.provider.getFeeData()).gasPrice || 0n;
      const maxFeePerGas = (BigInt(gasPrice) * 120n) / 100n;

      // Mint NFT on blockchain
      const mintTx = await this.agentNftContract.mint(
        data.ownerAddress,
        data.metadataUri || `https://metadata.thenewfuse.com/agents/${data.agentId}`,
        {
          gasLimit,
          maxFeePerGas,
          maxPriorityFeePerGas: (BigInt(gasPrice) * 50n) / 100n,
        }
      );

      this.logger.log(`Transaction sent: ${mintTx.hash}`);

      // Wait for transaction confirmation
      const receipt = await mintTx.wait(1);

      if (receipt.status === 0) {
        throw new Error('Transaction failed during execution');
      }

      const transferEvent = receipt.logs?.find((log: any) => log.fragment?.name === 'Transfer');
      const tokenId = (transferEvent?.args as any)?.tokenId;

      if (!tokenId) {
        throw new Error('Failed to extract token ID from transaction');
      }

      this.logger.log(`Agent ${data.agentId} successfully minted as NFT with token ID: ${tokenId}`);

      // Store NFT information in database using Drizzle
      const agentNft = await agentNftRepository.create({
        agentId: data.agentId,
        tokenId: Number(tokenId),
        contractAddress: this.agentNftContract.target.toString(),
        smartAccountAddress: data.smartAccountAddress,
        metadataUri: data.metadataUri,
        isFractionalized: false,
        totalShares: 0,
      } as any);

      // Fetch full details
      const fullAgentNFT = await agentNftRepository.findFullDetailsByAgentId(data.agentId);

      this.logger.log(`Agent ${data.agentId} minted as NFT with token ID ${tokenId}`);
      return fullAgentNFT || agentNft;
    } catch (error: any) {
      this.logger.error('Failed to mint agent as NFT:', error);
      throw new BadRequestException('Failed to mint agent as NFT');
    }
  }

  async fractionalizeAgent(data: FractionalizeAgentDto): Promise<any> {
    this.logger.log(`Fractionalizing agent NFT ${data.agentNftId}`);

    const agentNft = await agentNftRepository.findById(data.agentNftId, true);

    if (!agentNft) {
      throw new NotFoundException('Agent NFT not found');
    }

    if (agentNft.isFractionalized) {
      throw new BadRequestException('Agent NFT is already fractionalized');
    }

    try {
      // Update NFT to fractionalized state using Drizzle
      const updatedNft = await agentNftRepository.update(agentNft.agentId, {
        isFractionalized: true,
        totalShares: data.totalShares,
      } as any);

      // Create initial fractional share for the owner using Drizzle
      await db.insert(fractionalShares).values({
        agentNFTId: data.agentNftId,
        ownerAddress: data.initialOwner,
        shareAmount: data.totalShares,
      } as any);

      this.logger.log(`Agent NFT ${data.agentNftId} fractionalized successfully`);
      return updatedNft;
    } catch (error) {
      this.logger.error('Failed to fractionalize agent NFT:', error);
      throw new BadRequestException('Failed to fractionalize agent NFT');
    }
  }

  async createRevenueStream(data: CreateRevenueStreamDto): Promise<any> {
    this.logger.log(`Creating revenue stream for agent NFT ${data.agentNftId}`);

    const agentNft = await agentNftRepository.findById(data.agentNftId);

    if (!agentNft) {
      throw new NotFoundException('Agent NFT not found');
    }

    const revenueStream = await revenueStreamRepository.create({
      agentNFTId: data.agentNftId,
      streamName: data.streamName,
      description: data.description,
      tokenAddress: data.tokenAddress,
      totalRevenue: '0',
      distributedRevenue: '0',
      distributionThreshold: data.distributionThreshold,
      isActive: true,
    } as any);

    this.logger.log(`Revenue stream created for agent NFT ${data.agentNftId}`);
    return revenueStream;
  }

  async distributeRevenue(data: DistributeRevenueDto): Promise<void> {
    this.logger.log(`Distributing revenue for stream ${data.revenueStreamId}`);

    const revenueStream = await revenueStreamRepository.findWithNftAndShares(data.revenueStreamId);

    if (!revenueStream) {
      throw new NotFoundException('Revenue stream not found');
    }

    if (!revenueStream.agentNFT || !revenueStream.agentNFT.isFractionalized) {
      throw new BadRequestException('Agent NFT is not fractionalized');
    }

    try {
      // Calculate distribution amounts
      const totalShares = BigInt(revenueStream.agentNFT.totalShares);
      const distributionAmount = ethers.toBigInt(data.amount);
      const distributions: Array<{ address: string; amount: string }> = [];

      const shares = revenueStream.agentNFT.fractionalShares || [];
      for (const share of shares) {
        const shareAmountBigInt = BigInt(share.shareAmount?.toString() || '0');
        const ownerAmount = (distributionAmount * shareAmountBigInt) / totalShares;

        distributions.push({
          address: share.ownerAddress,
          amount: ownerAmount.toString(),
        });
      }

      // Store distribution record using Drizzle
      await revenueDistributionRepository.create({
        revenueStreamId: data.revenueStreamId,
        txHash: data.txHash,
        totalAmount: data.amount,
        distributedTo: distributions,
        blockNumber: data.blockNumber,
      } as any);

      // Update revenue stream totals
      const currentTotal = BigInt(revenueStream.totalRevenue || '0');
      const currentDistributed = BigInt(revenueStream.distributedRevenue || '0');

      await revenueStreamRepository.update(data.revenueStreamId, {
        totalRevenue: (currentTotal + ethers.toBigInt(data.amount)).toString(),
        distributedRevenue: (currentDistributed + ethers.toBigInt(data.amount)).toString(),
      } as any);

      this.logger.log(`Revenue distributed successfully for stream ${data.revenueStreamId}`);
    } catch (error) {
      this.logger.error('Failed to distribute revenue:', error);
      throw new BadRequestException('Failed to distribute revenue');
    }
  }

  async getAgentNft(agentId: string): Promise<any | null> {
    return agentNftRepository.findFullDetailsByAgentId(agentId);
  }

  async getAgentNftByTokenId(tokenId: number): Promise<any | null> {
    // Find by tokenId using raw query
    const nft = await db.query.agentNfts.findFirst({
      where: eq(agentNfts.tokenId, tokenId),
      with: {
        agent: true,
      },
    });

    if (!nft) return null;

    return agentNftRepository.findFullDetailsByAgentId(nft.agentId);
  }

  async getUserFractionalShares(ownerAddress: string): Promise<any[]> {
    return fractionalShareRepository.findByAgentNftId(ownerAddress);
  }

  async getActiveMarketplaceListings(): Promise<any[]> {
    // Query using Drizzle
    const listings = await db.query.marketplaceListings.findMany({
      where: eq(marketplaceListings.status, 'ACTIVE'),
      with: {
        agentNFT: {
          with: {
            agent: true,
          },
        },
      },
    });

    return listings;
  }

  async updateAgentMetadata(agentId: string, metadataUri: string): Promise<any> {
    const agentNft = await agentNftRepository.findByAgentId(agentId);

    if (!agentNft) {
      throw new NotFoundException('Agent NFT not found');
    }

    // Update metadata URI on blockchain
    try {
      // Estimate gas
      const gasEstimate = await this.agentNftContract.setTokenURI.estimateGas(
        agentNft.tokenId,
        metadataUri
      );
      const gasLimit = (BigInt(gasEstimate) * 120n) / 100n;

      // Get current gas price
      const gasPrice = (await this.provider.getFeeData()).gasPrice || 0n;
      const maxFeePerGas = (BigInt(gasPrice) * 120n) / 100n;

      // Send transaction
      const updateTx = await this.agentNftContract.setTokenURI(agentNft.tokenId, metadataUri, {
        gasLimit,
        maxFeePerGas,
        maxPriorityFeePerGas: (BigInt(gasPrice) * 50n) / 100n,
      });

      this.logger.log(`Metadata update transaction sent: ${updateTx.hash}`);

      // Wait for confirmation
      const receipt = await updateTx.wait(1);

      if (receipt.status === 0) {
        throw new Error('Metadata update transaction failed');
      }

      this.logger.log(
        `Metadata successfully updated for agent ${agentId} (tokenId: ${agentNft.tokenId})`
      );

      // Update database using Drizzle
      return agentNftRepository.update(agentId, { metadataUri } as any);
    } catch (error: any) {
      this.logger.error(`Failed to update agent metadata for ${agentId}:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.message?.includes('execution reverted')) {
        throw new BadRequestException(
          'Smart contract execution failed. Check token ownership and permissions.'
        );
      }

      throw new BadRequestException(`Failed to update agent metadata: ${error.message}`);
    }
  }
}
