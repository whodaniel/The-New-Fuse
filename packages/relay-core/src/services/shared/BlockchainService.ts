/**
 * Shared Blockchain Service
 * 
 * Centralized blockchain interaction utilities to eliminate code duplication
 * and provide consistent Web3 functionality across all services.
 */

import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger.js';
import { ethers, BigNumberish } from 'ethers';



export interface BlockchainConfig {
  enabled: boolean;
  providerUrl: string;
  contractAddress: string;
  privateKey?: string;
  chainId: number;
  gasLimit: number;
  maxGasPrice: string; // in gwei
}

export interface TransactionOptions {
  gasLimit?: number;
  gasPrice?: string;
  value?: string;
}

export interface ContractCallResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: number;
}

/**
 * Centralized blockchain service for consistent Web3 operations
 */
export class BlockchainService extends EventEmitter {
  private logger: Logger;
  private config: BlockchainConfig;
  private provider: ethers.providers.JsonRpcProvider | null = null;
  private wallet: ethers.Wallet | null = null;
  private contracts: Map<string, ethers.Contract> = new Map();
  private isConnected: boolean = false;

  constructor(config: BlockchainConfig, logger: Logger) {
    super();
    this.config = config;
    this.logger = logger;
    
    if (config.enabled) {
      this.initializeConnection();
    }
  }

  // ============ Connection Management ============

  /**
   * Initialize blockchain connection
   */
  private async initializeConnection(): Promise<void> {
    try {
      this.logger.info('Initializing blockchain connection...');
      
      // Setup provider
      this.provider = new ethers.providers.JsonRpcProvider(this.config.providerUrl);
      
      // Test connection
      const network = await this.provider.getNetwork();
      if (network.chainId !== this.config.chainId) {
        throw new Error(`Chain ID mismatch. Expected: ${this.config.chainId}, Got: ${network.chainId}`);
      }
      
      // Setup wallet if private key provided
      if (this.config.privateKey) {
        this.wallet = new ethers.Wallet(this.config.privateKey, this.provider);
        this.logger.info(`Wallet connected: ${this.wallet.address}`);
      }
      
      this.isConnected = true;
      this.logger.info(`✅ Connected to blockchain (Chain ID: ${network.chainId})`);
      this.emit('connected', { chainId: network.chainId, provider: this.provider });
      
    } catch (error) {
      this.logger.error(`Failed to initialize blockchain connection: ${error}`);
      this.isConnected = false;
      this.emit('connectionError', error);
    }
  }

  /**
   * Check if blockchain connection is active
   */
  isBlockchainConnected(): boolean {
    return this.isConnected && this.provider !== null;
  }

  /**
   * Get provider instance
   */
  getProvider(): ethers.providers.JsonRpcProvider | null {
    return this.provider;
  }

  /**
   * Get wallet instance
   */
  getWallet(): ethers.Wallet | null {
    return this.wallet;
  }

  /**
   * Get current blockchain configuration
   */
  getConfig(): BlockchainConfig {
    return { ...this.config };
  }

  // ============ Contract Management ============

  /**
   * Register a contract for easy access
   */
  registerContract(name: string, address: string, abi: any[]): ethers.Contract | null {
    try {
      if (!this.provider) {
        this.logger.warn('Provider not available for contract registration');
        return null;
      }

      const signer = this.wallet || this.provider;
      const contract = new ethers.Contract(address, abi, signer);
      this.contracts.set(name, contract);
      
      this.logger.info(`Contract registered: ${name} at ${address}`);
      return contract;
      
    } catch (error) {
      this.logger.error(`Failed to register contract ${name}: ${error}`);
      return null;
    }
  }

  /**
   * Get registered contract
   */
  getContract(name: string): ethers.Contract | null {
    return this.contracts.get(name) || null;
  }

  /**
   * Get Agent NFT contract
   */
  getAgentNFTContract(): ethers.Contract | null {
    return this.getContract('AgentNFT');
  }

