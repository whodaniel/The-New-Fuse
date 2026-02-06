/**
 * Infrastructure as Code Types
 * Defines types for infrastructure management, provisioning, and lifecycle
 */

export enum CloudProvider {
  GCP = 'gcp',
}

export enum ResourceType {
  COMPUTE = 'compute',
  STORAGE = 'storage',
  NETWORK = 'network',
  DATABASE = 'database',
  SECURITY_GROUP = 'security_group',
  COMPUTE_ENGINE = 'compute_engine',
  CLOUD_STORAGE = 'cloud_storage',
  VPC_NETWORK = 'vpc_network',
  CLOUD_SQL = 'cloud_sql',
  LOAD_BALANCER = 'load_balancer',
  FIREWALL_RULE = 'firewall_rule',
  IAM_ROLE = 'iam_role',
  CLOUD_DNS = 'cloud_dns',
  SSL_CERTIFICATE = 'ssl_certificate',
  CONTAINER_REGISTRY = 'container_registry',
  GKE_CLUSTER = 'gke_cluster',
  CLOUD_FUNCTION = 'cloud_function',
}

export enum ResourceState {
  CREATING = 'creating',
  CREATED = 'created',
  UPDATING = 'updating',
  DELETING = 'deleting',
  DELETED = 'deleted',
  ERROR = 'error',
  UNKNOWN = 'unknown',
}

export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

export interface InfrastructureTemplate {
  id: string;
  name: string;
  version: string;
  provider: CloudProvider;
  resources: ResourceDefinition[];
  variables: TemplateVariable[];
  outputs: TemplateOutput[];
  dependencies: string[];
  metadata: TemplateMetadata;
}

export interface ResourceDefinition {
  type: ResourceType;
  name: string;
  properties: ResourceProperties;
  dependencies: string[];
  lifecycle: ResourceLifecycle;
  tags: Record<string, string>;
  provider?: CloudProvider;
}

export interface ResourceProperties {
  [key: string]: any;
  region?: string;
  size?: string;
  replicas?: number;
  configuration?: Record<string, any>;
}

export interface ResourceLifecycle {
  createBeforeDestroy?: boolean;
  preventDestroy?: boolean;
  ignoreChanges?: string[];
  replaceTriggeredBy?: string[];
}

export interface TemplateVariable {
  name: string;
  type: VariableType;
  description: string;
  defaultValue?: any;
  required: boolean;
  validation?: VariableValidation;
}

export interface TemplateOutput {
  name: string;
  value: string;
  description: string;
  sensitive?: boolean;
}

export interface TemplateMetadata {
  author: string;
  description: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  version: string;
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  LIST = 'list',
  MAP = 'map',
  OBJECT = 'object',
}

export interface VariableValidation {
  pattern?: string;
  minLength?: number;
  maxLength?: number;
  minimum?: number;
  maximum?: number;
  allowedValues?: any[];
}

export interface InfrastructureState {
  id: string;
  templateId: string;
  environment: string;
  resources: ResourceStateInfo[];
  status: InfrastructureStatus;
  createdAt: Date;
  updatedAt: Date;
  metadata: StateMetadata;
}

export interface ResourceStateInfo {
  id: string;
  name: string;
  type: ResourceType;
  state: ResourceState;
  properties: ResourceProperties;
  outputs: Record<string, any>;
  lastModified: Date;
  error?: string;
  tags?: Record<string, string>;
}

export enum InfrastructureStatus {
  PROVISIONING = 'provisioning',
  PROVISIONED = 'provisioned',
  UPDATING = 'updating',
  DESTROYING = 'destroying',
  DESTROYED = 'destroyed',
  ERROR = 'error',
}

export interface StateMetadata {
  version: string;
  checksum: string;
  locked: boolean;
  lockedBy?: string;
  lockedAt?: Date;
}

export interface InfrastructureChange {
  action: ChangeAction;
  resourceName: string;
  resourceType: ResourceType;
  before?: ResourceProperties;
  after?: ResourceProperties;
  reason: string;
}

export enum ChangeAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  REPLACE = 'replace',
  NO_CHANGE = 'no_change',
}

