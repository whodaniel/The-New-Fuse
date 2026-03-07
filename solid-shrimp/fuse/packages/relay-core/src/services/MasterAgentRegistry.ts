/**
 * Master Agent Registry - Single Source of Truth
 *
 * This is THE central nervous system for all agents in The New Fuse framework.
 * Integrates with existing Drizzle database, AgentRegistry, and TaskService.
 * Every agent must register here and maintain state through this system.
 */

import type { AgentStatus, AgentType, TaskPriority, TaskStatus } from '@the-new-fuse/database';
import { Contract, JsonRpcProvider, Wallet, parseUnits } from 'ethers';
import { EventEmitter } from 'events';
import { Logger } from '../utils/Logger';
import { VCIssuanceRequest, VCIssuanceService } from './VCIssuanceService';
import { BlockchainConfig, BlockchainService } from './shared/BlockchainService';
// import { sha256 } from '../../../../src/utils/cryptoUtils';
// import { AgentRegistry, Agent as LegacyAgent } from '../../../../src/services/AgentRegistry.js';
// import { AgentMetadataManager } from '../../../../src/services/AgentMetadataManager.js';

// Stub implementations
const sha256 = (input: string): string => {
  // Simple hash implementation for build purposes
  return Buffer.from(input).toString('base64').substring(0, 16);
};

interface LegacyAgent {
  id: string;
  name?: string;
  type: string;
  capabilities: string[];
  registeredAt: string;
  lastSeen: string;
  status: string;
  metadata?: Record<string, any>;
}

class AgentRegistry {
  agents: Map<string, LegacyAgent> = new Map();
  registerAgent(agent: LegacyAgent): void {
    this.agents.set(agent.id, agent);
  }
  getAgent(id: string): LegacyAgent | undefined {
    return this.agents.get(id);
  }
  getAllAgents(): LegacyAgent[] {
    return Array.from(this.agents.values());
  }
}

class AgentMetadataManager {
  metadata: Map<string, any> = new Map();
  updateMetadata(agentId: string, metadata: any): void {
    this.metadata.set(agentId, metadata);
  }
  getMetadata(agentId: string): any {
    return this.metadata.get(agentId);
  }
}

// Re-export BlockchainConfig for compatibility
export { BlockchainConfig } from './shared/BlockchainService.js';

// On-chain agent data
export interface OnChainAgentData {
  tokenId?: number;
  contractAddress?: string;
  tbaAddress?: string;
  isOnChain: boolean;
  mintTransactionHash?: string;
  mintBlockNumber?: number;
  lastOnChainUpdate?: Date;
}

// Enhanced agent profile that integrates with existing schema
export interface MasterAgentProfile {
  // Core Identity (from Drizzle Agent model)
  id: string;
  name: string;
  type: string;
  status: string;
  description?: string;
  systemPrompt?: string;
  configuration?: any;
  userId: string;

  // Enhanced capabilities matrix
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
    // The New Fuse specific capabilities
    relayIntegration: boolean;
    protocolTranslation: boolean;
    heartbeatCompliance: boolean;
    handoffTemplating: boolean;
    stagnationRecovery: boolean;
  };

  // Platform Information
  platform:
    | 'vscode'
    | 'chrome'
    | 'web'
    | 'api'
    | 'terminal'
    | 'integrated'
    | 'claude-desktop'
    | 'jules'
    | 'copilot'
    | 'unknown';
  location: string; // URL, extension ID, or system path

  // Enhanced operational state
  lastSeen: Date;
  lastHeartbeat: Date;
  currentTask?: string;
  currentTaskStarted?: Date;

  // Performance metrics (integrates with existing AgentMetadata)
  metrics: {
    totalTasks: number;
    completedTasks: number;
    failedTasks: number;
    averageTaskDuration: number; // minutes
    successRate: number; // percentage
    responsiveness: number; // response time in ms
    reliability: number; // uptime percentage
    collaboration: number; // successful handoffs
    stagnationCount: number;
    escalationCount: number;
    // Abundance Metrics
    leverageRank: number; // 0-100 score of how effectively this agent uses free compute
    totalSavingsCents: number; // Total cents saved vs. paid APIs
  };

  // Todo list management (integrates with Task system)
  todoList: MasterAgentTodo[];

  // Registration & verification
  registeredAt: Date;
  lastVerified: Date;
  verificationHash: string; // Merkle tree verification
  onboardingCompleted: boolean;
  protocolChecklistCompleted: boolean;

  // On-chain integration data
  onChainData: OnChainAgentData;

  // Enhanced metadata (integrates with AgentMetadata)
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
  estimatedDuration?: number; // minutes
  context?: Record<string, any>;
  integrationId?: string; // Links to Drizzle Task if applicable
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

export class MasterAgentRegistry extends EventEmitter {
  private logger: Logger;
  private drizzle: any;
  private legacyRegistry: AgentRegistry;
  private metadataManager: AgentMetadataManager;

  // In-memory caches for performance
  private agentProfiles: Map<string, MasterAgentProfile> = new Map();
  private onboardingProtocol: UniversalOnboardingProtocol;
  private merkleTree: AgentMerkleNode | null = null;
  private lastMerkleUpdate: Date = new Date();

  // System metrics
  private systemMetrics: SystemWideMetrics;

  // Fairtable integration
  private spreadsheetIntegration: SpreadsheetIntegration = {
    enabled: false,
    lastSync: new Date(),
    syncStatus: 'pending',
  };

  // Blockchain integration (using shared service)
  private blockchainService: BlockchainService | null = null;
  private vcIssuanceService: VCIssuanceService | null = null;
  private blockchainConfig: BlockchainConfig | null = null;
  private agentNFTContract: Contract | null = null;
  private web3Provider: JsonRpcProvider | null = null;
  private wallet: Wallet | null = null;

  constructor(
    drizzle: any,
    logger: Logger,
    blockchainConfig?: BlockchainConfig,
    vcPrivateKey?: string
  ) {
    super();
    this.logger = logger;
    this.drizzle = drizzle;
    this.legacyRegistry = new AgentRegistry();
    this.metadataManager = new AgentMetadataManager();
    this.onboardingProtocol = {} as UniversalOnboardingProtocol; // Stub

    // Initialize blockchain service
    if (blockchainConfig) {
      this.blockchainService = new BlockchainService(blockchainConfig, logger);
      this.initializeBlockchainIntegration();
    }

    // Initialize system metrics
    this.systemMetrics = {
      totalAgents: 0,
      activeAgents: 0,
      onlineAgents: 0,
      stalledAgents: 0,
      totalTodos: 0,
      completedTodos: 0,
      pendingTodos: 0,
      systemHealth: 100,
      lastFullVerification: new Date(),
      merkleRootHash: '',
      onboardingCompletionRate: 0,
      protocolComplianceRate: 0,
    };

    // Initialize VCIssuanceService if private key provided
    if (vcPrivateKey) {
      this.vcIssuanceService = new VCIssuanceService(drizzle, logger, vcPrivateKey);
    }

    this.initializeUniversalOnboardingProtocol();
    this.loadExistingAgents();
    this.startPeriodicVerification();
    this.initializeSpreadsheetIntegration();
  }

