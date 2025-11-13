/**
 * Master Agent Registry - Single Source of Truth
 *
 * This is THE central nervous system for all agents in The New Fuse framework.
 * Integrates with existing Prisma database, AgentRegistry, and TaskService.
 * Every agent must register here and maintain state through this system.
 */
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { AgentType, AgentStatus, PrismaClient } from '../types/database.js';
import { BlockchainConfig } from './shared/BlockchainService';
export type { BlockchainConfig } from './shared/BlockchainService.js';
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
    type: AgentType;
    status: AgentStatus;
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
    constructor(prisma: PrismaClient, logger: Logger, blockchainConfig?: BlockchainConfig, vcPrivateKey?: string);
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
     * SYSTEM-WIDE ROLLING PROTOCOL CHECKLIST
     * Acts as the main orchestration layer that sets conditions and guard rails
     */
    private initializeUniversalOnboardingProtocol;
    /**
     * AGENT TODO LIST MANAGEMENT - LIKE CLAUDE CLI
     * Integrates with existing Task system for persistence
     */
    initializeAgentTodoList(agentId: string): Promise<void>;
    addAgentTodo(agentId: string, todoData: Partial<MasterAgentTodo>): Promise<string>;
}
//# sourceMappingURL=MasterAgentRegistry.d.ts.map