export interface ExecutionPlan {
  id: string;
  templateId: string;
  environment: string;
  changes: InfrastructureChange[];
  estimatedDuration: number;
  riskLevel: RiskLevel;
  approvals: ApprovalRequirement[];
  createdAt: Date;
}

export enum RiskLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface ApprovalRequirement {
  type: ApprovalType;
  required: boolean;
  approvers: string[];
  timeout: number;
}

export enum ApprovalType {
  MANUAL = 'manual',
  AUTOMATED = 'automated',
  POLICY_BASED = 'policy_based',
}

export interface ProvisionResult {
  success: boolean;
  infrastructureId: string;
  resources: ResourceProvisionResult[];
  duration: number;
  error?: string;
  warnings: string[];
}

export interface ResourceProvisionResult {
  resourceName: string;
  resourceType: ResourceType;
  success: boolean;
  resourceId?: string;
  outputs?: Record<string, any>;
  error?: string;
}

export interface UpdateResult {
  success: boolean;
  infrastructureId: string;
  changesApplied: InfrastructureChange[];
  duration: number;
  error?: string;
  warnings: string[];
}

export interface DestroyResult {
  success: boolean;
  infrastructureId: string;
  resourcesDestroyed: string[];
  duration: number;
  error?: string;
  warnings: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: ValidationSuggestion[];
}

export interface ValidationError {
  code: string;
  message: string;
  path: string;
  severity: ErrorSeverity;
}

export interface ValidationWarning {
  code: string;
  message: string;
  path: string;
  recommendation: string;
}

export interface ValidationSuggestion {
  type: SuggestionType;
  message: string;
  path: string;
  improvement: string;
}

export enum ErrorSeverity {
  ERROR = 'error',
  WARNING = 'warning',
  INFO = 'info',
}

export enum SuggestionType {
  OPTIMIZATION = 'optimization',
  SECURITY = 'security',
  COST = 'cost',
  PERFORMANCE = 'performance',
}

export interface PlanResult {
  planId: string;
  changes: InfrastructureChange[];
  riskAssessment: RiskAssessment;
  estimatedCost: CostEstimate;
  timeline: ExecutionTimeline;
}

export interface RiskAssessment {
  level: RiskLevel;
  factors: RiskFactor[];
  mitigation: string[];
}

export interface RiskFactor {
  type: RiskType;
  description: string;
  impact: ImpactLevel;
  probability: ProbabilityLevel;
}

export enum RiskType {
  DOWNTIME = 'downtime',
  DATA_LOSS = 'data_loss',
  SECURITY = 'security',
  COST = 'cost',
  PERFORMANCE = 'performance',
}

export enum ImpactLevel {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum ProbabilityLevel {
  UNLIKELY = 'unlikely',
  POSSIBLE = 'possible',
  LIKELY = 'likely',
  CERTAIN = 'certain',
}

export interface CostEstimate {
  currency: string;
  monthly: number;
  yearly: number;
  breakdown: CostBreakdown[];
}

export interface CostBreakdown {
  resourceType: ResourceType;
  resourceName: string;
  monthlyCost: number;
  yearlyCost: number;
}

export interface ExecutionTimeline {
  estimatedDuration: number;
  phases: ExecutionPhase[];
  dependencies: PhaseDependency[];
}

export interface ExecutionPhase {
  name: string;
  duration: number;
  resources: string[];
  parallelizable: boolean;
}

export interface PhaseDependency {
  phase: string;
  dependsOn: string[];
  type: DependencyType;
}

export enum DependencyType {
  HARD = 'hard',
  SOFT = 'soft',
  OPTIONAL = 'optional',
}

export interface ApplyResult {
  success: boolean;
  planId: string;
  infrastructureId: string;
  changesApplied: InfrastructureChange[];
  duration: number;
  finalState: InfrastructureState;
  error?: string;
  warnings: string[];
}

export interface InfrastructureUpdate {
  infrastructureId: string;
  templateChanges?: Partial<InfrastructureTemplate>;
  variableChanges?: Record<string, any>;
  resourceChanges?: ResourceDefinition[];
  reason: string;
  approvals?: string[];
}