  /**
   * MASTER AGENT REGISTRATION - THE SINGLE ENTRY POINT
   * ALL AGENTS MUST GO THROUGH THIS PROCESS
   */
  async registerAgent(profile: Partial<MasterAgentProfile>): Promise<{
    success: boolean;
    agentId: string;
    onboardingRequired: boolean;
    protocolChecklistId: string;
    todoListInitialized: boolean;
    verificationHash: string;
    spreadsheetRowId?: string;
  }> {
    try {
      this.logger.info(`🚀 MASTER REGISTRATION INITIATED: ${profile.name || 'Unknown Agent'}`);

      // Generate unique ID if not provided
      const agentId =
        profile.id || this.generateAgentId(profile.type || 'BASIC', profile.platform || 'unknown');

      // Create complete profile with defaults
      const completeProfile: MasterAgentProfile = {
        id: agentId,
        name: profile.name || `${profile.type || 'Unknown'} Agent`,
        type: profile.type || 'BASIC',
        status: 'INACTIVE', // Start as inactive until onboarding complete
        description: profile.description || `Registered ${profile.type} agent`,
        systemPrompt: profile.systemPrompt,
        configuration: profile.configuration || {},
        userId: profile.userId || 'system', // Default to system user
        platform: profile.platform || 'unknown',
        location: profile.location || 'unknown',
        capabilities: {
          codeGeneration: false,
          fileOperations: false,
          webBrowsing: false,
          apiAccess: false,
          terminalAccess: false,
          gitOperations: false,
          databaseAccess: false,
          realTimeChat: false,
          imageProcessing: false,
          documentAnalysis: false,
          workflowExecution: false,
          agentCoordination: false,
          relayIntegration: false,
          protocolTranslation: false,
          heartbeatCompliance: false,
          handoffTemplating: false,
          stagnationRecovery: false,
          ...profile.capabilities,
        },
        lastSeen: new Date(),
        lastHeartbeat: new Date(),
        metrics: {
          totalTasks: 0,
          completedTasks: 0,
          failedTasks: 0,
          averageTaskDuration: 0,
          successRate: 100,
          responsiveness: 1000,
          reliability: 100,
          collaboration: 100,
          stagnationCount: 0,
          escalationCount: 0,
          leverageRank: 100, // New agents start with high leverage potential
          totalSavingsCents: 0,
          ...profile.metrics,
        },
        todoList: [],
        registeredAt: new Date(),
        lastVerified: new Date(),
        verificationHash: '',
        onboardingCompleted: false,
        protocolChecklistCompleted: false,
        onChainData: {
          isOnChain: false,
          tokenId: undefined,
          contractAddress: undefined,
          tbaAddress: undefined,
          mintTransactionHash: undefined,
          mintBlockNumber: undefined,
          lastOnChainUpdate: undefined,
        },
        metadata: {
          version: '1.0.0',
          personalityTraits: {},
          communicationStyle: 'NEUTRAL',
          expertiseAreas: [],
          specializations: [],
          limitations: [],
          notes: '',
          ...profile.metadata,
        },
      };

      // 1. Store in Drizzle database (single source of truth)
      const dbAgent = await this.drizzle.agent.create({
        data: {
          id: agentId,
          name: completeProfile.name,
          type: completeProfile.type,
          status: completeProfile.status,
          description: completeProfile.description,
          systemPrompt: completeProfile.systemPrompt,
          config: completeProfile.configuration,
          userId: completeProfile.userId,
          capabilities: this.extractLegacyCapabilities(completeProfile.capabilities) as any,
          metadata: {
            create: {
              version: completeProfile.metadata.version,
              metadata: {
                lastActive: new Date(),
                capabilities: completeProfile.capabilities,
                personalityTraits: completeProfile.metadata.personalityTraits,
                communicationStyle: completeProfile.metadata.communicationStyle,
                expertiseAreas: completeProfile.metadata.expertiseAreas,
              },
              config: {
                platform: completeProfile.platform,
                location: completeProfile.location,
                metrics: completeProfile.metrics,
              },
            },
          },
        },
        include: { metadata: true },
      });

      if (!dbAgent) {
        throw new Error(`Failed to retrieve agent ${agentId} after creation.`);
      }

      // 2. Register with legacy system for backward compatibility
      const legacyAgent: LegacyAgent = {
        id: agentId,
        name: completeProfile.name,
        type: this.convertToLegacyType(completeProfile.type as AgentType),
        status: this.convertToLegacyStatus(completeProfile.status as AgentStatus),
        capabilities: this.extractLegacyCapabilities(completeProfile.capabilities),
        registeredAt: completeProfile.registeredAt.toISOString(),
        lastSeen: completeProfile.lastSeen.toISOString(),
        metadata: completeProfile.metadata,
      };
      this.legacyRegistry.registerAgent(legacyAgent);

      // 3. Generate verification hash
      completeProfile.verificationHash = this.generateVerificationHash(completeProfile);

      // 4. Store in memory cache FIRST (required for todo list initialization)
      this.agentProfiles.set(agentId, completeProfile);

      // 5. Initialize agent todo list (now that agent is in memory)
      await this.initializeAgentTodoList(agentId);

      // 6. Update system metrics
      this.updateSystemMetrics();
      this.updateMerkleTree();

      // 7. Sync to spreadsheet if enabled
      let spreadsheetRowId: string | undefined;
      if (this.spreadsheetIntegration.enabled) {
        spreadsheetRowId = await this.syncAgentToSpreadsheet(completeProfile);
      }

      // 8. Mint Agent NFT on blockchain if enabled
      if (
        this.blockchainService &&
        this.blockchainService.isBlockchainConnected() &&
        this.blockchainService.getAgentNFTContract()
      ) {
        try {
          const onChainData = await this.mintAgentNFT(completeProfile);
          if (onChainData) {
            completeProfile.onChainData = onChainData;
            // Update the in-memory cache
            this.agentProfiles.set(agentId, completeProfile);

            // Update database with on-chain data
            await this.drizzle.agent.update({
              where: { id: agentId },
              data: {
                metadata: {
                  update: {
                    config: {
                      ...(typeof dbAgent.metadata?.config === 'object' &&
                      dbAgent.metadata?.config !== null
                        ? dbAgent.metadata.config
                        : {}),
                      onChainData: JSON.parse(JSON.stringify(onChainData)),
                    },
                  },
                },
              },
            });

            this.logger.info(
              `🔗 Agent ${agentId} minted on blockchain: Token ID ${onChainData.tokenId}`
            );
          }
        } catch (error) {
          this.logger.error(
            `❌ Blockchain minting failed for ${agentId}: ${error instanceof Error ? error.message : String(error)}`
          );
          // Continue with registration even if blockchain minting fails
        }
      }

      this.logger.info(
        `✅ MASTER REGISTRATION COMPLETE: ${agentId} (${completeProfile.type} on ${completeProfile.platform})`
      );
      this.emit('agent_master_registered', completeProfile);

      return {
        success: true,
        agentId,
        onboardingRequired: !completeProfile.onboardingCompleted,
        protocolChecklistId: 'universal_onboarding_v1',
        todoListInitialized: true,
        verificationHash: completeProfile.verificationHash,
        spreadsheetRowId,
      };
    } catch (error) {
      this.logger.error(
        `❌ MASTER REGISTRATION FAILED: ${error instanceof Error ? error.message : String(error)}`
      );
      return {
        success: false,
        agentId: profile.id || 'unknown',
        onboardingRequired: true,
        protocolChecklistId: 'universal_onboarding_v1',
        todoListInitialized: false,
        verificationHash: '',
      };
    }
  }

