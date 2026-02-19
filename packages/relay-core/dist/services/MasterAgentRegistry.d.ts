/**
 * Master Agent Registry - Single Source of Truth
 *
 * This is THE central nervous system for all agents in The New Fuse framework.
 * Integrates with existing Prisma database, AgentRegistry, and TaskService.
 * Every agent must register here and maintain state through this system.
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { VCIssuanceService } from './VCIssuanceService';
import { BlockchainConfig, BlockchainService } from './shared/BlockchainService';
export { BlockchainConfig } from './shared/BlockchainService.js';
export interface OnChainAgentData {
    tokenId?: number;
    contractAddress?: string;
    tbaAddress?: string;
    isOnChain: boolean;
    mintTransactionHash?: string;
    mintBlockNumber?: number;
    lastOnChainUpdate?: Date;
}
export interface MasterAgentProfile {
    id: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    systemPrompt?: string;
    configuration?: any;
    userId: string;
    capabilities: {
        codeGeneration: boolean;
        fileOperations: boolean;
        webBrowsing: boolean;
        apiAccess: boolean;
        terminalAccess: boolean;
        gitOperations: boolean;
        databaseAccess: boolean;
        realTimeChat: boolean;
        imageProcessing: boolean;
        documentAnalysis: boolean;
        workflowExecution: boolean;
        agentCoordination: boolean;
        relayIntegration: boolean;
        protocolTranslation: boolean;
        heartbeatCompliance: boolean;
        handoffTemplating: boolean;
        stagnationRecovery: boolean;
    };
    platform: 'vscode' | 'chrome' | 'web' | 'api' | 'terminal' | 'integrated' | 'claude-desktop' | 'jules' | 'copilot' | 'unknown';
    location: string;
    lastSeen: Date;
    lastHeartbeat: Date;
    currentTask?: string;
    currentTaskStarted?: Date;
    metrics: {
        totalTasks: number;
        completedTasks: number;
        failedTasks: number;
        averageTaskDuration: number;
        successRate: number;
        responsiveness: number;
        reliability: number;
        collaboration: number;
        stagnationCount: number;
        escalationCount: number;
        leverageRank: number;
        totalSavingsCents: number;
    };
    todoList: MasterAgentTodo[];
    registeredAt: Date;
    lastVerified: Date;
    verificationHash: string;
    onboardingCompleted: boolean;
    protocolChecklistCompleted: boolean;
    onChainData: OnChainAgentData;
    metadata: {
        version: string;
        personalityTraits: any;
        communicationStyle: string;
        expertiseAreas: string[];
        specializations: string[];
        limitations: string[];
        notes: string;
        owner?: string;
        department?: string;
        project?: string;
    };
}
export interface MasterAgentTodo {
    id: string;
    agentId: string;
    content: string;
    status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    priority: 'low' | 'medium' | 'high';
    category: 'task' | 'maintenance' | 'coordination' | 'learning' | 'verification' | 'onboarding';
    createdAt: Date;
    updatedAt: Date;
    dueDate?: Date;
    dependencies: string[];
    estimatedDuration?: number;
    context?: Record<string, any>;
    integrationId?: string;
}
export interface UniversalOnboardingProtocol {
    id: string;
    name: string;
    version: string;
    items: OnboardingChecklistItem[];
    requiredForOperation: boolean;
    lastUpdated: Date;
}
export interface OnboardingChecklistItem {
    id: string;
    requirement: string;
    description: string;
    verificationMethod: 'automatic' | 'manual' | 'peer_review';
    status: 'pending' | 'verified' | 'failed' | 'skipped';
    verifiedAt?: Date;
    verifiedBy?: string;
    evidence?: string;
    notes?: string;
    orientationMaterials: string[];
}
export interface AgentMerkleNode {
    hash: string;
    agentId: string;
    data?: any;
    left?: AgentMerkleNode;
    right?: AgentMerkleNode;
}
export interface SystemWideMetrics {
    totalAgents: number;
    activeAgents: number;
    onlineAgents: number;
    stalledAgents: number;
    totalTodos: number;
    completedTodos: number;
    pendingTodos: number;
    systemHealth: number;
    lastFullVerification: Date;
    merkleRootHash: string;
    onboardingCompletionRate: number;
    protocolComplianceRate: number;
}
export interface SpreadsheetIntegration {
    enabled: boolean;
    tableId?: string;
    viewId?: string;
    lastSync: Date;
    syncStatus: 'success' | 'failed' | 'pending';
    errorMessage?: string;
}
export declare class MasterAgentRegistry extends EventEmitter {
    private logger;
    private prisma;
    private legacyRegistry;
    private metadataManager;
    private agentProfiles;
    private onboardingProtocol;
    private merkleTree;
    private lastMerkleUpdate;
    private systemMetrics;
    private spreadsheetIntegration;
    private blockchainService;
    private vcIssuanceService;
    private blockchainConfig;
    private agentNFTContract;
    private web3Provider;
    private wallet;
    constructor(prisma: any, logger: Logger, blockchainConfig?: BlockchainConfig, vcPrivateKey?: string);
    /**
     * MASTER AGENT REGISTRATION - THE SINGLE ENTRY POINT
     * ALL AGENTS MUST GO THROUGH THIS PROCESS
     */
    registerAgent(profile: Partial<MasterAgentProfile>): Promise<{
        success: boolean;
        agentId: string;
        onboardingRequired: boolean;
        protocolChecklistId: string;
        todoListInitialized: boolean;
        verificationHash: string;
        spreadsheetRowId?: string;
    }>;
    /**
     * UNIVERSAL ONBOARDING PROTOCOL - MANDATORY FOR ALL AGENTS
     * Single standardized onboarding checklist that ensures every agent meets requirements
     */
    startUniversalOnboarding(agentId: string): Promise<{
        success: boolean;
        onboardingSteps: OnboardingChecklistItem[];
        estimatedDuration: number;
        orientationMaterials: string[];
        workspaceAccess: string;
    }>;
    /**
     * SYSTEM-WIDE ROLLING PROTOCOL CHECKLIST
     * Acts as the main orchestration layer that sets conditions and guard rails
     */
    private initializeUniversalOnboardingProtocol;
    /**
     * AGENT TODO LIST MANAGEMENT
     * Integrates with existing Task system for persistence
     */
    initializeAgentTodoList(agentId: string): Promise<void>;
    addAgentTodo(agentId: string, todoData: Partial<MasterAgentTodo>): Promise<string>;
    /**
     * MERKLE TREE VERIFICATION SYSTEM
     * Provides cryptographic verification of agent states
     */
    private generateVerificationHash;
    private updateMerkleTree;
    private buildAgentMerkleTree;
    /**
     * FAIRTABLE/SPREADSHEET INTEGRATION
     * Provides front-facing spreadsheet view of all agents
     */
    private initializeSpreadsheetIntegration;
    private syncAgentToSpreadsheet;
    private syncAllAgentsToSpreadsheet;
    /**
     * PERIODIC VERIFICATION AND SYSTEM HEALTH
     * Continuous monitoring of all agents and system state
     */
    private startPeriodicVerification;
    private performSystemHealthCheck;
    private performFullSystemVerification;
    /**
     * UTILITY METHODS AND INTEGRATIONS
     */
    private loadExistingAgents;
    private convertDbAgentToMasterProfile;
    /**
     * Issue a Verifiable Credential for an agent
     * @param agentId Agent ID to issue credential for
     * @param requestedCapabilities Capabilities to verify and include
     * @returns Promise<VerifiableCredential | null>
     */
    issueAgentCredential(agentId: string, requestedCapabilities?: string[]): Promise<any | null>;
    /**
     * Verify an agent's Verifiable Credential
     * @param credential The credential to verify
     * @returns Promise<boolean>
     */
    verifyAgentCredential(credential: any): Promise<boolean>;
    /**
     * Get VCIssuanceService instance
     * @returns VCIssuanceService instance or null
     */
    getVCIssuanceService(): VCIssuanceService | null;
    /**
     * Get BlockchainService instance
     * @returns BlockchainService instance or null
     */
    getBlockchainService(): BlockchainService | null;
    /**
     * Check blockchain connection health
     */
    checkBlockchainHealth(): Promise<{
        healthy: boolean;
        details: any;
    }>;
    private updateSystemMetrics;
    private calculateOnboardingCompletionRate;
    private calculateProtocolComplianceRate;
    private verifyAgentCompliance;
    private convertToLegacyType;
    private convertToLegacyStatus;
    private extractLegacyCapabilities;
    private convertTodoStatusToTaskStatus;
    private convertTodoPriorityToTaskPriority;
    private generateAgentId;
    /**
     * PUBLIC API METHODS
     */
    getAgentProfile(agentId: string): MasterAgentProfile | undefined;
    getAllAgentProfiles(): MasterAgentProfile[];
    getAllAgents(): MasterAgentProfile[];
    getSystemMetrics(): SystemWideMetrics;
    getMerkleTreeRoot(): string | undefined;
    getSpreadsheetIntegration(): SpreadsheetIntegration;
    updateAgentStatus(agentId: string, status: string): Promise<boolean>;
    /**
     * Update agent capabilities
     */
    updateAgentCapabilities(agentId: string, capabilities: Partial<MasterAgentProfile['capabilities']>): Promise<boolean>;
    /**
     * Update agent metrics
     */
    updateAgentMetrics(agentId: string, metrics: Partial<MasterAgentProfile['metrics']>): Promise<boolean>;
    recordAgentHeartbeat(agentId: string): Promise<boolean>;
    /**
     * Add task to agent - missing method for tests
     */
    addTaskToAgent(agentId: string, taskData: {
        content: string;
        priority?: 'low' | 'medium' | 'high';
        category?: string;
        estimatedDuration?: number;
    }): Promise<string>;
    /**
     * BLOCKCHAIN INTEGRATION METHODS
     * On-chain identity and economic primitives
     */
    private initializeBlockchainIntegration;
    private mintAgentNFT;
    updateAgentOnChainMetadata(agentId: string, newMetadataURI: string): Promise<boolean>;
    getBlockchainConfig(): BlockchainConfig;
    getOnChainAgentData(agentId: string): Promise<OnChainAgentData | null>;
    /**
     * MAIN SYSTEM STATUS REPORT
     * Up-to-the-minute status check for all agents and system health
     */
    generateSystemStatusReport(): {
        timestamp: Date;
        systemHealth: SystemWideMetrics;
        agentSummary: {
            totalAgents: number;
            byStatus: Record<string, number>;
            byPlatform: Record<string, number>;
            recentActivity: {
                agentId: string;
                lastSeen: Date;
                status: string;
            }[];
        };
        todoSummary: {
            totalTodos: number;
            byStatus: Record<string, number>;
            overdueTodos: number;
            highPriorityPending: number;
        };
        complianceReport: {
            onboardingCompletionRate: number;
            protocolComplianceRate: number;
            verificationStatus: string;
            lastFullVerification: Date;
        };
        spreadsheetIntegration: SpreadsheetIntegration;
    };
    private groupAgentsByStatus;
    private groupAgentsByPlatform;
    private groupTodosByStatus;
}
//# sourceMappingURL=MasterAgentRegistry.d.ts.map