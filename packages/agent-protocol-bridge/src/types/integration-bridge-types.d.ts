/**
 * Comprehensive Integration Bridge Types
 *
 * Enhanced TypeScript definitions that bridge the Prisma schema models
 * with the integration system interfaces for The New Fuse AI Agent framework.
 */
export * from '../integrations';
import { ProtocolType, BridgeType, ConnectionState, N8NWorkflowStatus as PrismaN8NWorkflowStatus, WebhookMethod as PrismaWebhookMethod, Web3AccountType as PrismaWeb3AccountType, Web3Provider as PrismaWeb3Provider, WalletType as PrismaWalletType, SmartContractType as PrismaSmartContractType, InteractionStatus as PrismaInteractionStatus, TheiaConnectionType as PrismaTheiaConnectionType, TheiaOperation as PrismaTheiaOperation, TheiaOperationTrigger as PrismaTheiaOperationTrigger, TheiaOperationStatus as PrismaTheiaOperationStatus } from '@prisma/client';
import { N8NExecution, WebhookConfiguration, WebhookDeliveryLog, SseEvent, SseSubscription, WebSocketConnection, WebSocketMessage, Web3Account, SmartContract, BlockchainTransaction, TheiaWorkspace, TheiaProject, TheiaSession, ClaudeSubAgentBridge, ClaudeBridgeConfig } from '../integrations';
/**
 * Enhanced Agent Protocol Bridge that supports all integration systems
 */