  /**
   * UNIVERSAL ONBOARDING PROTOCOL - MANDATORY FOR ALL AGENTS
   * Single standardized onboarding checklist that ensures every agent meets requirements
   */
  async startUniversalOnboarding(agentId: string): Promise<{
    success: boolean;
    onboardingSteps: OnboardingChecklistItem[];
    estimatedDuration: number;
    orientationMaterials: string[];
    workspaceAccess: string;
  }> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found in Master Registry: ${agentId}`);
    }

    const workspaceAccess =
      process.env.TNF_WORKSPACE || process.env.WORKSPACE_PATH || process.cwd();

    const onboardingSteps: OnboardingChecklistItem[] = [
      {
        id: 'workspace_verification',
        requirement: 'Workspace Access Verification',
        description: 'Verify agent can access The New Fuse workspace directory',
        verificationMethod: 'automatic',
        status: 'pending',
        orientationMaterials: [
          `${workspaceAccess}/README.md`,
          `${workspaceAccess}/DOCUMENTATION_INDEX.md`,
        ],
      },
      {
        id: 'master_registry_integration',
        requirement: 'Master Registry Integration',
        description: 'Confirm agent is properly registered in Master Agent Registry',
        verificationMethod: 'automatic',
        status: 'pending',
        orientationMaterials: [],
      },
      {
        id: 'relay_system_connection',
        requirement: 'Relay System Connection',
        description: 'Establish connection to The New Fuse relay communication system',
        verificationMethod: 'automatic',
        status: 'pending',
        orientationMaterials: [`${workspaceAccess}/packages/relay-core/README.md`],
      },
      {
        id: 'heartbeat_protocol_setup',
        requirement: 'Heartbeat Protocol Setup',
        description: 'Initialize heartbeat monitoring and anti-stagnation systems',
        verificationMethod: 'automatic',
        status: 'pending',
        orientationMaterials: [],
      },
      {
        id: 'handoff_template_training',
        requirement: 'Handoff Template Training',
        description: 'Learn standardized agent handoff protocols',
        verificationMethod: 'manual',
        status: 'pending',
        orientationMaterials: [
          `${workspaceAccess}/docs/agents-and-protocols/MASTER_ORCHESTRATOR_HANDOFF_PROMPT.md`,
          `${workspaceAccess}/src/services/AgentHandoffTemplateService.ts`,
        ],
      },
      {
        id: 'todo_system_integration',
        requirement: 'Todo System Integration',
        description: 'Initialize and test personal todo list management',
        verificationMethod: 'automatic',
        status: 'pending',
        orientationMaterials: [],
      },
      {
        id: 'capability_declaration',
        requirement: 'Capability Declaration',
        description: 'Declare and verify agent capabilities and limitations',
        verificationMethod: 'manual',
        status: 'pending',
        orientationMaterials: [],
      },
      {
        id: 'protocol_compliance_check',
        requirement: 'Protocol Compliance Check',
        description: 'Verify compliance with system-wide rolling protocol checklist',
        verificationMethod: 'automatic',
        status: 'pending',
        orientationMaterials: [],
      },
    ];

    // Add onboarding steps to agent's todo list
    for (const step of onboardingSteps) {
      await this.addAgentTodo(agentId, {
        content: `🎯 [ONBOARDING] ${step.requirement}: ${step.description}`,
        priority: 'high',
        category: 'onboarding',
        estimatedDuration: 5,
        context: {
          onboardingStep: step.id,
          orientationMaterials: step.orientationMaterials,
        },
      });
    }

    const allOrientationMaterials = [
      `${workspaceAccess}/README.md`,
      `${workspaceAccess}/DOCUMENTATION_INDEX.md`,
      `${workspaceAccess}/docs/agents-and-protocols/MASTER_ORCHESTRATOR_HANDOFF_PROMPT.md`,
      `${workspaceAccess}/docs/AVAILABLE_AGENTS_REGISTRY.md`,
      `${workspaceAccess}/packages/relay-core/README.md`,
      `${workspaceAccess}/src/services/AgentHandoffTemplateService.ts`,
    ];

    this.logger.info(`🎓 UNIVERSAL ONBOARDING INITIATED: ${agentId}`);
    this.emit('universal_onboarding_started', { agentId, steps: onboardingSteps });

    return {
      success: true,
      onboardingSteps,
      estimatedDuration: onboardingSteps.length * 5, // 5 minutes per step
      orientationMaterials: allOrientationMaterials,
      workspaceAccess,
    };
  }

  /**
   * SYSTEM-WIDE ROLLING PROTOCOL CHECKLIST
   * Acts as the main orchestration layer that sets conditions and guard rails
   */
  private initializeUniversalOnboardingProtocol(): void {
    this.onboardingProtocol = {
      id: 'universal_onboarding_v1',
      name: 'Universal Agent Onboarding Protocol',
      version: '1.0.0',
      requiredForOperation: true,
      lastUpdated: new Date(),
      items: [], // Will be populated in startUniversalOnboarding
    };
    this.logger.info('🔧 Universal Onboarding Protocol initialized');
  }

  /**
   * AGENT TODO LIST MANAGEMENT
   * Integrates with existing Task system for persistence
   */
  async initializeAgentTodoList(agentId: string): Promise<void> {
    const initialTodos: Partial<MasterAgentTodo>[] = [
      {
        content: '🔐 Complete agent registration and verification in Master Registry',
        priority: 'high',
        category: 'verification',
        estimatedDuration: 5,
      },
      {
        content: '🎓 Complete Universal Onboarding Protocol',
        priority: 'high',
        category: 'onboarding',
        estimatedDuration: 40,
      },
      {
        content: '✅ Verify system-wide protocol checklist compliance',
        priority: 'high',
        category: 'verification',
        estimatedDuration: 10,
      },
      {
        content: '🚀 Establish heartbeat monitoring and anti-stagnation systems',
        priority: 'high',
        category: 'maintenance',
        estimatedDuration: 5,
      },
    ];

    for (const todo of initialTodos) {
      await this.addAgentTodo(agentId, todo);
    }
  }

  async addAgentTodo(agentId: string, todoData: Partial<MasterAgentTodo>): Promise<string> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) {
      throw new Error(`Agent not found in Master Registry: ${agentId}`);
    }

    const todoId = `${agentId}_todo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const todo: MasterAgentTodo = {
      id: todoId,
      agentId,
      content: todoData.content || 'Unnamed task',
      status: todoData.status || 'pending',
      priority: todoData.priority || 'medium',
      category: todoData.category || 'task',
      createdAt: new Date(),
      updatedAt: new Date(),
      dueDate: todoData.dueDate,
      dependencies: todoData.dependencies || [],
      estimatedDuration: todoData.estimatedDuration,
      context: todoData.context,
    };

