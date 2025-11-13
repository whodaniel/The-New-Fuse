/**
 * Blockchain/Web3 Integration Types
 *
 * Comprehensive type definitions for blockchain and Web3 integration
 * with The New Fuse AI Agent framework.
 */
import { BaseEntity } from '../types/common-types';
export interface Web3Account extends BaseEntity {
    userId: string;
    address: string;
    chainId: number;
    networkName: string;
    accountType: Web3AccountType;
    isSmartAccount: boolean;
    verifierId?: string;
    provider: Web3Provider;
    lastBalance?: string;
    nativeToken?: string;
    metadata?: Record<string, any>;
    tags: string[];
    isActive: boolean;
    lastUsed?: Date;
}
export interface WalletConnection extends BaseEntity {
    userId: string;
    web3AccountId?: string;
    walletType: WalletType;
    connectionId?: string;
    providerData?: Record<string, any>;
    isConnected: boolean;
    connectedAt?: Date;
    disconnectedAt?: Date;
    lastActivity?: Date;
    sessionExpiry?: Date;
    refreshToken?: string;
}
export interface SmartContract extends NamedEntity {
    userId: string;
    web3AccountId?: string;
    address: string;
    chainId: number;
    abi?: Record<string, any>;
    bytecode?: string;
    sourceCode?: string;
    contractType: SmartContractType;
    standard?: string;
    features: string[];
    deployedAt?: Date;
    deployTxHash?: string;
    deployBlock?: bigint;
    deployer?: string;
    isVerified: boolean;
    verificationSource?: string;
    agentId?: string;
    automationEnabled: boolean;
}
export interface BlockchainTransaction {
    id: string;
    web3AccountId?: string;
    contractId?: string;
    hash: string;
    chainId: number;
    blockNumber?: bigint;
    blockHash?: string;
    transactionIndex?: number;
    fromAddress: string;
    toAddress?: string;
    value: string;
    gasLimit: string;
    gasUsed?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    status: TransactionStatus;
    nonce?: number;
    inputData?: string;
    submittedAt: Date;
    minedAt?: Date;
    confirmedAt?: Date;
    error?: string;
    errorCode?: string;
    metadata?: Record<string, any>;
    tags: string[];
}
export interface ContractInteraction {
    id: string;
    contractId: string;
    functionName: string;
    functionSelector?: string;
    inputData?: Record<string, any>;
    outputData?: Record<string, any>;
    txHash?: string;
    blockNumber?: bigint;
    status: InteractionStatus;
    error?: string;
    agentId?: string;
    automatedBy?: string;
    createdAt: Date;
}
export declare enum Web3AccountType {
    EOA = "EOA",
    SMART_ACCOUNT = "SMART_ACCOUNT",
    MULTISIG = "MULTISIG"
}
export declare enum Web3Provider {
    WEB3AUTH = "WEB3AUTH",
    METAMASK = "METAMASK",
    WALLETCONNECT = "WALLETCONNECT",
    COINBASE_WALLET = "COINBASE_WALLET",
    CUSTOM = "CUSTOM"
}
export declare enum WalletType {
    WEB3AUTH = "WEB3AUTH",
    METAMASK = "METAMASK",
    WALLETCONNECT = "WALLETCONNECT",
    COINBASE = "COINBASE",
    TRUST_WALLET = "TRUST_WALLET",
    PHANTOM = "PHANTOM",
    CUSTOM = "CUSTOM"
}
export declare enum SmartContractType {
    ERC20 = "ERC20",
    ERC721 = "ERC721",
    ERC1155 = "ERC1155",
    MULTISIG = "MULTISIG",
    DAO = "DAO",
    DeFi = "DeFi",
    CUSTOM = "CUSTOM"
}
export declare enum TransactionStatus {
    PENDING = "PENDING",
    CONFIRMED = "CONFIRMED",
    FAILED = "FAILED",
    DROPPED = "DROPPED"
}
export declare enum InteractionStatus {
    SUCCESS = "SUCCESS",
    FAILED = "FAILED",
    REVERTED = "REVERTED"
}
export interface Web3Manager {
    /**
     * Create or import Web3 account
     */
    createAccount(userId: string, options: {
        provider: Web3Provider;
        chainId: number;
        accountType?: Web3AccountType;
        verifierId?: string;
        metadata?: Record<string, any>;
    }): Promise<Web3Account>;
    /**
     * Connect wallet
     */
    connectWallet(userId: string, walletType: WalletType, connectionOptions?: Record<string, any>): Promise<WalletConnection>;
    /**
     * Disconnect wallet
     */
    disconnectWallet(connectionId: string): Promise<boolean>;
    /**
     * Get account balance
     */
    getBalance(accountId: string, tokenAddress?: string): Promise<Web3Balance>;
    /**
     * Send transaction
     */
    sendTransaction(accountId: string, transaction: Web3TransactionRequest): Promise<BlockchainTransaction>;
    /**
     * Deploy smart contract
     */
    deployContract(accountId: string, deployment: SmartContractDeployment): Promise<SmartContract>;
    /**
     * Interact with smart contract
     */
    interactWithContract(accountId: string, contractId: string, interaction: ContractInteractionRequest): Promise<ContractInteraction>;
    /**
     * Get transaction status
     */
    getTransactionStatus(txHash: string): Promise<BlockchainTransaction>;
    /**
     * Get account transactions
     */
    getAccountTransactions(accountId: string, filters?: TransactionFilters): Promise<BlockchainTransaction[]>;
    /**
     * Sign message
     */
    signMessage(accountId: string, message: string): Promise<Web3Signature>;
    /**
     * Verify signature
     */
    verifySignature(message: string, signature: string, address: string): Promise<boolean>;
}
export interface Web3Balance {
    address: string;
    chainId: number;
    nativeBalance: string;
    tokenBalances: Array<{
        tokenAddress: string;
        tokenSymbol: string;
        tokenName: string;
        balance: string;
        decimals: number;
        usdValue?: number;
    }>;
    totalUsdValue?: number;
    lastUpdated: Date;
}
export interface Web3TransactionRequest {
    to?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
}
export interface SmartContractDeployment {
    name: string;
    description?: string;
    sourceCode: string;
    abi: Record<string, any>;
    bytecode: string;
    constructorArgs?: any[];
    contractType: SmartContractType;
    features?: string[];
    gasLimit?: string;
    gasPrice?: string;
}
export interface ContractInteractionRequest {
    functionName: string;
    args?: any[];
    value?: string;
    gasLimit?: string;
    gasPrice?: string;
}
export interface TransactionFilters {
    fromBlock?: bigint;
    toBlock?: bigint;
    status?: TransactionStatus;
    minValue?: string;
    maxValue?: string;
    limit?: number;
    offset?: number;
}
export interface Web3Signature {
    message: string;
    signature: string;
    address: string;
    timestamp: Date;
}
export interface Web3AgentAutomation {
    /**
     * Setup automated monitoring
     */
    setupMonitoring(agentId: string, monitoringConfig: {
        accounts?: string[];
        contracts?: string[];
        eventTypes: string[];
        conditions?: Record<string, any>;
        actions: Web3AutomationAction[];
    }): Promise<Web3Monitor>;
    /**
     * Execute automated action
     */
    executeAction(agentId: string, action: Web3AutomationAction, trigger: Web3AutomationTrigger): Promise<Web3ActionResult>;
    /**
     * Get monitoring status
     */
    getMonitoringStatus(monitorId: string): Promise<Web3MonitorStatus>;
    /**
     * Update monitoring rules
     */
    updateMonitoring(monitorId: string, updates: Partial<Web3Monitor>): Promise<Web3Monitor>;
    /**
     * Stop monitoring
     */
    stopMonitoring(monitorId: string): Promise<boolean>;
}
export interface Web3Monitor extends NamedEntity {
    agentId: string;
    accounts: string[];
    contracts: string[];
    eventTypes: string[];
    conditions: Record<string, any>;
    actions: Web3AutomationAction[];
    isActive: boolean;
    lastTriggered?: Date;
    triggeredCount: number;
}
export interface Web3AutomationAction {
    id: string;
    type: Web3ActionType;
    config: Record<string, any>;
    priority: number;
    retryAttempts: number;
    timeout: number;
}
export interface Web3AutomationTrigger {
    id: string;
    type: string;
    data: Record<string, any>;
    timestamp: Date;
    blockNumber?: bigint;
    transactionHash?: string;
}
export interface Web3ActionResult {
    actionId: string;
    success: boolean;
    result?: Record<string, any>;
    error?: string;
    executionTime: number;
    timestamp: Date;
}
export interface Web3MonitorStatus {
    monitorId: string;
    isActive: boolean;
    lastCheck: Date;
    nextCheck?: Date;
    checkInterval: number;
    triggeredEvents: number;
    failedActions: number;
    averageResponseTime: number;
}
export declare enum Web3ActionType {
    SEND_TRANSACTION = "SEND_TRANSACTION",
    CALL_CONTRACT = "CALL_CONTRACT",
    SEND_NOTIFICATION = "SEND_NOTIFICATION",
    CREATE_WEBHOOK = "CREATE_WEBHOOK",
    RUN_WORKFLOW = "RUN_WORKFLOW",
    UPDATE_DATABASE = "UPDATE_DATABASE",
    CUSTOM = "CUSTOM"
}
export interface Web3Analytics {
    /**
     * Get account analytics
     */
    getAccountAnalytics(accountId: string, timeRange: TimeRange): Promise<Web3AccountAnalytics>;
    /**
     * Get contract analytics
     */
    getContractAnalytics(contractId: string, timeRange: TimeRange): Promise<Web3ContractAnalytics>;
    /**
     * Get gas analytics
     */
    getGasAnalytics(accountId: string, timeRange: TimeRange): Promise<Web3GasAnalytics>;
    /**
     * Get DeFi position analytics
     */
    getDeFiAnalytics(accountId: string): Promise<Web3DeFiAnalytics>;
}
export interface TimeRange {
    from: Date;
    to: Date;
}
export interface Web3AccountAnalytics {
    accountId: string;
    totalTransactions: number;
    totalVolume: string;
    averageGasUsed: number;
    totalGasCost: string;
    transactionsByDay: Array<{
        date: Date;
        count: number;
        volume: string;
    }>;
    topContracts: Array<{
        address: string;
        name?: string;
        interactionCount: number;
    }>;
    balanceHistory: Array<{
        timestamp: Date;
        balance: string;
        usdValue?: number;
    }>;
}
export interface Web3ContractAnalytics {
    contractId: string;
    totalInteractions: number;
    uniqueUsers: number;
    totalVolume: string;
    functionUsage: Array<{
        functionName: string;
        callCount: number;
        gasUsed: number;
    }>;
    topUsers: Array<{
        address: string;
        interactionCount: number;
    }>;
    activityByDay: Array<{
        date: Date;
        interactions: number;
        uniqueUsers: number;
    }>;
}
export interface Web3GasAnalytics {
    accountId: string;
    totalGasUsed: number;
    totalGasCost: string;
    averageGasPrice: string;
    gasUsageByDay: Array<{
        date: Date;
        gasUsed: number;
        gasCost: string;
        averagePrice: string;
    }>;
    optimizations: Array<{
        type: string;
        description: string;
        potentialSavings: string;
    }>;
}
export interface Web3DeFiAnalytics {
    accountId: string;
    totalValueLocked: string;
    totalYieldEarned: string;
    protocols: Array<{
        protocol: string;
        tvl: string;
        yieldEarned: string;
        apr: number;
    }>;
    positionHistory: Array<{
        timestamp: Date;
        protocol: string;
        action: 'deposit' | 'withdraw' | 'claim';
        amount: string;
        tokenSymbol: string;
    }>;
    riskMetrics: {
        impermanentLoss?: string;
        liquidationRisk: number;
        protocolRisk: number;
    };
}
//# sourceMappingURL=web3-types.d.ts.map