export interface EnhancedAgentProtocolBridge {
    connectAgent(agentId: string, bridgeType: BridgeType, targetSystem: string): Promise<boolean>;
    disconnectAgent(agentId: string, bridgeType: BridgeType): Promise<boolean>;
    translateMessage(message: ProtocolMessage, targetProtocol: ProtocolType): Promise<ProtocolMessage>;
    n8n: {
        executeWorkflow(agentId: string, workflowId: string, inputData?: Record<string, any>): Promise<N8NExecution>;
        registerWebhook(workflowId: string, path: string): Promise<string>;
        getWorkflowStatus(workflowId: string): Promise<PrismaN8NWorkflowStatus>;
        getExecutionHistory(workflowId: string, limit?: number): Promise<N8NExecution[]>;
    };
    webhooks: {
        createWebhook(config: Omit<WebhookConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfiguration>;
        deliverEvent(eventType: string, data: Record<string, any>, filters?: Record<string, any>): Promise<WebhookDeliveryLog[]>;
        testWebhook(webhookId: string, payload?: Record<string, any>): Promise<WebhookTestResult>;
        getDeliveryHistory(webhookId: string, limit?: number): Promise<WebhookDeliveryLog[]>;
    };
    sse: {
        subscribe(clientId: string, eventTypes: string[], filters?: Record<string, any>): Promise<SseSubscription>;
        broadcast(event: Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>): Promise<SseBroadcastResult>;
        sendToClient(clientId: string, event: Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>): Promise<boolean>;
        getActiveSubscriptions(filters?: Record<string, any>): Promise<SseSubscription[]>;
    };
    websocket: {
        createConnection(socketId: string, options?: WebSocketConnectionOptions): Promise<WebSocketConnection>;
        sendMessage(connectionId: string, message: Omit<WebSocketMessage, 'id' | 'timestamp' | 'direction'>): Promise<boolean>;
        broadcast(message: Omit<WebSocketMessage, 'id' | 'timestamp' | 'direction'>, targets: WebSocketBroadcastTargets): Promise<WebSocketBroadcastResult>;
        joinRoom(connectionId: string, roomId: string): Promise<boolean>;
        leaveRoom(connectionId: string, roomId: string): Promise<boolean>;
    };
    web3: {
        createAccount(userId: string, options: Web3AccountCreationOptions): Promise<Web3Account>;
        connectWallet(userId: string, walletType: PrismaWalletType): Promise<WalletConnection>;
        sendTransaction(accountId: string, transaction: Web3TransactionRequest): Promise<BlockchainTransaction>;
        deployContract(accountId: string, deployment: SmartContractDeployment): Promise<SmartContract>;
        interactWithContract(accountId: string, contractId: string, interaction: ContractInteractionRequest): Promise<ContractInteraction>;
        getBalance(accountId: string, tokenAddress?: string): Promise<Web3Balance>;
    };
    theia: {
        createWorkspace(config: Omit<TheiaWorkspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<TheiaWorkspace>;
        createProject(projectConfig: Omit<TheiaProject, 'id' | 'createdAt' | 'updatedAt'>): Promise<TheiaProject>;
        startSession(workspaceId: string, options?: TheiaSessionOptions): Promise<TheiaSession>;
        executeFileOperation(projectId: string, operation: PrismaTheiaOperation, filePath: string, options?: TheiaFileOperationOptions): Promise<TheiaFileOperation>;
        readFile(projectId: string, filePath: string): Promise<TheiaFileContent>;
        writeFile(projectId: string, filePath: string, content: string, agentId?: string): Promise<TheiaFileOperation>;
        executeCommand(projectId: string, command: string, options?: TheiaCommandOptions): Promise<TheiaCommandResult>;
    };
    claude: ClaudeSubAgentBridge;
}
/**
 * Enhanced Protocol Message with integration support
 */
export interface ProtocolMessage {
    id: string;
    type: string;
    protocol: ProtocolType;
    payload: any;
    metadata?: {
        fromAgent?: string;
        toAgent?: string;
        conversationId?: string;
        correlationId?: string;
        n8nWorkflowId?: string;
        webhookEventType?: string;
        sseChannelId?: string;
        websocketRoomId?: string;
        web3ChainId?: number;
        web3TransactionHash?: string;
        theiaWorkspaceId?: string;
        theiaProjectId?: string;
        claudeSubAgentId?: string;
        claudeTaskId?: string;
        priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
        ttl?: number;
        retryAttempts?: number;
        deliveryMethod?: 'WEBHOOK' | 'SSE' | 'WEBSOCKET' | 'DIRECT';
        signature?: string;
        encrypted?: boolean;
        authentication?: Record<string, any>;
    };
    timestamp: Date;
}
/**
 * Extended Bridge Connection with integration support
 */
export interface BridgeConnection {
    agentId: string;
    bridgeType: BridgeType;
    targetSystem: string;
    state: ConnectionState;
    config?: {
        timeout?: number;
        retryAttempts?: number;
        n8nInstanceUrl?: string;
        n8nApiKey?: string;
        webhookUrl?: string;
        webhookSecret?: string;
        webhookMethod?: PrismaWebhookMethod;
        websocketUrl?: string;
        websocketProtocol?: string;
        web3Provider?: string;
        web3ChainId?: number;
        theiaServerUrl?: string;
        theiaWorkspaceRoot?: string;
        claudeApiKey?: string;
    };
    integrationData?: {
        n8nWorkflows?: string[];
        webhookEndpoints?: string[];
        sseChannels?: string[];
        websocketRooms?: string[];
        web3Accounts?: string[];
        theiaWorkspaces?: string[];
        claudeSubAgents?: string[];
    };
}
export interface WebhookTestResult {
    success: boolean;
    statusCode?: number;
    responseBody?: string;
    responseTime: number;
    error?: string;
}
export interface SseBroadcastResult {
    totalTargeted: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    deliveredTo: string[];
    errors: Array<{
        clientId: string;
        error: string;
    }>;
}
export interface WebSocketConnectionOptions {
    userId?: string;
    agentId?: string;
    protocol?: string;
    permissions?: string[];
}
export interface WebSocketBroadcastTargets {
    connectionIds?: string[];
    userIds?: string[];
    agentIds?: string[];
    rooms?: string[];
    channels?: string[];
}
export interface WebSocketBroadcastResult {
    totalTargeted: number;
    successfulDeliveries: number;
    failedDeliveries: number;
    deliveredTo: string[];
    errors: Array<{
        connectionId: string;
        error: string;
    }>;
}
export interface Web3AccountCreationOptions {
    provider: PrismaWeb3Provider;
    chainId: number;
    accountType?: PrismaWeb3AccountType;
    verifierId?: string;
}
export interface Web3TransactionRequest {
    to?: string;
    value?: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
}
export interface Web3Balance {
    address: string;
    chainId: number;
    nativeBalance: string;
    tokenBalances: Array<{
        tokenAddress: string;
        balance: string;
        symbol: string;
        decimals: number;
    }>;
}
export interface SmartContractDeployment {
    name: string;
    abi: Record<string, any>;
    bytecode: string;
    constructorArgs?: any[];
    contractType: PrismaSmartContractType;
}
export interface ContractInteractionRequest {
    functionName: string;
    args?: any[];
    value?: string;
    gasLimit?: string;
}
export interface ContractInteraction {
    id: string;
    contractId: string;
    functionName: string;
    inputData?: Record<string, any>;
    outputData?: Record<string, any>;
    txHash?: string;
    status: PrismaInteractionStatus;
    agentId?: string;
    createdAt: Date;
}
export interface WalletConnection {
    id: string;
    userId: string;
    walletType: PrismaWalletType;
    isConnected: boolean;
    connectedAt?: Date;
}
export interface TheiaSessionOptions {
    userId?: string;
    agentId?: string;
    connectionType?: PrismaTheiaConnectionType;
    clientInfo?: Record<string, any>;
}
export interface TheiaFileOperationOptions {
    content?: string;
    permissions?: string;
    agentId?: string;
    userId?: string;
}
export interface TheiaFileOperation {
    id: string;
    projectId: string;
    operation: PrismaTheiaOperation;
    filePath: string;
    beforeContent?: string;
    afterContent?: string;
    triggeredBy: PrismaTheiaOperationTrigger;
    status: PrismaTheiaOperationStatus;
    executedAt: Date;
    agentId?: string;
}
export interface TheiaFileContent {
    filePath: string;
    content: string;
    encoding: string;
    size: number;
    lastModified: Date;
}
export interface TheiaCommandOptions {
    cwd?: string;
    env?: Record<string, string>;
    timeout?: number;
    agentId?: string;
}
export interface TheiaCommandResult {
    command: string;
    exitCode: number;
    stdout: string;
    stderr: string;
    duration: number;
    startTime: Date;
    endTime: Date;
}
/**
 * Integration Bridge Factory for creating specialized bridges
 */
export interface IntegrationBridgeFactory {
    createN8NBridge(config: N8NBridgeConfig): Promise<N8NBridge>;
    createWebhookBridge(config: WebhookBridgeConfig): Promise<WebhookBridge>;
    createSSEBridge(config: SSEBridgeConfig): Promise<SSEBridge>;
    createWebSocketBridge(config: WebSocketBridgeConfig): Promise<WebSocketBridge>;
    createWeb3Bridge(config: Web3BridgeConfig): Promise<Web3Bridge>;
    createTheiaBridge(config: TheiaBridgeConfig): Promise<TheiaBridge>;
    createClaudeBridge(config: ClaudeBridgeConfig): Promise<ClaudeSubAgentBridge>;
}
export interface N8NBridgeConfig {
    instanceUrl: string;
    apiKey?: string;
    webhookBaseUrl?: string;
    defaultTimeout?: number;
}
export interface N8NBridge {
    executeWorkflow(workflowId: string, inputData?: Record<string, any>): Promise<N8NExecution>;
    registerWebhook(workflowId: string, path: string): Promise<string>;
    handleWebhook(path: string, payload: Record<string, any>): Promise<void>;
}
export interface WebhookBridgeConfig {
    maxRetryAttempts?: number;
    defaultTimeout?: number;
    signatureValidation?: boolean;
    rateLimiting?: boolean;
}
export interface WebhookBridge {
    createWebhook(config: Omit<WebhookConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<WebhookConfiguration>;
    deliverEvent(eventType: string, data: Record<string, any>): Promise<WebhookDeliveryLog[]>;
    validateWebhook(url: string): Promise<{
        isValid: boolean;
        error?: string;
    }>;
}
export interface SSEBridgeConfig {
    heartbeatInterval?: number;
    maxConnections?: number;
    eventPersistence?: boolean;
    compressionEnabled?: boolean;
}
export interface SSEBridge {
    createConnection(clientId: string, response: any): Promise<void>;
    subscribe(clientId: string, eventTypes: string[]): Promise<SseSubscription>;
    broadcast(event: Omit<SseEvent, 'id' | 'timestamp' | 'deliveredTo' | 'attempts'>): Promise<SseBroadcastResult>;
    closeConnection(clientId: string): Promise<void>;
}
export interface WebSocketBridgeConfig {
    port?: number;
    maxConnections?: number;
    roomsEnabled?: boolean;
    compressionEnabled?: boolean;
    authenticationRequired?: boolean;
}
export interface WebSocketBridge {
    createConnection(socket: any, connectionId: string): Promise<WebSocketConnection>;
    sendMessage(connectionId: string, message: any): Promise<boolean>;
    broadcast(message: any, targets: WebSocketBroadcastTargets): Promise<WebSocketBroadcastResult>;
    createRoom(name: string, options?: Record<string, any>): Promise<string>;
}
export interface Web3BridgeConfig {
    supportedNetworks: number[];
    defaultProvider?: string;
    web3authConfig?: Record<string, any>;
    contractABIs?: Record<string, any>;
}
export interface Web3Bridge {
    createAccount(userId: string, options: Web3AccountCreationOptions): Promise<Web3Account>;
    connectWallet(userId: string, walletType: PrismaWalletType): Promise<WalletConnection>;
    sendTransaction(accountId: string, transaction: Web3TransactionRequest): Promise<BlockchainTransaction>;
    deployContract(accountId: string, deployment: SmartContractDeployment): Promise<SmartContract>;
    monitorEvents(contractAddress: string, eventFilters: Record<string, any>): Promise<void>;
}
export interface TheiaBridgeConfig {
    workspaceRoot?: string;
    languageServers?: string[];
    mcpIntegration?: boolean;
    debuggingEnabled?: boolean;
}
export interface TheiaBridge {
    createWorkspace(config: Omit<TheiaWorkspace, 'id' | 'createdAt' | 'updatedAt'>): Promise<TheiaWorkspace>;
    startSession(workspaceId: string, options?: TheiaSessionOptions): Promise<TheiaSession>;
    executeFileOperation(projectId: string, operation: PrismaTheiaOperation, filePath: string): Promise<TheiaFileOperation>;
    executeCommand(projectId: string, command: string): Promise<TheiaCommandResult>;
    setupLanguageServer(projectId: string, language: string): Promise<void>;
}
//# sourceMappingURL=integration-bridge-types.d.ts.map