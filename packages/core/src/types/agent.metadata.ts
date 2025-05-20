import { AgentCapability, AgentToolType } from '../../types/src/agent.js';

export enum ChangeType {
  CAPABILITY = 'capability',
  PERSONALITY = 'personality',
  EXPERTISE = 'expertise',
  COMMUNICATION = 'communication',
  CONFIG = 'config',
  GENERAL = 'general'
}

export interface MetadataChange {
  id?: string;
  versionId: string;
  changeType: ChangeType;
  oldValue?: unknown;
  newValue: unknown;
  timestamp?: Date;
  reason?: string;
}

export interface PerformanceMetrics {
  responseTime: number;
  tokenUsage?: number;
  errorRate: number;
  successRate: number;
  completionTime?: number;
  timestamp?: Date;
  details?: Record<string, unknown>;
}

export interface AgentMetadata {
  // Basic Information
  version: string;
  createdAt: Date;
  updatedAt: Date;
  lastActive?: Date;
  lastHeartbeat?: Date;

  // Core Capabilities
  capabilities: AgentCapability[];
  tools?: AgentToolType[];
  personalityTraits: string[];
  communicationStyle: string;
  expertiseAreas: string[];

  // Performance Metrics
  performance?: {
    responseTime?: number;
    tokenUsage?: number;
    errorRate?: number;
    successRate?: number;
    totalTasks?: number;
    averageResponseTime?: number;
    userSatisfaction?: number;
    accuracyScore?: number;
  };

  // Usage Statistics
  usage?: {
    totalRequests?: number;
    activeUsers?: number;
    peakConcurrency?: number;
    resourceUtilization?: number;
  };

  // Learning & Development
  skillDevelopment?: {
    currentLevel: number;
    targetLevel: number;
    learningPath: string[];
    progress: number;
    adaptiveCapabilities?: string[];
    learningStyle?: string;
  };

  // Reasoning & Decision Making
  reasoningStrategies?: {
    primaryMethod: string;
    fallbackMethods: string[];
    decisionMakingStyle: string;
    problemSolvingApproach: string;
  };

  // Character Development
  characterArcs?: {
    currentArc: string;
    progressionStage: string;
    milestones: Array<{
      description: string;
      achieved: boolean;
      timestamp?: Date;
    }>;
  };

  // Integration & Relationships
  relationships?: {
    collaborators: string[];
    dependencies: string[];
    integrations: Array<{
      service: string;
      status: string;
      permissions: string[];
    }>;
  };

  // Configuration & State
  config?: Record<string, unknown>;
  state?: {
    currentContext?: string;
    activeProcesses?: string[];
    memoryUtilization?: number;
    systemLoad?: number;
  };
}