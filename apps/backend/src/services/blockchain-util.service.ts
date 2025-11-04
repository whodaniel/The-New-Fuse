import { Injectable, Logger } from '@nestjs/common';
import { ethers, providers, constants } from 'ethers';

export interface TransactionOptions {
  gasLimit?: ethers.BigNumber;
  maxFeePerGas?: ethers.BigNumber;
  maxPriorityFeePerGas?: ethers.BigNumber;
  gasPrice?: ethers.BigNumber;
  value?: ethers.BigNumber;
  nonce?: number;
}

export interface GasEstimate {
  gasLimit: ethers.BigNumber;
  gasPrice: ethers.BigNumber;
  maxFeePerGas: ethers.BigNumber;
  maxPriorityFeePerGas: ethers.BigNumber;
  estimatedCost: ethers.BigNumber;
}

export interface BlockchainConfig {
  rpcUrl: string;
  chainId: number;
  name: string;
  currency: string;
  blockExplorer: string;
  contracts: {
    agentNft: string;
    marketplace: string;
    revenueDistributor: string;
    smartAccountFactory: string;
  };
}

@Injectable()
export class BlockchainUtilService {
  private readonly logger = new Logger(BlockchainUtilService.name);
  private provider: providers.JsonRpcProvider;
  private config: BlockchainConfig;

  constructor() {
    this.initializeProvider();
  }

