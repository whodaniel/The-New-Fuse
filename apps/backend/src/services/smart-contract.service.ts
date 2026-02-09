import { Injectable, Logger } from '@nestjs/common';
import { ethers, JsonRpcProvider, ZeroAddress, Contract, Wallet, BigNumberish, formatEther, parseEther, EventFragment, getAddress } from 'ethers';

// Contract ABIs (would normally be imported from compiled contracts)
export const AGENT_NFT_ABI = [
  "function mint(address to, string memory tokenURI) public returns (uint256)",
  "function setTokenURI(uint256 tokenId, string memory tokenURI) public",
  "function ownerOf(uint256 tokenId) public view returns (address)",
  "function getAgent(uint256 tokenId) public view returns (tuple(string name, string description, string agentType, string[] capabilities, uint256 shares, bool isFractionalized))",
  "function transferFractionalShare(uint256 tokenId, address from, address to, uint256 shareAmount) external",
  "function setMarketplaceAuthorization(address marketplace, bool authorized) external",
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event FractionalShareTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 shareAmount)"
];

export const MARKETPLACE_ABI = [
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

export const REVENUE_DISTRIBUTOR_ABI = [
  "function createRevenueStream(uint256 agentTokenId, string memory streamName, address tokenAddress, uint256 distributionThreshold) external returns (uint256)",
  "function addRevenue(uint256 streamId, uint256 amount) external payable",
  "function distributeRevenue(uint256 streamId) external returns (uint256)",
  "function getRevenueStream(uint256 streamId) public view returns (tuple(uint256 agentTokenId, string streamName, address tokenAddress, uint256 totalRevenue, uint256 distributedRevenue, uint256 distributionThreshold, bool active))",
  "function claimRevenue(uint256 streamId, address recipient) external returns (uint256)",
  "event RevenueStreamCreated(uint256 indexed streamId, uint256 indexed agentTokenId, string streamName, address tokenAddress)",
  "event RevenueAdded(uint256 indexed streamId, uint256 amount)",
  "event RevenueDistributed(uint256 indexed streamId, uint256 totalAmount, uint256 recipientCount)"
];

export const SMART_ACCOUNT_FACTORY_ABI = [
  "function createAccount(address owner, uint256 salt) external returns (address)",
  "function getAddress(address owner, uint256 salt) public view returns (address)",
  "event AccountCreated(address indexed account, address indexed owner, uint256 salt)"
];

@Injectable()
export class SmartContractService {
  private readonly logger = new Logger(SmartContractService.name);
  private provider!: JsonRpcProvider;
  private wallet!: Wallet;
  private agentNftContract!: Contract;
  private marketplaceContract!: Contract;
  private revenueDistributorContract!: Contract;
  private smartAccountFactoryContract!: Contract;

  constructor() {
    this.initializeContracts();
  }

  private initializeContracts() {
    try {
      // Initialize provider based on environment
      const rpcUrl = process.env.RPC_URL || 'http://localhost:8545';
      this.provider = new JsonRpcProvider(rpcUrl);
      
      // Initialize wallet
      const privateKey = process.env.PRIVATE_KEY;
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }
      this.wallet = new Wallet(privateKey, this.provider);
      
      // Initialize contract instances
      this.agentNftContract = new Contract(
        process.env.AGENT_NFT_CONTRACT_ADDRESS || ZeroAddress,
        AGENT_NFT_ABI,
        this.wallet
      );
      
      this.marketplaceContract = new Contract(
        process.env.MARKETPLACE_CONTRACT_ADDRESS || ZeroAddress,
        MARKETPLACE_ABI,
        this.wallet
      );
      
      this.revenueDistributorContract = new Contract(
        process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS || ZeroAddress,
        REVENUE_DISTRIBUTOR_ABI,
        this.wallet
      );
      
      this.smartAccountFactoryContract = new Contract(
        process.env.SMART_ACCOUNT_FACTORY_ADDRESS || ZeroAddress,
        SMART_ACCOUNT_FACTORY_ABI,
        this.wallet
      );
      
      this.logger.log('Smart contracts initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize smart contracts:', error);
    }
  }

  // Agent NFT Contract Methods
  async mintAgentNft(ownerAddress: string, metadataUri: string): Promise<{ tokenId: number, txHash: string }> {
    try {
      const tx = await this.agentNftContract.mint(ownerAddress, metadataUri);
      const receipt = await tx.wait();
      
      const transferEvent = receipt.logs?.find((log: any) => log.fragment.name === 'Transfer');
      const tokenId = Number((transferEvent?.args as any)?.tokenId);
      
      return {
        tokenId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      this.logger.error('Failed to mint agent NFT:', error);
      throw error;
    }
  }

  async updateTokenMetadata(tokenId: number, metadataUri: string): Promise<string> {
    try {
      const tx = await this.agentNftContract.setTokenURI(BigInt(tokenId), metadataUri);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('Failed to update token metadata:', error);
      throw error;
    }
  }

  async transferFractionalShare(tokenId: number, from: string, to: string, shareAmount: number): Promise<string> {
    try {
      const tx = await this.agentNftContract.transferFractionalShare(BigInt(tokenId), from, to, BigInt(shareAmount));
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('Failed to transfer fractional share:', error);
      throw error;
    }
  }

  // Marketplace Contract Methods
  async listShares(agentTokenId: number, shareAmount: number, pricePerShare: string, duration: number): Promise<{ listingId: number, txHash: string }> {
    try {
      const tx = await this.marketplaceContract.listShares(
        BigInt(agentTokenId),
        BigInt(shareAmount),
        parseEther(pricePerShare),
        BigInt(duration)
      );
      const receipt = await tx.wait();
      
      const listEvent = receipt.logs?.find((log: any) => log.fragment.name === 'SharesListed');
      const listingId = Number((listEvent?.args as any)?.listingId);
      
      return {
        listingId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      this.logger.error('Failed to list shares:', error);
      throw error;
    }
  }

  async buyShares(listingId: number, totalPrice: string): Promise<string> {
    try {
      const tx = await this.marketplaceContract.buyShares(BigInt(listingId), {
        value: parseEther(totalPrice)
      });
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('Failed to buy shares:', error);
      throw error;
    }
  }

  async makeOffer(listingId: number, shareAmount: number, offerPrice: string): Promise<{ offerId: number, txHash: string }> {
    try {
      const tx = await this.marketplaceContract.makeOffer(BigInt(listingId), BigInt(shareAmount), {
        value: parseEther(offerPrice)
      });
      const receipt = await tx.wait();
      
      const offerEvent = receipt.logs?.find((log: any) => log.fragment.name === 'OfferMade');
      const offerId = Number((offerEvent?.args as any)?.offerId);
      
      return {
        offerId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      this.logger.error('Failed to make offer:', error);
      throw error;
    }
  }

  async acceptOffer(offerId: number): Promise<string> {
    try {
      const tx = await this.marketplaceContract.acceptOffer(offerId);
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('Failed to accept offer:', error);
      throw error;
    }
  }

  // Revenue Distributor Contract Methods
  async createRevenueStream(agentTokenId: number, streamName: string, tokenAddress: string, distributionThreshold: string): Promise<{ streamId: number, txHash: string }> {
    try {
      const tx = await this.revenueDistributorContract.createRevenueStream(
        BigInt(agentTokenId),
        streamName,
        tokenAddress,
        parseEther(distributionThreshold)
      );
      const receipt = await tx.wait();
      
      const streamEvent = receipt.logs?.find((log: any) => log.fragment.name === 'RevenueStreamCreated');
      const streamId = Number((streamEvent?.args as any)?.streamId);
      
      return {
        streamId,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      this.logger.error('Failed to create revenue stream:', error);
      throw error;
    }
  }

  async addRevenue(streamId: number, amount: string, tokenAddress?: string): Promise<string> {
    try {
      let tx;
      if (tokenAddress === ZeroAddress || !tokenAddress) {
        // ETH payment
        tx = await this.revenueDistributorContract.addRevenue(BigInt(streamId), parseEther(amount), {
          value: parseEther(amount)
        });
      } else {
        // ERC20 token payment (would need approval first)
        tx = await this.revenueDistributorContract.addRevenue(BigInt(streamId), parseEther(amount));
      }
      
      const receipt = await tx.wait();
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error('Failed to add revenue:', error);
      throw error;
    }
  }

  async distributeRevenue(streamId: number): Promise<{ distributedAmount: string, txHash: string }> {
    try {
      const tx = await this.revenueDistributorContract.distributeRevenue(BigInt(streamId));
      const receipt = await tx.wait();
      
      const distributeEvent = receipt.logs?.find((log: any) => log.fragment.name === 'RevenueDistributed');
      const distributedAmount = (distributeEvent?.args as any)?.totalAmount?.toString();
      
      return {
        distributedAmount: formatEther(distributedAmount || '0'),
        txHash: receipt.transactionHash
      };
    } catch (error) {
      this.logger.error('Failed to distribute revenue:', error);
      throw error;
    }
  }

  // Smart Account Factory Methods
  async createSmartAccount(ownerAddress: string, salt: number): Promise<{ accountAddress: string, txHash: string }> {
    try {
      const tx = await this.smartAccountFactoryContract.createAccount(ownerAddress, BigInt(salt));
      const receipt = await tx.wait();
      
      const accountEvent = receipt.logs?.find((log: any) => log.fragment.name === 'AccountCreated');
      const accountAddress = (accountEvent?.args as any)?.account;
      
      return {
        accountAddress,
        txHash: receipt.transactionHash
      };
    } catch (error) {
      this.logger.error('Failed to create smart account:', error);
      throw error;
    }
  }

  async getSmartAccountAddress(ownerAddress: string, salt: number): Promise<string> {
    try {
      return await (this.smartAccountFactoryContract as any).getAddress(ownerAddress, BigInt(salt));
    } catch (error) {
      this.logger.error('Failed to get smart account address:', error);
      throw error;
    }
  }

  // Utility Methods
  getContractAddresses() {
    return {
      agentNft: this.agentNftContract.target.toString(),
      marketplace: this.marketplaceContract.target.toString(),
      revenueDistributor: this.revenueDistributorContract.target.toString(),
      smartAccountFactory: this.smartAccountFactoryContract.target.toString()
    };
  }

  async getBlockNumber(): Promise<number> {
    return await this.provider.getBlockNumber();
  }

  async getTransaction(txHash: string) {
    return await this.provider.getTransaction(txHash);
  }

  async getTransactionReceipt(txHash: string) {
    return await this.provider.getTransactionReceipt(txHash);
  }
}