/**
 * Shared Blockchain Service
 *
 * Centralized blockchain interaction utilities to eliminate code duplication
 * and provide consistent Web3 functionality across all services.
 */
import { EventEmitter } from 'events';
import { Logger } from '../../utils/Logger.js';
import { ethers } from 'ethers';
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
    const txOptions: any;
    if(options: any, gasLimit: any): any;
    txOptions: any;
    gasLimit: any;
    if(options: any, gasPrice: any): any;
    txOptions: any;
    gasPrice: ethers.BigNumber;
    if(options: any, value: any): any;
    txOptions: any;
    value: ethers.BigNumber;
}
//# sourceMappingURL=BlockchainService.d.ts.map