  /**
   * Create contract instance without registration
   */
  createContract(address: string, abi: any[]): ethers.Contract | null {
    try {
      if (!this.provider) {
        this.logger.warn('Provider not available for contract creation');
        return null;
      }

      const signer = this.wallet || this.provider;
      return new ethers.Contract(address, abi, signer);
      
    } catch (error) {
      this.logger.error(`Failed to create contract instance: ${error}`);
      return null;
    }
  }

  // ============ Transaction Utilities ============

  /**
   * Execute a contract call with error handling
   */
  async executeContractCall<T = any>(
    contractName: string,
    methodName: string,
    args: any[] = [],
    options: TransactionOptions = {}
  ): Promise<ContractCallResult<T>> {
    try {
      const contract = this.getContract(contractName);
      if (!contract) {
        return {
          success: false,
          error: `Contract ${contractName} not found`
        };
      }

      const method = contract[methodName];
      if (!method) {
        return {
          success: false,
          error: `Method ${methodName} not found on contract ${contractName}`
        };
      }

      // Prepare transaction options
      const txOptions: any = {};
      if (options.gasLimit) txOptions.gasLimit = options.gasLimit;
      if (options.gasPrice) txOptions.gasPrice = ethers.utils.parseUnits(options.gasPrice, 'gwei');
      if (options.value) txOptions.value = ethers.utils.parseEther(options.value);

      // Execute the call
      let result;
      if (method.estimateGas) {
        // This is a state-changing transaction
        const tx = await method(...args, txOptions);
        const receipt = await tx.wait();
        
        result = {
          success: true,
          data: receipt as T,
          transactionHash: receipt.hash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toNumber()
        };
      } else {
        // This is a view/pure function call
        const data = await method(...args);
        result = {
          success: true,
          data: data as T
        };
      }

      this.emit('contractCall', {
        contract: contractName,
        method: methodName,
        args,
        result
      });

      return result;

    } catch (error) {
      this.logger.error(`Contract call failed (${contractName}.${methodName}): ${error}`);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get current gas price
   */
  async getCurrentGasPrice(): Promise<string> {
    try {
      if (!this.provider) {
        return this.config.maxGasPrice;
      }

      const gasPrice = await this.provider.getGasPrice();
      const gasPriceGwei = ethers.utils.formatUnits(gasPrice, 'gwei');
      
      // Cap at max gas price
      const maxGwei = parseFloat(this.config.maxGasPrice);
      const currentGwei = parseFloat(gasPriceGwei);
      
      return Math.min(currentGwei, maxGwei).toString();
      
    } catch (error) {
      this.logger.warn(`Failed to get current gas price, using default: ${error}`);
      return this.config.maxGasPrice;
    }
  }

  /**
   * Estimate gas for a transaction
   */
  async estimateGas(
    contractName: string,
    methodName: string,
    args: any[] = [],
    options: TransactionOptions = {}
  ): Promise<number> {
    try {
      const contract = this.getContract(contractName);
      if (!contract) {
        return this.config.gasLimit;
      }

      const method = contract.estimateGas[methodName];
      if (!method) {
        return this.config.gasLimit;
      }

      const txOptions: any = {};
      if (options.value) txOptions.value = ethers.utils.parseEther(options.value);

      const estimatedGas = await method(...args, txOptions);
      
      // Add 20% buffer for safety
      return Math.floor(estimatedGas.toNumber() * 1.2);
      
    } catch (error) {
      this.logger.warn(`Gas estimation failed, using default: ${error}`);
      return this.config.gasLimit;
    }
  }

  // ============ Cryptographic Utilities ============

  /**
   * Sign a message with the wallet
   */
  async signMessage(message: string): Promise<string | null> {
    try {
      if (!this.wallet) {
        this.logger.warn('Wallet not available for message signing');
        return null;
      }

      const signature = await this.wallet.signMessage(message);
      this.logger.info('Message signed successfully');
      return signature;
      
    } catch (error) {
      this.logger.error(`Failed to sign message: ${error}`);
      return null;
    }
  }

  /**
   * Verify a message signature
   */
  verifyMessage(message: string, signature: string): string | null {
    try {
      const recoveredAddress = ethers.utils.verifyMessage(message, signature);
      this.logger.info(`Message verified, recovered address: ${recoveredAddress}`);
      return recoveredAddress;
      
    } catch (error) {
      this.logger.error(`Failed to verify message: ${error}`);
      return null;
    }
  }

  /**
   * Static method to verify message signature without instance
   */
  static verifyMessage(message: string, signature: string): string | null {
    try {
      return ethers.utils.verifyMessage(message, signature);
    } catch (error) {
      return null;
    }
  }

  /**
   * Generate a random wallet
   */
  static generateWallet(): { address: string; privateKey: string; mnemonic: string } {
    const wallet = ethers.Wallet.createRandom();
    return {
      address: wallet.address,
      privateKey: wallet.privateKey,
      mnemonic: wallet.mnemonic?.phrase || ''
    };
  }

  // ============ Utility Functions ============

  /**
   * Format ETH amount for display
   */
  static formatEther(amount: BigNumberish): string {
    return ethers.utils.formatEther(amount);
  }

  /**
   * Parse ETH amount from string
   */
  static parseEther(amount: string): ethers.BigNumber {
    return ethers.utils.parseEther(amount);
  }

  /**
   * Convert to Wei
   */
  static toWei(amount: string, unit: BigNumberish = 'ether'): ethers.BigNumber {
    return ethers.utils.parseUnits(amount, unit);
  }

  /**
   * Convert from Wei
   */
  static fromWei(amount: BigNumberish, unit: BigNumberish = 'ether'): string {
    return ethers.utils.formatUnits(amount, unit);
  }

  /**
   * Check if address is valid
   */
  static isValidAddress(address: string): boolean {
    return ethers.utils.isAddress(address);
  }

  /**
   * Get transaction receipt
   */
  async getTransactionReceipt(txHash: string): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      if (!this.provider) {
        return null;
      }

      return await this.provider.getTransactionReceipt(txHash);
      
    } catch (error) {
      this.logger.error(`Failed to get transaction receipt: ${error}`);
      return null;
    }
  }

