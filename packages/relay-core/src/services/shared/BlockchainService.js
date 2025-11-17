/**
 * Shared Blockchain Service
 *
 * Centralized blockchain interaction utilities to eliminate code duplication
 * and provide consistent Web3 functionality across all services.
 */
import { EventEmitter } from 'events';
import { ethers, JsonRpcProvider, Wallet, formatEther, parseEther, formatUnits, parseUnits, isAddress, verifyMessage } from 'ethers';
/**
 * Centralized blockchain service for consistent Web3 operations
 */
export class BlockchainService extends EventEmitter {
    logger;
    config;
    provider = null;
    wallet = null;
    contracts = new Map();
    isConnected = false;
    constructor(config, logger) {
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
    async initializeConnection() {
        try {
            this.logger.info('Initializing blockchain connection...');
            // Setup provider
            this.provider = new JsonRpcProvider(this.config.providerUrl);
            // Test connection
            const network = await this.provider.getNetwork();
            if (network.chainId !== BigInt(this.config.chainId)) {
                throw new Error(`Chain ID mismatch. Expected: ${this.config.chainId}, Got: ${network.chainId}`);
            }
            // Setup wallet if private key provided
            if (this.config.privateKey) {
                this.wallet = new Wallet(this.config.privateKey, this.provider);
                this.logger.info(`Wallet connected: ${this.wallet.address}`);
            }
            this.isConnected = true;
            this.logger.info(`✅ Connected to blockchain (Chain ID: ${network.chainId})`);
            this.emit('connected', { chainId: network.chainId, provider: this.provider });
        }
        catch (error) {
            this.logger.error(`Failed to initialize blockchain connection: ${error}`);
            this.isConnected = false;
            this.emit('connectionError', error);
        }
    }
    /**
     * Check if blockchain connection is active
     */
    isBlockchainConnected() {
        return this.isConnected && this.provider !== null;
    }
    /**
     * Get provider instance
     */
    getProvider() {
        return this.provider;
    }
    /**
     * Get wallet instance
     */
    getWallet() {
        return this.wallet;
    }
    /**
     * Get current blockchain configuration
     */
    getConfig() {
        return { ...this.config };
    }
    // ============ Contract Management ============
    /**
     * Register a contract for easy access
     */
    registerContract(name, address, abi) {
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
        }
        catch (error) {
            this.logger.error(`Failed to register contract ${name}: ${error}`);
            return null;
        }
    }
    /**
     * Get registered contract
     */
    getContract(name) {
        return this.contracts.get(name) || null;
    }
    /**
     * Get Agent NFT contract
     */
    getAgentNFTContract() {
        return this.getContract('AgentNFT');
    }
    /**
     * Create contract instance without registration
     */
    createContract(address, abi) {
        try {
            if (!this.provider) {
                this.logger.warn('Provider not available for contract creation');
                return null;
            }
            const signer = this.wallet || this.provider;
            return new ethers.Contract(address, abi, signer);
        }
        catch (error) {
            this.logger.error(`Failed to create contract instance: ${error}`);
            return null;
        }
    }
    // ============ Transaction Utilities ============
    /**
     * Execute a contract call with error handling
     */
    async executeContractCall(contractName, methodName, args = [], options = {}) {
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
            const txOptions = {};
            if (options.gasLimit)
                txOptions.gasLimit = options.gasLimit;
            if (options.gasPrice)
                txOptions.gasPrice = parseUnits(options.gasPrice, 'gwei');
            if (options.value)
                txOptions.value = parseEther(options.value);
            // Execute the call
            let result;
            try {
                // Try to execute as a transaction first
                const tx = await method(...args, txOptions);
                if (tx && typeof tx.wait === 'function') {
                    // This is a state-changing transaction
                    const receipt = await tx.wait();
                    result = {
                        success: true,
                        data: receipt,
                        transactionHash: receipt.hash,
                        blockNumber: receipt.blockNumber,
                        gasUsed: receipt.gasUsed.toNumber()
                    };
                }
                else {
                    // This is a view/pure function call result
                    result = {
                        success: true,
                        data: tx
                    };
                }
            }
            catch (error) {
                // If transaction fails, try as a view call
                if (error.code === 'CALL_EXCEPTION' || error.message?.includes('call revert')) {
                    const data = await method(...args);
                    result = {
                        success: true,
                        data: data
                    };
                }
                else {
                    throw error;
                }
            }
            this.emit('contractCall', {
                contract: contractName,
                method: methodName,
                args,
                result
            });
            return result;
        }
        catch (error) {
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
    async getCurrentGasPrice() {
        try {
            if (!this.provider) {
                return this.config.maxGasPrice;
            }
            const feeData = await this.provider.getFeeData();
            const gasPrice = feeData.gasPrice || 0n;
            const gasPriceGwei = formatUnits(gasPrice, 'gwei');
            // Cap at max gas price
            const maxGwei = parseFloat(this.config.maxGasPrice);
            const currentGwei = parseFloat(gasPriceGwei);
            return Math.min(currentGwei, maxGwei).toString();
        }
        catch (error) {
            this.logger.warn(`Failed to get current gas price, using default: ${error}`);
            return this.config.maxGasPrice;
        }
    }
    /**
     * Estimate gas for a transaction
     */
    async estimateGas(contractName, methodName, args = [], options = {}) {
        try {
            const contract = this.getContract(contractName);
            if (!contract) {
                return this.config.gasLimit;
            }
            // Check if the method exists on the contract
            if (!(methodName in contract)) {
                return this.config.gasLimit;
            }
            const txOptions = {};
            if (options.value)
                txOptions.value = parseEther(options.value);
            // Use the contract's estimateGas method
            const estimatedGas = await contract[methodName].estimateGas(...args, txOptions);
            // Add 20% buffer for safety
            return Math.floor(Number(estimatedGas) * 1.2);
        }
        catch (error) {
            this.logger.warn(`Gas estimation failed, using default: ${error}`);
            return this.config.gasLimit;
        }
    }
    // ============ Cryptographic Utilities ============
    /**
     * Sign a message with the wallet
     */
    async signMessage(message) {
        try {
            if (!this.wallet) {
                this.logger.warn('Wallet not available for message signing');
                return null;
            }
            const signature = await this.wallet.signMessage(message);
            this.logger.info('Message signed successfully');
            return signature;
        }
        catch (error) {
            this.logger.error(`Failed to sign message: ${error}`);
            return null;
        }
    }
    /**
     * Verify a message signature
     */
    verifyMessage(message, signature) {
        try {
            const recoveredAddress = verifyMessage(message, signature);
            this.logger.info(`Message verified, recovered address: ${recoveredAddress}`);
            return recoveredAddress;
        }
        catch (error) {
            this.logger.error(`Failed to verify message: ${error}`);
            return null;
        }
    }
    /**
     * Static method to verify message signature without instance
     */
    static verifyMessage(message, signature) {
        try {
            return verifyMessage(message, signature);
        }
        catch {
            return null;
        }
    }
    /**
     * Generate a random wallet
     */
    static generateWallet() {
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
    static formatEther(amount) {
        return formatEther(amount);
    }
    /**
     * Parse ETH amount from string
     */
    static parseEther(amount) {
        return parseEther(amount);
    }
    /**
     * Convert to Wei
     */
    static toWei(amount, unit = 'ether') {
        return parseUnits(amount, unit);
    }
    /**
     * Convert from Wei
     */
    static fromWei(amount, unit = 'ether') {
        return formatUnits(amount, unit);
    }
    /**
     * Create a token bound account for a given token ID.
     */
    async createTokenBoundAccount(tokenId) {
        // This is a placeholder implementation.
        // In a real-world scenario, you would interact with a smart contract
        // to create a token-bound account.
        this.logger.info(`Creating token-bound account for token ID: ${tokenId}`);
        const tbaAddress = ethers.Wallet.createRandom().address;
        this.logger.info(`Token-bound account created: ${tbaAddress}`);
        return tbaAddress;
    }
    /**
     * Check if address is valid
     */
    static isValidAddress(address) {
        return isAddress(address);
    }
    /**
     * Get transaction receipt
     */
    async getTransactionReceipt(txHash) {
        try {
            if (!this.provider) {
                return null;
            }
            return await this.provider.getTransactionReceipt(txHash);
        }
        catch (error) {
            this.logger.error(`Failed to get transaction receipt: ${error}`);
            return null;
        }
    }
    /**
     * Wait for transaction confirmation
     */
    async waitForTransaction(txHash, confirmations = 1) {
        try {
            if (!this.provider) {
                return null;
            }
            return await this.provider.waitForTransaction(txHash, confirmations);
        }
        catch (error) {
            this.logger.error(`Failed to wait for transaction: ${error}`);
            return null;
        }
    }
    // ============ Health Monitoring ============
    /**
     * Check blockchain connection health
     */
    async checkHealth() {
        try {
            if (!this.provider) {
                return {
                    healthy: false,
                    details: { error: 'Provider not initialized' }
                };
            }
            const [blockNumber, feeData, network] = await Promise.all([
                this.provider.getBlockNumber(),
                this.provider.getFeeData(),
                this.provider.getNetwork()
            ]);
            return {
                healthy: true,
                details: {
                    blockNumber,
                    gasPrice: formatUnits(feeData.gasPrice || 0n, 'gwei'),
                    chainId: network.chainId,
                    name: network.name
                }
            };
        }
        catch (error) {
            return {
                healthy: false,
                details: { error: error instanceof Error ? error.message : 'Unknown error' }
            };
        }
    }
    /**
     * Reconnect to blockchain
     */
    async reconnect() {
        try {
            this.isConnected = false;
            this.provider = null;
            this.wallet = null;
            this.contracts.clear();
            await this.initializeConnection();
            return this.isConnected;
        }
        catch (error) {
            this.logger.error(`Failed to reconnect: ${error}`);
            return false;
        }
    }
    /**
     * Cleanup resources
     */
    async disconnect() {
        this.isConnected = false;
        this.provider = null;
        this.wallet = null;
        this.contracts.clear();
        this.removeAllListeners();
        this.logger.info('Blockchain service disconnected');
    }
}
//# sourceMappingURL=BlockchainService.js.map