  private initializeProvider() {
    try {
      const rpcUrl = process.env.RPC_URL || 'https://mainnet.infura.io/v3/YOUR_PROJECT_ID';
      this.provider = new providers.JsonRpcProvider(rpcUrl);
      
      this.config = {
        rpcUrl,
        chainId: parseInt(process.env.CHAIN_ID || '1'),
        name: process.env.CHAIN_NAME || 'Ethereum Mainnet',
        currency: process.env.NATIVE_CURRENCY || 'ETH',
        blockExplorer: process.env.BLOCK_EXPLORER || 'https://etherscan.io',
        contracts: {
          agentNft: process.env.AGENT_NFT_CONTRACT_ADDRESS || constants.AddressZero,
          marketplace: process.env.MARKETPLACE_CONTRACT_ADDRESS || constants.AddressZero,
          revenueDistributor: process.env.REVENUE_DISTRIBUTOR_CONTRACT_ADDRESS || constants.AddressZero,
          smartAccountFactory: process.env.SMART_ACCOUNT_FACTORY_ADDRESS || constants.AddressZero,
        }
      };
      
      this.logger.log(`Blockchain provider initialized for ${this.config.name}`);
    } catch (error) {
      this.logger.error('Failed to initialize blockchain provider:', error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction with production-ready error handling
   */
  async estimateGas(
    contractAddress: string,
    method: string,
    params: any[],
    options: TransactionOptions = {}
  ): Promise<GasEstimate> {
    try {
      // Get current gas price
      const gasPrice = await this.provider.getGasPrice();
      
      // Estimate base gas
      const gasLimit = options.gasLimit || 
        await this.provider.estimateGas({
          to: contractAddress,
          data: ethers.utils.id(method).substring(0, 10) + 
            ethers.utils.defaultAbiCoder.encode(params.map(p => 
              typeof p === 'object' && p._isBigNumber ? 'uint256' : 
              typeof p === 'string' && ethers.utils.isAddress(p) ? 'address' : 'string'
            ), params).substring(2)
        });

      // Add 20% buffer for safety
      const safeGasLimit = gasLimit.mul(120).div(100);
      
      // Calculate dynamic fees
      const baseFee = await this.provider.getBlock('latest').then(block => block.baseFeePerGas) || gasPrice;
      const priorityFee = gasPrice.sub(baseFee).mul(50).div(100); // 50% of spread as priority
      const maxPriorityFeePerGas = options.maxPriorityFeePerGas || priorityFee;
      const maxFeePerGas = options.maxFeePerGas || baseFee.mul(120).div(100).add(maxPriorityFeePerGas);
      
      // Calculate estimated cost
      const estimatedCost = safeGasLimit.mul(maxFeePerGas);
      
      return {
        gasLimit: safeGasLimit,
        gasPrice,
        maxFeePerGas,
        maxPriorityFeePerGas,
        estimatedCost
      };
    } catch (error) {
      this.logger.error('Gas estimation failed:', error);
      throw new Error(`Failed to estimate gas: ${error.message}`);
    }
  }

  /**
   * Send a transaction with proper error handling and confirmation
   */
  async sendTransaction(
    signer: ethers.Wallet,
    to: string,
    data: string,
    options: TransactionOptions = {}
  ): Promise<ethers.TransactionResponse> {
    try {
      // Validate inputs
      if (!ethers.utils.isAddress(to)) {
        throw new Error('Invalid recipient address');
      }

      // Get gas estimate
      const gasEstimate = await this.estimateGas(to, 'transfer', [to, '0'], options);
      
      // Merge options
      const txOptions = {
        gasLimit: gasEstimate.gasLimit,
        maxFeePerGas: gasEstimate.maxFeePerGas,
        maxPriorityFeePerGas: gasEstimate.maxPriorityFeePerGas,
        ...options
      };

      this.logger.log(`Sending transaction to ${to} with gas limit ${gasEstimate.gasLimit.toString()}`);

      // Send transaction
      const tx = await signer.sendTransaction({
        to,
        data,
        ...txOptions
      });

      this.logger.log(`Transaction sent: ${tx.hash}`);
      return tx;
    } catch (error) {
      this.logger.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }

  /**
   * Wait for transaction confirmation with timeout
   */
  async waitForConfirmation(
    txHash: string,
    confirmations: number = 1,
    timeout: number = 300000 // 5 minutes
  ): Promise<ethers.TransactionReceipt> {
    try {
      this.logger.log(`Waiting for ${confirmations} confirmations for tx: ${txHash}`);
      
      const receipt = await this.provider.waitForTransaction(
        txHash, 
        confirmations, 
        timeout
      );
      
      if (receipt.status === 0) {
        throw new Error('Transaction failed during execution');
      }
      
      this.logger.log(`Transaction confirmed: ${txHash}`);
      return receipt;
    } catch (error) {
      this.logger.error('Transaction confirmation failed:', error);
      throw error;
    }
  }

  /**
   * Get current gas price and network info
   */
  async getNetworkInfo() {
    try {
      const [network, gasPrice, block] = await Promise.all([
        this.provider.getNetwork(),
        this.provider.getGasPrice(),
        this.provider.getBlock('latest')
      ]);

      return {
        network: {
          chainId: network.chainId,
          name: network.name,
          ensAddress: network.ensAddress,
        },
        gasPrice: {
          wei: gasPrice.toString(),
          gwei: ethers.utils.formatUnits(gasPrice, 'gwei'),
          ether: ethers.utils.formatEther(gasPrice)
        },
        block: {
          number: block.number,
          timestamp: block.timestamp,
          baseFeePerGas: block.baseFeePerGas?.toString(),
          difficulty: block.difficulty.toString()
        }
      };
    } catch (error) {
      this.logger.error('Failed to get network info:', error);
      throw error;
    }
  }

  /**
   * Validate Ethereum address
   */
  isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  /**
   * Format address for display (0x1234...5678)
   */
  formatAddress(address: string): string {
    if (!this.isValidAddress(address)) {
      return 'Invalid Address';
    }
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  /**
   * Format Wei to human readable format
   */
  formatWei(wei: ethers.BigNumber | string, decimals: number = 18): string {
    const value = typeof wei === 'string' ? ethers.BigNumber.from(wei) : wei;
    return ethers.utils.formatUnits(value, decimals);
  }

  /**
   * Convert human readable amount to Wei
   */
  toWei(amount: string | number, decimals: number = 18): ethers.BigNumber {
    return ethers.utils.parseUnits(amount.toString(), decimals);
  }

  /**
   * Get contract instance with error handling
   */
  getContract(
    address: string,
    abi: any[],
    signer?: ethers.Signer
  ): ethers.Contract {
    try {
      if (!this.isValidAddress(address)) {
        throw new Error('Invalid contract address');
      }
      
      if (address === constants.AddressZero) {
        throw new Error('Contract address is zero address');
      }

      return new ethers.Contract(address, abi, signer || this.provider);
    } catch (error) {
      this.logger.error('Failed to create contract instance:', error);
      throw error;
    }
  }

  /**
   * Check if contract exists at address
   */
  async contractExists(address: string): Promise<boolean> {
    try {
      const code = await this.provider.getCode(address);
      return code !== '0x';
    } catch (error) {
      this.logger.error('Failed to check contract existence:', error);
      return false;
    }
  }

  /**
   * Get transaction status and details
   */
  async getTransactionStatus(txHash: string) {
    try {
      const [tx, receipt] = await Promise.all([
        this.provider.getTransaction(txHash),
        this.provider.getTransactionReceipt(txHash)
      ]);

      return {
        transaction: tx ? {
          hash: tx.hash,
          from: tx.from,
          to: tx.to,
          value: tx.value.toString(),
          gasLimit: tx.gasLimit?.toString(),
          gasPrice: tx.gasPrice?.toString(),
          nonce: tx.nonce,
          status: tx.confirmations > 0 ? 'confirmed' : 'pending'
        } : null,
        receipt: receipt ? {
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          status: receipt.status === 1 ? 'success' : 'failed',
          gasUsed: receipt.gasUsed.toString(),
          cumulativeGasUsed: receipt.cumulativeGasUsed.toString(),
          confirmations: receipt.confirmations
        } : null
      };
    } catch (error) {
      this.logger.error('Failed to get transaction status:', error);
      throw error;
    }
  }

  getConfig(): BlockchainConfig {
    return this.config;
  }

  getProvider(): providers.JsonRpcProvider {
    return this.provider;
  }
}