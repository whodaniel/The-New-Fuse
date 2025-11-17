/**
 * Shared Blockchain Service
 *
 * Centralized blockchain interaction utilities to eliminate code duplication
 * and provide consistent Web3 functionality across all services.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger.js';
import { ethers, BigNumberish, JsonRpcProvider, Wallet, TransactionReceipt } from 'ethers';
export interface BlockchainConfig {
    enabled: boolean;
    providerUrl: string;
    contractAddress: string;
    privateKey?: string;
    chainId: number;
    gasLimit: number;
    maxGasPrice: string;
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
export declare class BlockchainService extends EventEmitter {
    private logger;
    private config;
    private provider;
    private wallet;
    private contracts;
    private isConnected;
    constructor(config: BlockchainConfig, logger: Logger);
    /**
     * Initialize blockchain connection
     */
    private initializeConnection;
    /**
     * Check if blockchain connection is active
     */
    isBlockchainConnected(): boolean;
    /**
     * Get provider instance
     */
    getProvider(): JsonRpcProvider | null;
    /**
     * Get wallet instance
     */
    getWallet(): Wallet | null;
    /**
     * Get current blockchain configuration
     */
    getConfig(): BlockchainConfig;
    /**
     * Register a contract for easy access
     */
    registerContract(name: string, address: string, abi: any[]): ethers.Contract | null;
    /**
     * Get registered contract
     */
    getContract(name: string): ethers.Contract | null;
    /**
     * Get Agent NFT contract
     */
    getAgentNFTContract(): ethers.Contract | null;
    /**
     * Create contract instance without registration
     */
    createContract(address: string, abi: any[]): ethers.Contract | null;
    /**
     * Execute a contract call with error handling
     */
    executeContractCall<T = any>(contractName: string, methodName: string, args?: any[], options?: TransactionOptions): Promise<ContractCallResult<T>>;
    /**
     * Get current gas price
     */
    getCurrentGasPrice(): Promise<string>;
    /**
     * Estimate gas for a transaction
     */
    estimateGas(contractName: string, methodName: string, args?: any[], options?: TransactionOptions): Promise<number>;
    /**
     * Sign a message with the wallet
     */
    signMessage(message: string): Promise<string | null>;
    /**
     * Verify a message signature
     */
    verifyMessage(message: string, signature: string): string | null;
    /**
     * Static method to verify message signature without instance
     */
    static verifyMessage(message: string, signature: string): string | null;
    /**
     * Generate a random wallet
     */
    static generateWallet(): {
        address: string;
        privateKey: string;
        mnemonic: string;
    };
    /**
     * Format ETH amount for display
     */
    static formatEther(amount: BigNumberish): string;
    /**
     * Parse ETH amount from string
     */
    static parseEther(amount: string): bigint;
    /**
     * Convert to Wei
     */
    static toWei(amount: string, unit?: BigNumberish): bigint;
    /**
     * Convert from Wei
     */
    static fromWei(amount: BigNumberish, unit?: BigNumberish): string;
    /**
     * Create a token bound account for a given token ID.
     */
    createTokenBoundAccount(tokenId: number): Promise<string>;
    /**
     * Check if address is valid
     */
    static isValidAddress(address: string): boolean;
    /**
     * Get transaction receipt
     */
    getTransactionReceipt(txHash: string): Promise<TransactionReceipt | null>;
    /**
     * Wait for transaction confirmation
     */
    waitForTransaction(txHash: string, confirmations?: number): Promise<TransactionReceipt | null>;
    /**
     * Check blockchain connection health
     */
    checkHealth(): Promise<{
        healthy: boolean;
        details: any;
    }>;
    /**
     * Reconnect to blockchain
     */
    reconnect(): Promise<boolean>;
    /**
     * Cleanup resources
     */
    disconnect(): Promise<void>;
}
//# sourceMappingURL=BlockchainService.d.ts.map