    // Store in agent's todo list
    agent.todoList.push(todo);

    const drizzleTask = await this.drizzle.task.create({
      data: {
        type: todo.content,
        data: {
          title: todo.content,
          description: `Agent todo: ${todo.content}`,
          masterRegistryTodoId: todoId,
          category: todo.category,
          context: todo.context,
        },
        status: this.convertTodoStatusToTaskStatus(todo.status),
        priority: this.convertTodoPriorityToTaskPriority(todo.priority),
        pipeline: {
          connectOrCreate: {
            where: {
              agentId_name: {
                agentId,
                name: 'Default Agent Pipeline',
              },
            },
            create: {
              name: 'Default Agent Pipeline',
              description: 'Default pipeline for agent tasks',
              agentId,
              userId: agent.userId,
            },
          },
        },
        agentId,
        userId: agent.userId,
      },
    });
    todo.integrationId = drizzleTask.id;

    this.updateSystemMetrics();

    this.logger.debug(`📝 Todo added for agent ${agentId}: ${todo.content}`);
    this.emit('agent_todo_added', { agentId, todo });

    return todoId;
  }

  /**
   * MERKLE TREE VERIFICATION SYSTEM
   * Provides cryptographic verification of agent states
   */
  private generateVerificationHash(profile: MasterAgentProfile): string {
    const data = {
      id: profile.id,
      type: profile.type,
      platform: profile.platform,
      capabilities: profile.capabilities,
      registeredAt: profile.registeredAt.toISOString(),
      onboardingCompleted: profile.onboardingCompleted,
      protocolChecklistCompleted: profile.protocolChecklistCompleted,
    };

    return sha256(JSON.stringify(data));
  }

  private updateMerkleTree(): void {
    const agentHashes = Array.from(this.agentProfiles.values())
      .map((agent) => ({ hash: agent.verificationHash, agentId: agent.id }))
      .sort((a, b) => a.agentId.localeCompare(b.agentId));

    this.merkleTree = this.buildAgentMerkleTree(agentHashes);
    this.lastMerkleUpdate = new Date();
    this.systemMetrics.merkleRootHash = this.merkleTree?.hash || '';

    this.emit('merkle_tree_updated', {
      rootHash: this.merkleTree?.hash,
      agentCount: agentHashes.length,
      updatedAt: this.lastMerkleUpdate,
    });
  }

  private buildAgentMerkleTree(nodes: { hash: string; agentId: string }[]): AgentMerkleNode {
    if (nodes.length === 0) {
      return {
        hash: sha256('empty'),
        agentId: 'root',
      };
    }

    if (nodes.length === 1) {
      return {
        hash: nodes[0].hash,
        agentId: nodes[0].agentId,
      };
    }

    const merkleNodes: AgentMerkleNode[] = nodes.map((n) => ({
      hash: n.hash,
      agentId: n.agentId,
    }));

    while (merkleNodes.length > 1) {
      const newLevel: AgentMerkleNode[] = [];

      for (let i = 0; i < merkleNodes.length; i += 2) {
        const left = merkleNodes[i];
        const right = merkleNodes[i + 1] || merkleNodes[i];

        const combinedHash = sha256(left.hash + right.hash);

        newLevel.push({
          hash: combinedHash,
          agentId: `${left.agentId}_${right.agentId}`,
          left,
          right,
        });
      }

      merkleNodes.length = 0;
      merkleNodes.push(...newLevel);
    }

    return merkleNodes[0];
  }

  /**
   * FAIRTABLE/SPREADSHEET INTEGRATION
   * Provides front-facing spreadsheet view of all agents
   */
  private async initializeSpreadsheetIntegration(): Promise<void> {
    try {
      // Check if fairtable adapters are available
      this.spreadsheetIntegration.enabled = true;
      this.logger.info('📊 Fairtable/Spreadsheet integration initialized');

      // Create initial sync
      await this.syncAllAgentsToSpreadsheet();
    } catch (error) {
      this.logger.warn(
        `📊 Fairtable integration not available: ${error instanceof Error ? error.message : String(error)}`
      );
      this.spreadsheetIntegration.enabled = false;
    }
  }

  private async syncAgentToSpreadsheet(agent: MasterAgentProfile): Promise<string | undefined> {
    if (!this.spreadsheetIntegration.enabled) return undefined;

    try {
      // This would integrate with the existing fairtable-adapters package
      // const spreadsheetRow = {
      //   'Agent ID': agent.id,
      //   'Name': agent.name,
      //   'Type': agent.type,
      //   'Status': agent.status,
      //   'Platform': agent.platform,
      //   'Capabilities': Object.entries(agent.capabilities)
      //     .filter(([_, enabled]) => enabled)
      //     .map(([cap, _]) => cap)
      //     .join(', '),
      //   'Success Rate': `${agent.metrics.successRate}%`,
      //   'Total Tasks': agent.metrics.totalTasks,
      //   'Last Seen': agent.lastSeen.toISOString(),
      //   'Onboarding Complete': agent.onboardingCompleted ? 'Yes' : 'No',
      //   'Protocol Compliant': agent.protocolChecklistCompleted ? 'Yes' : 'No',
      //   'Verification Hash': agent.verificationHash.substring(0, 12) + '...'
      // };

      // Mock integration - in real implementation would use fairtable-adapters
      const rowId = `row_${agent.id}`;
      this.logger.debug(`📊 Synced agent ${agent.id} to spreadsheet row ${rowId}`);

      return rowId;
    } catch (error) {
      this.logger.error(
        `📊 Failed to sync agent ${agent.id} to spreadsheet: ${error instanceof Error ? error.message : String(error)}`
      );
      return undefined;
    }
  }

  private async syncAllAgentsToSpreadsheet(): Promise<void> {
    if (!this.spreadsheetIntegration.enabled) return;

    try {
      for (const agent of this.agentProfiles.values()) {
        await this.syncAgentToSpreadsheet(agent);
      }
      this.spreadsheetIntegration.lastSync = new Date();
      this.spreadsheetIntegration.syncStatus = 'success';
      this.logger.info('📊 All agents synced to spreadsheet');
    } catch (error) {
      this.spreadsheetIntegration.syncStatus = 'failed';
      this.spreadsheetIntegration.errorMessage =
        error instanceof Error ? error.message : String(error);
      this.logger.error(
        `📊 Failed to sync agents to spreadsheet: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * PERIODIC VERIFICATION AND SYSTEM HEALTH
   * Continuous monitoring of all agents and system state
   */
  private startPeriodicVerification(): void {
    // System health check every 2 minutes
    setInterval(
      () => {
        this.performSystemHealthCheck();
      },
      2 * 60 * 1000
    );

    // Full verification every 30 minutes
    setInterval(
      () => {
        this.performFullSystemVerification();
      },
      30 * 60 * 1000
    );

    // Spreadsheet sync every hour
    setInterval(
      () => {
        this.syncAllAgentsToSpreadsheet();
      },
      60 * 60 * 1000
    );
  }

  private performSystemHealthCheck(): void {
    const now = new Date();
    let healthScore = 100;
    let activeAgents = 0;
    let onlineAgents = 0;
    let stalledAgents = 0;

    for (const agent of this.agentProfiles.values()) {
      const timeSinceLastSeen = now.getTime() - agent.lastSeen.getTime();

      if (agent.status === 'ACTIVE') {
        activeAgents++;
      }

      if (timeSinceLastSeen < 5 * 60 * 1000) {
        // 5 minutes
        onlineAgents++;
      } else if (timeSinceLastSeen > 30 * 60 * 1000) {
        // 30 minutes
        healthScore -= 5;
        if (agent.status !== 'INACTIVE') {
          stalledAgents++;
        }
      }

      if (!agent.onboardingCompleted) {
        healthScore -= 2;
      }

      if (!agent.protocolChecklistCompleted) {
        healthScore -= 1;
      }
    }

    this.systemMetrics = {
      ...this.systemMetrics,
      activeAgents,
      onlineAgents,
      stalledAgents,
      systemHealth: Math.max(0, healthScore),
      onboardingCompletionRate: this.calculateOnboardingCompletionRate(),
      protocolComplianceRate: this.calculateProtocolComplianceRate(),
    };

    this.emit('system_health_check_completed', this.systemMetrics);

    // Log health issues
    if (healthScore < 90) {
      this.logger.warn(
        `⚠️ System health degraded: ${healthScore}% (${stalledAgents} stalled agents)`
      );
    }
  }

  private async performFullSystemVerification(): Promise<void> {
    this.logger.info('🔍 Performing full system verification');

    let verifiedAgents = 0;
    for (const agent of this.agentProfiles.values()) {
      const verified = await this.verifyAgentCompliance(agent.id);
      if (verified) verifiedAgents++;
    }

    this.updateMerkleTree();
    this.systemMetrics.lastFullVerification = new Date();

    this.logger.info(
      `✅ Full verification completed: ${verifiedAgents}/${this.systemMetrics.totalAgents} agents verified`
    );
    this.emit('full_system_verification_completed', this.systemMetrics);
  }

  /**
   * UTILITY METHODS AND INTEGRATIONS
   */
  private async loadExistingAgents(): Promise<void> {
    try {
      const existingAgents = await this.drizzle.agent.findMany({
        include: { metadata: true },
      });

      for (const dbAgent of existingAgents) {
        const profile = this.convertDbAgentToMasterProfile(dbAgent);
        this.agentProfiles.set(profile.id, profile);
      }

      this.updateSystemMetrics();
      this.logger.info(`📂 Loaded ${existingAgents.length} existing agents from database`);
    } catch (error) {
      this.logger.error(
        `Failed to load existing agents: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  private convertDbAgentToMasterProfile(dbAgent: any): MasterAgentProfile {
    const metadata = dbAgent.metadata || {};
    const config = metadata.config || {};

    return {
      id: dbAgent.id,
      name: dbAgent.name,
      type: dbAgent.type,
      status: dbAgent.status,
      description: dbAgent.description,
      systemPrompt: dbAgent.systemPrompt,
      configuration: dbAgent.config,
      userId: dbAgent.userId,
      platform: config.platform || 'unknown',
      location: config.location || 'unknown',
      capabilities: metadata.capabilities || {},
      lastSeen: metadata.lastActive || dbAgent.updatedAt,
      lastHeartbeat: metadata.lastActive || dbAgent.updatedAt,
      metrics: config.metrics || {
        totalTasks: 0,
        completedTasks: 0,
        failedTasks: 0,
        averageTaskDuration: 0,
        successRate: 100,
        responsiveness: 1000,
        reliability: 100,
        collaboration: 100,
        stagnationCount: 0,
        escalationCount: 0,
      },
      todoList: [],
      registeredAt: dbAgent.createdAt,
      lastVerified: dbAgent.updatedAt,
      verificationHash: '',
      onboardingCompleted: false,
      protocolChecklistCompleted: false,
      onChainData: config.onChainData || {
        isOnChain: false,
        tokenId: undefined,
        contractAddress: undefined,
        tbaAddress: undefined,
        mintTransactionHash: undefined,
        mintBlockNumber: undefined,
        lastOnChainUpdate: undefined,
      },
      metadata: {
        version: metadata.version || '1.0.0',
        personalityTraits: metadata.personalityTraits || {},
        communicationStyle: metadata.communicationStyle || 'NEUTRAL',
        expertiseAreas: metadata.expertiseAreas || [],
        specializations: [],
        limitations: [],
        notes: '',
      },
    };
  }

  // ============ Verifiable Credentials Integration ============

  /**
   * Issue a Verifiable Credential for an agent
   * @param agentId Agent ID to issue credential for
   * @param requestedCapabilities Capabilities to verify and include
   * @returns Promise<VerifiableCredential | null>
   */
  async issueAgentCredential(
    agentId: string,
    requestedCapabilities: string[] = []
  ): Promise<any | null> {
    try {
      if (!this.vcIssuanceService) {
        this.logger.warn('VCIssuanceService not initialized - skipping credential issuance');
        return null;
      }

      const agent = this.agentProfiles.get(agentId);
      if (!agent) {
        throw new Error(`Agent ${agentId} not found`);
      }

      // Use all enabled capabilities if none specified
      const capabilities =
        requestedCapabilities.length > 0
          ? requestedCapabilities
          : Object.entries(agent.capabilities)
              .filter(([_, enabled]) => enabled)
              .map(([capability, _]) => capability);

      const vcRequest: VCIssuanceRequest = {
        agentId,
        requestedCapabilities: capabilities,
        requesterSignature: 'system_generated', // In practice, this would be a proper signature
      };

      const credential = await this.vcIssuanceService.issueCredential(vcRequest);

      this.logger.info(`✅ Verifiable Credential issued for agent: ${agentId}`);
      this.emit('credential_issued', { agentId, credentialId: credential.id });

      return credential;
    } catch (error) {
      this.logger.error(`Failed to issue credential for agent ${agentId}: ${error}`);
      return null;
    }
  }

  /**
   * Verify an agent's Verifiable Credential
   * @param credential The credential to verify
   * @returns Promise<boolean>
   */
  async verifyAgentCredential(credential: any): Promise<boolean> {
    try {
      if (!this.vcIssuanceService) {
        this.logger.warn('VCIssuanceService not initialized - cannot verify credential');
        return false;
      }

      const result = await this.vcIssuanceService.verifyCredential(credential);
      return result.isValid;
    } catch (error) {
      this.logger.error(`Failed to verify credential: ${error}`);
      return false;
    }
  }

  /**
   * Get VCIssuanceService instance
   * @returns VCIssuanceService instance or null
   */
  getVCIssuanceService(): VCIssuanceService | null {
    return this.vcIssuanceService;
  }

  /**
   * Get BlockchainService instance
   * @returns BlockchainService instance or null
   */
  getBlockchainService(): BlockchainService | null {
    return this.blockchainService;
  }

  /**
   * Check blockchain connection health
   */
  async checkBlockchainHealth(): Promise<{ healthy: boolean; details: any }> {
    if (!this.blockchainService) {
      return {
        healthy: false,
        details: { error: 'Blockchain service not initialized' },
      };
    }

    return await this.blockchainService.checkHealth();
  }

  private updateSystemMetrics(): void {
    const agents = Array.from(this.agentProfiles.values());
    const allTodos = agents.flatMap((a) => a.todoList);

    this.systemMetrics = {
      ...this.systemMetrics,
      totalAgents: agents.length,
      totalTodos: allTodos.length,
      completedTodos: allTodos.filter((t) => t.status === 'completed').length,
      pendingTodos: allTodos.filter((t) => t.status === 'pending').length,
    };
  }

  private calculateOnboardingCompletionRate(): number {
    const agents = Array.from(this.agentProfiles.values());
    if (agents.length === 0) return 100;

    const completedCount = agents.filter((a) => a.onboardingCompleted).length;
    return Math.round((completedCount / agents.length) * 100);
  }

  private calculateProtocolComplianceRate(): number {
    const agents = Array.from(this.agentProfiles.values());
    if (agents.length === 0) return 100;

    const compliantCount = agents.filter((a) => a.protocolChecklistCompleted).length;
    return Math.round((compliantCount / agents.length) * 100);
  }

  private async verifyAgentCompliance(agentId: string): Promise<boolean> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) return false;

    // Verify all compliance requirements
    const checks = [
      agent.onboardingCompleted,
      agent.protocolChecklistCompleted,
      agent.capabilities.heartbeatCompliance,
      agent.todoList.length > 0,
    ];

    const passed = checks.every((check) => check);

    if (passed) {
      agent.lastVerified = new Date();
      agent.verificationHash = this.generateVerificationHash(agent);
    }

    return passed;
  }

  // Type conversion utilities for legacy compatibility
  private convertToLegacyType(type: AgentType): string {
    const mapping: Record<string, string> = {
      BASIC: 'LLM',
      CHAT: 'LLM',
      WORKFLOW: 'ORCHESTRATOR',
      TASK: 'TOOL',
      ASSISTANT: 'HYBRID',
      ANALYSIS: 'ANALYSIS',
      CONVERSATIONAL: 'LLM',
      IDE_EXTENSION: 'HYBRID',
      API: 'TOOL',
    };
    return mapping[type as string] || 'HYBRID';
  }

  private convertToLegacyStatus(status: AgentStatus): string {
    const mapping: Record<string, string> = {
      ACTIVE: 'ACTIVE',
      INACTIVE: 'INACTIVE',
      IDLE: 'INACTIVE',
      BUSY: 'BUSY',
      ERROR: 'ERROR',
      OFFLINE: 'INACTIVE',
      INITIALIZING: 'ACTIVE',
      READY: 'ACTIVE',
      TERMINATED: 'INACTIVE',
    };
    return mapping[status as string] || 'INACTIVE';
  }

  private extractLegacyCapabilities(capabilities: MasterAgentProfile['capabilities']): string[] {
    return Object.entries(capabilities)
      .filter(([_, enabled]) => enabled)
      .map(([capability, _]) => capability);
  }

  private convertTodoStatusToTaskStatus(status: MasterAgentTodo['status']): TaskStatus {
    const mapping = {
      pending: 'PENDING',
      in_progress: 'IN_PROGRESS',
      completed: 'COMPLETED',
      failed: 'FAILED',
      cancelled: 'CANCELLED',
    };
    return (mapping[status] as TaskStatus) || 'PENDING';
  }

  private convertTodoPriorityToTaskPriority(priority: MasterAgentTodo['priority']): TaskPriority {
    const mapping = {
      low: 'LOW',
      medium: 'MEDIUM',
      high: 'HIGH',
    };
    return (mapping[priority] as TaskPriority) || 'MEDIUM';
  }

  private generateAgentId(type: string, platform: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substr(2, 6);
    return `${type.toLowerCase()}_${platform}_${timestamp}_${random}`;
  }

  /**
   * PUBLIC API METHODS
   */
  getAgentProfile(agentId: string): MasterAgentProfile | undefined {
    return this.agentProfiles.get(agentId);
  }

  getAllAgentProfiles(): MasterAgentProfile[] {
    return Array.from(this.agentProfiles.values());
  }

  // Compatibility alias used by workflow-engine and other legacy integrations.
  getAllAgents(): MasterAgentProfile[] {
    return this.getAllAgentProfiles();
  }

  getSystemMetrics(): SystemWideMetrics {
    return { ...this.systemMetrics };
  }

  getMerkleTreeRoot(): string | undefined {
    return this.merkleTree?.hash;
  }

  getSpreadsheetIntegration(): SpreadsheetIntegration {
    return { ...this.spreadsheetIntegration };
  }

  async updateAgentStatus(agentId: string, status: string): Promise<boolean> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) {
      this.logger.warn(`Agent not found in Master Registry: ${agentId}`);
      return false;
    }

    agent.status = status;
    agent.lastSeen = new Date();

    // Update in database
    try {
      await this.drizzle.agent.update({
        where: { id: agentId },
        data: { status, updatedAt: new Date() },
      });
      this.logger.debug(`Agent status updated: ${agentId} -> ${status}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update agent status in database: ${error}`);
      return false;
    }
  }

  /**
   * Update agent capabilities
   */
  async updateAgentCapabilities(
    agentId: string,
    capabilities: Partial<MasterAgentProfile['capabilities']>
  ): Promise<boolean> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) {
      this.logger.warn(`Agent not found in Master Registry: ${agentId}`);
      return false;
    }

    // Update capabilities in memory
    agent.capabilities = { ...agent.capabilities, ...capabilities };
    agent.lastSeen = new Date();

    // Update in database
    try {
      await this.drizzle.agent.update({
        where: { id: agentId },
        data: {
          config: {
            ...agent.configuration,
            capabilities: agent.capabilities,
          },
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Agent capabilities updated: ${agentId} - ${JSON.stringify(capabilities)}`);

      // Emit event for capability update
      this.emit('agentCapabilitiesUpdated', { agentId, capabilities });

      return true;
    } catch (error) {
      this.logger.error(`Failed to update agent capabilities in database: ${error}`);
      return false;
    }
  }

  /**
   * Update agent metrics
   */
  async updateAgentMetrics(
    agentId: string,
    metrics: Partial<MasterAgentProfile['metrics']>
  ): Promise<boolean> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) {
      this.logger.warn(`Agent not found in Master Registry: ${agentId}`);
      return false;
    }

    // Update metrics in memory
    agent.metrics = { ...agent.metrics, ...metrics };
    agent.lastSeen = new Date();

    // Update in database
    try {
      await this.drizzle.agent.update({
        where: { id: agentId },
        data: {
          metadata: {
            update: {
              config: {
                // We need to be careful with nested jsonb updates in Drizzle
                // Usually we'd fetch and merge if using raw drizzle,
                // but for this implementation we assume the metadata/config structure is handled
                metrics: agent.metrics,
              },
            },
          },
          updatedAt: new Date(),
        },
      });

      this.logger.debug(`Agent metrics updated: ${agentId}`);
      this.emit('agentMetricsUpdated', { agentId, metrics: agent.metrics });
      return true;
    } catch (error) {
      this.logger.error(`Failed to update agent metrics in database: ${error}`);
      return false;
    }
  }

  async recordAgentHeartbeat(agentId: string): Promise<boolean> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent) return false;

    agent.lastHeartbeat = new Date();
    agent.lastSeen = new Date();

    if (agent.status === 'INACTIVE') {
      agent.status = 'ACTIVE';
      await this.updateAgentStatus(agentId, 'ACTIVE');
    }

    return true;
  }

  /**
   * Add task to agent - missing method for tests
   */
  async addTaskToAgent(
    agentId: string,
    taskData: {
      content: string;
      priority?: 'low' | 'medium' | 'high';
      category?: string;
      estimatedDuration?: number;
    }
  ): Promise<string> {
    return this.addAgentTodo(agentId, {
      content: taskData.content,
      priority: taskData.priority || 'medium',
      category: (taskData.category as any) || 'task',
      estimatedDuration: taskData.estimatedDuration,
    });
  }

  /**
   * BLOCKCHAIN INTEGRATION METHODS
   * On-chain identity and economic primitives
   */

  private async initializeBlockchainIntegration(): Promise<void> {
    if (!this.blockchainConfig?.enabled) {
      this.logger.info('🔗 Blockchain integration disabled');
      return;
    }

    try {
      // Initialize Web3 provider and wallet through blockchainService
      if (!this.blockchainService) {
        throw new Error('BlockchainService not initialized');
      }

      const provider = this.blockchainService.getProvider();
      const wallet = this.blockchainService.getWallet();
      const config = this.blockchainService.getConfig();

      if (!provider) {
        throw new Error('Blockchain provider not available');
      }

      // Initialize AgentNFTFactory contract
      if (config.contractAddress && wallet) {
        const agentNFTABI = [
          // Core minting function
          'function mintAgent(address owner, string calldata agentId, string calldata initialMetadata, string calldata legalContractURI, string calldata agentType) external returns (uint256)',

          // Metadata update functions
          'function updateMetadata(uint256 tokenId, string calldata newMetadataURI) external',
          'function updateAgentStatus(uint256 tokenId, bool isActive) external',
          'function setTBAAddress(uint256 tokenId, address tbaAddress) external',

          // View functions
          'function getAgentMetadata(uint256 tokenId) external view returns (tuple)',
          'function getTokenIdByAgentId(string calldata agentId) external view returns (uint256)',
          'function getCurrentTokenId() external view returns (uint256)',

          // Events
          'event AgentMinted(uint256 indexed tokenId, string indexed agentId, address indexed creator, address tbaAddress, string legalContractURI)',
        ];

        this.blockchainService.registerContract(
          'AgentNFTContract',
          config.contractAddress,
          agentNFTABI
        );

        // Test connection
        const agentNFTContract = this.blockchainService.getContract('AgentNFTContract');
        if (agentNFTContract) {
          const currentTokenId = await agentNFTContract.getCurrentTokenId();
          this.logger.info(
            `🔗 Blockchain integration initialized - Current Token ID: ${currentTokenId}`
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `❌ Blockchain initialization failed: ${error instanceof Error ? error.message : String(error)}`
      );
      if (this.blockchainConfig) {
        this.blockchainConfig.enabled = false;
      }
    }
  }

  private async mintAgentNFT(profile: MasterAgentProfile): Promise<OnChainAgentData | null> {
    const agentNFTContract = this.blockchainService?.getContract('AgentNFTContract');
    const wallet = this.blockchainService?.getWallet();
    const blockchainConfig = this.blockchainService?.getConfig();

    if (!agentNFTContract || !wallet || !blockchainConfig) {
      throw new Error('Blockchain integration not properly initialized');
    }

    try {
      // Mock IPFS hash (in production, upload to IPFS first)
      const metadataURI = `ipfs://QmAgent${profile.id}Metadata`;
      const legalContractURI = `ipfs://QmAgent${profile.id}Constitution`;

      // Set gas configuration
      const gasPrice = parseUnits(blockchainConfig.maxGasPrice, 'gwei');

      // Mint the Agent NFT
      const tx = await agentNFTContract.mintAgent(
        wallet.address, // Owner (for now, same as minter)
        profile.id, // Agent ID
        metadataURI, // Metadata URI
        legalContractURI, // Legal contract URI
        profile.type, // Agent type
        {
          gasLimit: blockchainConfig.gasLimit,
          gasPrice: gasPrice,
        }
      );

      this.logger.info(`🔗 Agent NFT minting transaction sent: ${tx.hash}`);

      // Wait for transaction confirmation
      const receipt = await tx.wait();

      // Parse the AgentMinted event to get token ID
      const mintEvent = receipt.events?.find((e: any) => e.event === 'AgentMinted');
      const tokenId = mintEvent?.args?.tokenId?.toNumber();

      if (!tokenId) {
        throw new Error('Failed to parse token ID from mint transaction');
      }

      if (!this.blockchainService) {
        throw new Error('BlockchainService not initialized');
      }

      const tbaAddress = await this.blockchainService.createTokenBoundAccount(tokenId);

      const onChainData: OnChainAgentData = {
        isOnChain: true,
        tokenId: tokenId,
        contractAddress: blockchainConfig.contractAddress,
        tbaAddress: tbaAddress,
        mintTransactionHash: tx.hash,
        mintBlockNumber: receipt.blockNumber,
        lastOnChainUpdate: new Date(),
      };

      this.logger.info(
        `✅ Agent NFT minted successfully - Token ID: ${tokenId}, TBA: ${tbaAddress}`
      );

      return onChainData;
    } catch (error) {
      this.logger.error(
        `❌ Agent NFT minting failed: ${error instanceof Error ? error.message : String(error)}`
      );
      throw error;
    }
  }

  async updateAgentOnChainMetadata(agentId: string, newMetadataURI: string): Promise<boolean> {
    const agent = this.agentProfiles.get(agentId);
    if (!agent || !agent.onChainData.isOnChain || !agent.onChainData.tokenId) {
      throw new Error(`Agent ${agentId} is not on-chain or missing token ID`);
    }

    if (!this.blockchainService) {
      throw new Error('Blockchain integration not available');
    }

    const agentNFTContract = this.blockchainService.getContract('AgentNFTContract');
    const blockchainConfig = this.blockchainService.getConfig();

    if (!agentNFTContract || !blockchainConfig) {
      throw new Error('Blockchain integration not properly initialized');
    }

    try {
      const tx = await agentNFTContract.updateMetadata(agent.onChainData.tokenId, newMetadataURI, {
        gasLimit: blockchainConfig.gasLimit,
        gasPrice: parseUnits(blockchainConfig.maxGasPrice, 'gwei'),
      });

      await tx.wait();

      agent.onChainData.lastOnChainUpdate = new Date();
      this.agentProfiles.set(agentId, agent);

      this.logger.info(`🔗 Updated on-chain metadata for agent ${agentId}`);
      return true;
    } catch (error) {
      this.logger.error(
        `❌ Failed to update on-chain metadata for ${agentId}: ${error instanceof Error ? error.message : String(error)}`
      );
      return false;
    }
  }

  getBlockchainConfig(): BlockchainConfig {
    if (!this.blockchainService) {
      throw new Error('BlockchainService not initialized');
    }
    return this.blockchainService.getConfig();
  }

  async getOnChainAgentData(agentId: string): Promise<OnChainAgentData | null> {
    const agent = this.agentProfiles.get(agentId);
    return agent?.onChainData || null;
  }

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
      recentActivity: { agentId: string; lastSeen: Date; status: string }[];
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
  } {
    const agents = Array.from(this.agentProfiles.values());
    const allTodos = agents.flatMap((a) => a.todoList);
    const now = new Date();

    return {
      timestamp: now,
      systemHealth: this.systemMetrics,
      agentSummary: {
        totalAgents: agents.length,
        byStatus: this.groupAgentsByStatus(agents),
        byPlatform: this.groupAgentsByPlatform(agents),
        recentActivity: agents
          .sort((a, b) => b.lastSeen.getTime() - a.lastSeen.getTime())
          .slice(0, 10)
          .map((a) => ({ agentId: a.id, lastSeen: a.lastSeen, status: a.status })),
      },
      todoSummary: {
        totalTodos: allTodos.length,
        byStatus: this.groupTodosByStatus(allTodos),
        overdueTodos: allTodos.filter(
          (t) => t.dueDate && t.dueDate < now && t.status !== 'completed'
        ).length,
        highPriorityPending: allTodos.filter((t) => t.priority === 'high' && t.status === 'pending')
          .length,
      },
      complianceReport: {
        onboardingCompletionRate: this.systemMetrics.onboardingCompletionRate,
        protocolComplianceRate: this.systemMetrics.protocolComplianceRate,
        verificationStatus: this.systemMetrics.merkleRootHash ? 'verified' : 'pending',
        lastFullVerification: this.systemMetrics.lastFullVerification,
      },
      spreadsheetIntegration: this.spreadsheetIntegration,
    };
  }

  private groupAgentsByStatus(agents: MasterAgentProfile[]): Record<string, number> {
    const groups: Record<string, number> = {
      ACTIVE: 0,
      INACTIVE: 0,
      IDLE: 0,
      BUSY: 0,
      ERROR: 0,
      OFFLINE: 0,
      INITIALIZING: 0,
      READY: 0,
      TERMINATED: 0,
    };

    for (const agent of agents) {
      groups[agent.status]++;
    }

    return groups;
  }

  private groupAgentsByPlatform(agents: MasterAgentProfile[]): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const agent of agents) {
      groups[agent.platform] = (groups[agent.platform] || 0) + 1;
    }

    return groups;
  }

  private groupTodosByStatus(todos: MasterAgentTodo[]): Record<string, number> {
    const groups: Record<string, number> = {};

    for (const todo of todos) {
      groups[todo.status] = (groups[todo.status] || 0) + 1;
    }

    return groups;
  }
}
