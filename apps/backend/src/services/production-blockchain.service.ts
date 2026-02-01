import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { agentNftRepository, drizzleAgentRepository } from '@the-new-fuse/database';
import { Contract, Wallet } from 'ethers';
import { BlockchainUtilService } from './blockchain-util.service';

export interface AgentNFTCreationRequest {
  agentId: string;
  userId: string;
  ownerAddress: string;
  metadataUri?: string;
  smartAccountAddress?: string;
}

export interface AgentNFTResult {
  tokenId: number;
  contractAddress: string;
  transactionHash: string;
  blockNumber: number;
  gasUsed: string;
  gasPrice: string;
  agentNFT: any;
}

export interface TransactionValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  estimatedGas?: string;
  estimatedCost?: string;
}

@Injectable()
export class ProductionBlockchainService {
  private readonly logger = new Logger(ProductionBlockchainService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly blockchainUtil: BlockchainUtilService
  ) {}

  /**
   * Create an Agent NFT with production-ready blockchain operations
   */
  async createAgentNFT(request: AgentNFTCreationRequest): Promise<AgentNFTResult> {
    try {
      this.logger.log(`Creating Agent NFT for agent ${request.agentId}`);

      // Validate inputs
      const validation = await this.validateAgentNFTCreation(request);
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Get agent details
      const agent = await drizzleAgentRepository.findById(request.agentId, request.userId);

      if (!agent) {
        throw new Error(`Agent not found: ${request.agentId}`);
      }

      // Check if agent is already minted
      const existingNft = await agentNftRepository.findByAgentId(request.agentId);

      if (existingNft) {
        throw new Error(`Agent ${request.agentId} is already minted as NFT`);
      }

      // Initialize wallet for transactions
      const privateKey = this.configService.get<string>('PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('PRIVATE_KEY not found in configuration');
      }
      const wallet = new Wallet(privateKey, this.blockchainUtil.getProvider());

      // Get contract instance
      const config = this.blockchainUtil.getConfig();
      const agentNftContract = this.blockchainUtil.getContract(
        config.contracts.agentNft,
        this.getAgentNFTABI(),
        wallet
      );

      // Estimate gas for minting
      const gasEstimate = await this.blockchainUtil.estimateGas(
        agentNftContract.target.toString(),
        'mint',
        [request.ownerAddress, request.metadataUri || this.generateMetadataURI(request.agentId)]
      );

      this.logger.log(
        `Estimated gas: ${gasEstimate.gasLimit.toString()}, Cost: ${gasEstimate.estimatedCost.toString()} wei`
      );

      // Perform blockchain transaction
      const tx = await agentNftContract.mint(
        request.ownerAddress,
        request.metadataUri || this.generateMetadataURI(request.agentId),
        {
          gasLimit: gasEstimate.gasLimit,
          maxFeePerGas: gasEstimate.maxFeePerGas,
          maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
          value: 0,
        }
      );

      this.logger.log(`Transaction sent: ${tx.hash}`);

      // Wait for confirmation
      const receipt = await this.blockchainUtil.waitForConfirmation(tx.hash, 1);

      if (!receipt || receipt.status === 0) {
        throw new Error('Transaction failed during execution');
      }

      // Extract token ID from transfer event
      const transferEvent = receipt.logs?.find((log: any) => log.fragment?.name === 'Transfer');
      const tokenId = Number((transferEvent as any)?.args?.tokenId);

      if (!tokenId) {
        throw new Error('Failed to extract token ID from transaction');
      }

      // Create Agent NFT record in database
      const agentNFT = await agentNftRepository.create({
        agentId: request.agentId,
        tokenId: tokenId,
        contractAddress: agentNftContract.target.toString(),
        smartAccountAddress: request.smartAccountAddress,
        metadataUri: request.metadataUri || this.generateMetadataURI(request.agentId),
        isFractionalized: false,
        totalShares: 0,
      } as any);
      // We need to return with agent included, but create usually returns raw
      // Fetch it back with agent
      const fullAgentNFT = await agentNftRepository.findFullDetailsByAgentId(request.agentId);

      this.logger.log(`Agent NFT created successfully - Token ID: ${tokenId}, Tx: ${tx.hash}`);

      return {
        tokenId,
        contractAddress: agentNftContract.target.toString(),
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        gasPrice: gasEstimate.gasPrice.toString(),
        agentNFT: fullAgentNFT,
      };
    } catch (error: any) {
      this.logger.error(`Failed to create Agent NFT: ${error.message}`, error.stack);
      throw new Error(`Failed to create Agent NFT: ${error.message}`);
    }
  }

