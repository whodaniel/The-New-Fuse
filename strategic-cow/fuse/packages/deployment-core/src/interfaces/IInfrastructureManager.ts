/**
 * Infrastructure Manager Interface
 * Defines the contract for infrastructure management operations
 */

import {
  InfrastructureTemplate,
  InfrastructureUpdate,
  InfrastructureChange,
  ExecutionPlan,
  ProvisionResult,
  UpdateResult,
  DestroyResult,
  ValidationResult,
  PlanResult,
  ApplyResult,
  InfrastructureState,
  CloudProvider
} from '../types/infrastructure';

export interface IInfrastructureManager {
  /**
   * Provision infrastructure from a template
   */
  provisionInfrastructure(template: InfrastructureTemplate): Promise<ProvisionResult>;

  /**
   * Update existing infrastructure
   */
  updateInfrastructure(update: InfrastructureUpdate): Promise<UpdateResult>;

  /**
   * Destroy infrastructure and all associated resources
   */
  destroyInfrastructure(resourceId: string): Promise<DestroyResult>;

  /**
   * Validate infrastructure template
   */
  validateTemplate(template: InfrastructureTemplate): Promise<ValidationResult>;

  /**
   * Plan infrastructure changes
   */
  planChanges(changes: InfrastructureChange[]): Promise<PlanResult>;

  /**
   * Apply planned changes
   */
  applyChanges(plan: ExecutionPlan): Promise<ApplyResult>;

  /**
   * Get infrastructure state
   */
  getInfrastructureState(infrastructureId: string): Promise<InfrastructureState>;

  /**
   * List all infrastructure instances
   */
  listInfrastructure(filters?: InfrastructureFilters): Promise<InfrastructureState[]>;

  /**
   * Import existing infrastructure
   */
  importInfrastructure(importConfig: InfrastructureImportConfig): Promise<ProvisionResult>;

  /**
   * Export infrastructure configuration
   */
  exportInfrastructure(infrastructureId: string): Promise<InfrastructureTemplate>;

  /**
   * Lock infrastructure state for exclusive access
   */
  lockInfrastructure(infrastructureId: string, lockReason: string): Promise<void>;

  /**
   * Unlock infrastructure state
   */
  unlockInfrastructure(infrastructureId: string): Promise<void>;

  /**
   * Get infrastructure metrics and health
   */
  getInfrastructureMetrics(infrastructureId: string): Promise<InfrastructureMetrics>;

  /**
   * Refresh infrastructure state from actual resources
   */
  refreshState(infrastructureId: string): Promise<InfrastructureState>;
}

export interface InfrastructureFilters {
  environment?: string;
  provider?: CloudProvider;
  tags?: Record<string, string>;
  status?: string[];
  createdAfter?: Date;
  createdBefore?: Date;
}

export interface InfrastructureImportConfig {
  provider: CloudProvider;
  region: string;
  resourceIds: string[];
  templateName: string;
  environment: string;
  tags?: Record<string, string>;
}

export interface InfrastructureMetrics {
  infrastructureId: string;
  resourceCount: number;
  healthStatus: HealthStatus;
  costMetrics: CostMetrics;
  performanceMetrics: PerformanceMetrics;
  securityMetrics: SecurityMetrics;
  lastUpdated: Date;
}

export interface HealthStatus {
  overall: HealthLevel;
  resources: ResourceHealth[];
  issues: HealthIssue[];
}

export enum HealthLevel {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  UNKNOWN = 'unknown'
}

export interface ResourceHealth {
  resourceName: string;
  status: HealthLevel;
  lastCheck: Date;
  issues: string[];
}

export interface HealthIssue {
  severity: IssueSeverity;
  message: string;
  resourceName?: string;
  recommendation: string;
}

export enum IssueSeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  INFO = 'info'
}

export interface CostMetrics {
  currentMonthlyCost: number;
  projectedMonthlyCost: number;
  costTrend: CostTrend;
  costByResource: ResourceCost[];
  optimizationOpportunities: CostOptimization[];
}

export enum CostTrend {
  INCREASING = 'increasing',
  DECREASING = 'decreasing',
  STABLE = 'stable'
}

export interface ResourceCost {
  resourceName: string;
  monthlyCost: number;
  percentage: number;
}

export interface CostOptimization {
  type: OptimizationType;
  resourceName: string;
  currentCost: number;
  potentialSavings: number;
  recommendation: string;
}

export enum OptimizationType {
  RIGHT_SIZING = 'right_sizing',
  RESERVED_INSTANCES = 'reserved_instances',
  SPOT_INSTANCES = 'spot_instances',
  STORAGE_OPTIMIZATION = 'storage_optimization',
  NETWORK_OPTIMIZATION = 'network_optimization'
}

export interface PerformanceMetrics {
  responseTime: number;
  throughput: number;
  errorRate: number;
  availability: number;
  resourceUtilization: ResourceUtilization[];
}

export interface ResourceUtilization {
  resourceName: string;
  cpuUtilization: number;
  memoryUtilization: number;
  storageUtilization: number;
  networkUtilization: number;
}

export interface SecurityMetrics {
  securityScore: number;
  vulnerabilities: SecurityVulnerability[];
  complianceStatus: ComplianceStatus[];
  securityRecommendations: SecurityRecommendation[];
}

export interface SecurityVulnerability {
  id: string;
  severity: VulnerabilitySeverity;
  description: string;
  resourceName: string;
  remediation: string;
}

export enum VulnerabilitySeverity {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}

export interface ComplianceStatus {
  framework: string;
  status: ComplianceLevel;
  score: number;
  failedControls: string[];
}

export enum ComplianceLevel {
  COMPLIANT = 'compliant',
  NON_COMPLIANT = 'non_compliant',
  PARTIALLY_COMPLIANT = 'partially_compliant',
  NOT_ASSESSED = 'not_assessed'
}

export interface SecurityRecommendation {
  type: SecurityRecommendationType;
  priority: RecommendationPriority;
  description: string;
  resourceName?: string;
  implementation: string;
}

export enum SecurityRecommendationType {
  ACCESS_CONTROL = 'access_control',
  ENCRYPTION = 'encryption',
  NETWORK_SECURITY = 'network_security',
  MONITORING = 'monitoring',
  PATCH_MANAGEMENT = 'patch_management'
}

export enum RecommendationPriority {
  CRITICAL = 'critical',
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low'
}