  /**
   * Wait for transaction confirmation
   */
  async waitForTransaction(txHash: string, confirmations: number = 1): Promise<ethers.providers.TransactionReceipt | null> {
    try {
      if (!this.provider) {
        return null;
      }

      return await this.provider.waitForTransaction(txHash, confirmations);
      
    } catch (error) {
      this.logger.error(`Failed to wait for transaction: ${error}`);
      return null;
    }
  }

  // ============ Health Monitoring ============

  /**
   * Check blockchain connection health
   */
  async checkHealth(): Promise<{ healthy: boolean; details: any }> {
    try {
      if (!this.provider) {
        return {
          healthy: false,
          details: { error: 'Provider not initialized' }
        };
      }

      const [blockNumber, gasPrice, network] = await Promise.all([
        this.provider.getBlockNumber(),
        this.provider.getGasPrice(),
        this.provider.getNetwork()
      ]);

      return {
        healthy: true,
        details: {
          blockNumber,
          gasPrice: ethers.utils.formatUnits(gasPrice, 'gwei'),
          chainId: network.chainId,
          name: network.name
        }
      };
      
    } catch (error) {
      return {
        healthy: false,
        details: { error: error instanceof Error ? error.message : 'Unknown error' }
      };
    }
  }

  /**
   * Reconnect to blockchain
   */
  async reconnect(): Promise<boolean> {
    try {
      this.isConnected = false;
      this.provider = null;
      this.wallet = null;
      this.contracts.clear();
      
      await this.initializeConnection();
      return this.isConnected;
      
    } catch (error) {
      this.logger.error(`Failed to reconnect: ${error}`);
      return false;
    }
  }

  /**
   * Cleanup resources
   */
  async disconnect(): Promise<void> {
    this.isConnected = false;
    this.provider = null;
    this.wallet = null;
    this.contracts.clear();
    this.removeAllListeners();
    
    this.logger.info('Blockchain service disconnected');
  }
}