  /**
   * Validate Agent NFT creation request
   */
  private async validateAgentNFTCreation(
    request: AgentNFTCreationRequest
  ): Promise<TransactionValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate agent ID
    if (!request.agentId || request.agentId.trim() === '') {
      errors.push('Agent ID is required');
    }

    // Validate owner address
    if (!this.blockchainUtil.isValidAddress(request.ownerAddress)) {
      errors.push('Invalid owner address format');
    }

    // Check if agent exists
    if (request.agentId) {
      const agent = await drizzleAgentRepository.findById(request.agentId, request.userId);

      if (!agent) {
        errors.push(`Agent not found: ${request.agentId}`);
      }
    }

    // Validate metadata URI if provided
    if (request.metadataUri) {
      try {
        new URL(request.metadataUri);
      } catch {
        warnings.push('Metadata URI format may be invalid');
      }
    }

    // Check if agent is already minted
    if (request.agentId) {
      const existingNft = await agentNftRepository.findByAgentId(request.agentId);

      if (existingNft) {
        errors.push('Agent is already minted as NFT');
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Generate metadata URI for agent
   */
  private generateMetadataURI(agentId: string): string {
    const baseUrl =
      this.configService.get<string>('METADATA_BASE_URL') || 'https://metadata.thenewfuse.com';
    return `${baseUrl}/agents/${agentId}`;
  }

  /**
   * Get Agent NFT Contract ABI (Production ready)
   */
  private getAgentNFTABI() {
    return [
      'function mint(address to, string memory tokenURI) public returns (uint256)',
      'function setTokenURI(uint256 tokenId, string memory tokenURI) public',
      'function ownerOf(uint256 tokenId) public view returns (address)',
      'function getAgent(uint256 tokenId) public view returns (tuple(string name, string description, string agentType, string[] capabilities, uint256 shares, bool isFractionalized))',
      'function transferFractionalShare(uint256 tokenId, address from, address to, uint256 shareAmount) external',
      'function setMarketplaceAuthorization(address marketplace, bool authorized) external',
      'function safeTransferFrom(address from, address to, uint256 tokenId) public',
      'function approve(address to, uint256 tokenId) public',
      'function getApproved(uint256 tokenId) public view returns (address)',
      'function setApprovalForAll(address operator, bool approved) public',
      'function isApprovedForAll(address owner, address operator) public view returns (bool)',
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)',
      'event FractionalShareTransferred(uint256 indexed tokenId, address indexed from, address indexed to, uint256 shareAmount)',
      'event MarketplaceAuthorizationSet(address indexed marketplace, bool authorized)',
    ];
  }

  /**
   * Update Agent NFT metadata with production error handling
   */
  async updateAgentNFTMetadata(
    agentId: string,
    newMetadataUri: string
  ): Promise<{ transactionHash: string; blockNumber: number }> {
    try {
      this.logger.log(`Updating metadata for agent ${agentId}`);

      // Get agent NFT
      const agentNFT = await agentNftRepository.findByAgentId(agentId);

      if (!agentNFT) {
        throw new Error(`Agent NFT not found for agent ${agentId}`);
      }

      // Validate metadata URI
      try {
        new URL(newMetadataUri);
      } catch {
        throw new Error('Invalid metadata URI format');
      }

      // Initialize wallet
      const privateKey = this.configService.get<string>('PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('PRIVATE_KEY environment variable is required');
      }

      const wallet = new Wallet(privateKey, this.blockchainUtil.getProvider());
      const config = this.blockchainUtil.getConfig();
      const agentNftContract = this.blockchainUtil.getContract(
        config.contracts.agentNft,
        this.getAgentNFTABI(),
        wallet
      );

      // Estimate gas
      const gasEstimate = await this.blockchainUtil.estimateGas(
        agentNftContract.target.toString(),
        'setTokenURI',
        [agentNFT.tokenId, newMetadataUri]
      );

      // Perform update
      const tx = await agentNftContract.setTokenURI(agentNFT.tokenId, newMetadataUri, {
        gasLimit: gasEstimate.gasLimit,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
      });

      const receipt = await this.blockchainUtil.waitForConfirmation(tx.hash, 1);

      if (!receipt || receipt.status === 0) {
        throw new Error('Metadata update transaction failed');
      }

      // Update database
      await agentNftRepository.update(agentId, { metadataUri: newMetadataUri } as any);

      this.logger.log(`Metadata updated successfully for agent ${agentId} - Tx: ${tx.hash}`);

      return {
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      this.logger.error(`Failed to update Agent NFT metadata: ${error.message}`, error.stack);
      throw new Error(`Failed to update metadata: ${error.message}`);
    }
  }

  /**
   * Get Agent NFT details from blockchain and database
   */
  async getAgentNFTDetails(agentId: string) {
    try {
      const agentNFT = await agentNftRepository.findFullDetailsByAgentId(agentId);

      if (!agentNFT) {
        return null;
      }

      // Get blockchain data
      const config = this.blockchainUtil.getConfig();
      const provider = this.blockchainUtil.getProvider();

      const contract = new Contract(agentNFT.contractAddress, this.getAgentNFTABI(), provider);

      // Get owner and on-chain data
      const [owner, onChainAgent] = await Promise.all([
        contract.ownerOf(BigInt(agentNFT.tokenId)),
        contract.getAgent(BigInt(agentNFT.tokenId)).catch(() => null),
      ]);

      return {
        ...agentNFT,
        blockchainData: {
          owner,
          onChainAgent,
          contractAddress: agentNFT.contractAddress,
          tokenId: agentNFT.tokenId,
        },
      };
    } catch (error: any) {
      this.logger.error(`Failed to get Agent NFT details: ${error.message}`, error.stack);
      throw new Error(`Failed to get Agent NFT details: ${error.message}`);
    }
  }

  /**
   * Batch process Agent NFT operations with transaction safety
   */
  async batchCreateAgentNFTs(requests: AgentNFTCreationRequest[]): Promise<AgentNFTResult[]> {
    const results: AgentNFTResult[] = [];
    const errors: string[] = [];

    // Process each request with individual error handling
    for (const request of requests) {
      try {
        const result = await this.createAgentNFT(request);
        results.push(result);
      } catch (error: any) {
        this.logger.error(
          `Failed to process NFT creation for agent ${request.agentId}: ${error.message}`
        );
        errors.push(`Agent ${request.agentId}: ${error.message}`);
      }
    }

    if (errors.length > 0) {
      this.logger.warn(`Batch processing completed with ${errors.length} errors`);
    }

    return results;
  }

  /**
   * Monitor blockchain transactions for status updates
   */
  async monitorTransaction(txHash: string): Promise<{
    status: 'pending' | 'confirmed' | 'failed';
    confirmations: number;
    blockNumber?: number;
    gasUsed?: string;
    error?: string;
  }> {
    try {
      const status = await this.blockchainUtil.getTransactionStatus(txHash);

      if (!status.transaction) {
        return {
          status: 'failed',
          confirmations: 0,
          error: 'Transaction not found',
        };
      }

      if (status.receipt) {
        if (status.receipt.status === 'success') {
          return {
            status: 'confirmed',
            confirmations: status.receipt.confirmations,
            blockNumber: status.receipt.blockNumber,
            gasUsed: status.receipt.gasUsed,
          };
        } else {
          return {
            status: 'failed',
            confirmations: status.receipt.confirmations,
            blockNumber: status.receipt.blockNumber,
            gasUsed: status.receipt.gasUsed,
            error: 'Transaction execution failed',
          };
        }
      }

      return {
        status: 'pending',
        confirmations: 0,
      };
    } catch (error: any) {
      this.logger.error(`Failed to monitor transaction ${txHash}: ${error.message}`);
      return {
        status: 'failed',
        confirmations: 0,
        error: error.message,
      };
    }
  }
}
