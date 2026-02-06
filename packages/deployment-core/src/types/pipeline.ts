/**
 * Core types for CI/CD Pipeline functionality
 */

export enum PipelineStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
  SKIPPED = 'skipped',
}

export enum StageType {
  BUILD = 'build',
  TEST = 'test',
  SECURITY_SCAN = 'security_scan',
  QUALITY_CHECK = 'quality_check',
  DEPLOY = 'deploy',
  NOTIFY = 'notify',
  CUSTOM = 'custom',
}

export enum TriggerType {
  PUSH = 'push',
  PULL_REQUEST = 'pull_request',
  SCHEDULE = 'schedule',
  MANUAL = 'manual',
  WEBHOOK = 'webhook',
  API = 'api',
}

export enum DeploymentStrategy {
  ROLLING_UPDATE = 'rolling_update',
  BLUE_GREEN = 'blue_green',
  CANARY = 'canary',
  RECREATE = 'recreate',
}

export enum EnvironmentType {
  DEVELOPMENT = 'development',
  STAGING = 'staging',
  PRODUCTION = 'production',
  TEST = 'test',
}

// Build and Trigger Types
export interface BuildTrigger {
  id: string;
  type: TriggerType;
  source: {
    repository: string;
    branch: string;
    commit: string;
    author: string;
    message: string;
  };
  timestamp: Date;
  metadata: Record<string, any>;
}

export interface BuildResult {
  id: string;
  triggerId: string;
  status: PipelineStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  artifacts: BuildArtifact[];
  logs: string[];
  metrics: BuildMetrics;
  error?: string;
}

export interface BuildArtifact {
  name: string;
  type: string;
  path: string;
  size: number;
  checksum: string;
  metadata: Record<string, any>;
}

export interface BuildMetrics {
  buildTime: number;
  testCoverage?: number;
  codeQualityScore?: number;
  securityScore?: number;
  artifactSize: number;
  dependencies: number;
}

// Pipeline Definition Types
export interface PipelineDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  stages: PipelineStage[];
  triggers: PipelineTrigger[];
  environment: EnvironmentConfig;
  qualityGates: QualityGate[];
  notifications: NotificationConfig[];
  timeout: number;
  retryPolicy: RetryPolicy;
  variables: Record<string, string>;
  metadata: Record<string, any>;
}

export interface PipelineStage {
  id: string;
  name: string;
  type: StageType;
  dependencies: string[];
  tasks: PipelineTask[];
  conditions: StageCondition[];
  timeout: number;
  retryPolicy: RetryPolicy;
  parallel: boolean;
  continueOnError: boolean;
  environment: Record<string, string>;
}

export interface PipelineTask {
  id: string;
  name: string;
  type: string;
  command?: string;
  script?: string;
  parameters: Record<string, any>;
  timeout: number;
  retryPolicy: RetryPolicy;
  conditions: TaskCondition[];
  artifacts: TaskArtifact[];
}

export interface PipelineTrigger {
  type: TriggerType;
  configuration: Record<string, any>;
  filters: TriggerFilter[];
  enabled: boolean;
}

export interface TriggerFilter {
  type: 'branch' | 'path' | 'author' | 'tag';
  pattern: string;
  exclude?: boolean;
}

export interface StageCondition {
  type: 'branch' | 'environment' | 'variable' | 'previous_stage';
  operator: 'equals' | 'not_equals' | 'contains' | 'matches' | 'exists';
  value: string;
}

export interface TaskCondition {
  type: 'file_exists' | 'variable' | 'environment' | 'previous_task';
  operator: 'equals' | 'not_equals' | 'contains' | 'matches' | 'exists';
  value: string;
}

export interface TaskArtifact {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'archive';
  retention: number;
}

// Quality Gates
export interface QualityGate {
  id: string;
  name: string;
  type: 'coverage' | 'security' | 'performance' | 'custom';
  threshold: number;
  operator: 'greater_than' | 'less_than' | 'equals';
  required: boolean;
  failureBehavior: 'fail' | 'warn' | 'ignore';
}

// Retry Policy
export interface RetryPolicy {
  enabled: boolean;
  maxAttempts: number;
  backoffStrategy: 'linear' | 'exponential' | 'fixed';
  initialDelay: number;
  maxDelay: number;
  retryConditions: string[];
}

// Environment Configuration
export interface EnvironmentConfig {
  name: string;
  type: EnvironmentType;
  variables: Record<string, string>;
  secrets: string[];
  resources: ResourceRequirements;
  constraints: EnvironmentConstraints;
}

export interface ResourceRequirements {
  cpu: string;
  memory: string;
  storage: string;
  network?: string;
}

export interface EnvironmentConstraints {
  allowedBranches: string[];
  requiredApprovals: number;
  deploymentWindows: DeploymentWindow[];
  maxConcurrentDeployments: number;
}

export interface DeploymentWindow {
  start: string; // HH:MM format
  end: string; // HH:MM format
  timezone: string;
  days: string[]; // ['monday', 'tuesday', ...]
}

// Deployment Types
export interface DeploymentConfig {
  id: string;
  environment: string;
  services: ServiceDeployment[];
  strategy: DeploymentStrategyConfig;
  healthChecks: HealthCheck[];
  rollbackPolicy: RollbackPolicy;
  approvals: ApprovalConfig[];
  notifications: NotificationConfig[];
  timeout: number;
  variables: Record<string, string>;
}

export interface ServiceDeployment {
  name: string;
  image: string;
  tag: string;
  replicas: number;
  resources: ResourceRequirements;
  ports: PortConfig[];
  volumes: VolumeConfig[];
  environment: Record<string, string>;
  healthCheck: HealthCheck;
}

export interface DeploymentStrategyConfig {
  type: DeploymentStrategy;
  parameters: Record<string, any>;
  canaryConfig?: CanaryConfig;
  blueGreenConfig?: BlueGreenConfig;
}

export interface CanaryConfig {
  steps: CanaryStep[];
  analysis: AnalysisConfig[];
  trafficSplitting: TrafficSplittingConfig;
}

export interface CanaryStep {
  weight: number;
  duration: string;
  pause?: boolean;
}

export interface BlueGreenConfig {
  autoPromotion: boolean;
  scaleDownDelay: string;
  prePromotionAnalysis: AnalysisConfig[];
  postPromotionAnalysis: AnalysisConfig[];
}

export interface AnalysisConfig {
  name: string;
  provider: string;
  query: string;
  threshold: number;
  interval: string;
  count: number;
}

export interface TrafficSplittingConfig {
  headerRouting: HeaderRoutingRule[];
  weightRouting: WeightRoutingRule[];
}

export interface HeaderRoutingRule {
  header: string;
  value: string;
  weight: number;
}

export interface WeightRoutingRule {
  service: string;
  weight: number;
}

export interface PortConfig {
  name: string;
  port: number;
  targetPort: number;
  protocol: 'TCP' | 'UDP';
}

export interface VolumeConfig {
  name: string;
  type: 'emptyDir' | 'configMap' | 'secret' | 'persistentVolumeClaim';
  source: string;
  mountPath: string;
  readOnly: boolean;
}

export interface HealthCheck {
  type: 'http' | 'tcp' | 'exec' | 'grpc';
  path?: string;
  port?: number;
  command?: string[];
  initialDelaySeconds: number;
  periodSeconds: number;
  timeoutSeconds: number;
  failureThreshold: number;
  successThreshold: number;
}

export interface RollbackPolicy {
  enabled: boolean;
  automatic: boolean;
  triggers: RollbackTrigger[];
  timeout: number;
  preserveResources: boolean;
}

export interface RollbackTrigger {
  type: 'health_check' | 'metric' | 'manual' | 'timeout';
  threshold?: number;
  metric?: string;
  duration?: string;
}

export interface ApprovalConfig {
  required: boolean;
  approvers: string[];
  minApprovals: number;
  timeout: number;
  autoApprove: boolean;
  conditions: ApprovalCondition[];
}

export interface ApprovalCondition {
  type: 'branch' | 'author' | 'time' | 'environment';
  operator: 'equals' | 'not_equals' | 'contains' | 'matches';
  value: string;
}

// Notification Configuration
export interface NotificationConfig {
  enabled: boolean;
  channels: NotificationChannel[];
  events: NotificationEvent[];
  conditions: NotificationCondition[];
}

export interface NotificationChannel {
  type: 'slack' | 'email' | 'webhook' | 'sms';
  configuration: Record<string, any>;
  recipients: string[];
}

export interface NotificationEvent {
  type:
    | 'pipeline_start'
    | 'pipeline_complete'
    | 'pipeline_failed'
    | 'deployment_start'
    | 'deployment_complete'
    | 'deployment_failed'
    | 'approval_required';
  enabled: boolean;
}

export interface NotificationCondition {
  type: 'branch' | 'environment' | 'status' | 'duration';
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than';
  value: string | number;
}

// Result Types
export interface PipelineResult {
  id: string;
  pipelineId: string;
  status: PipelineStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  stages: StageResult[];
  artifacts: BuildArtifact[];
  metrics: PipelineMetrics;
  logs: string[];
  error?: string;
  triggeredBy: string;
  environment: string;
}

export interface StageResult {
  id: string;
  stageId: string;
  name: string;
  status: PipelineStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  tasks: TaskResult[];
  logs: string[];
  error?: string;
}

export interface TaskResult {
  id: string;
  taskId: string;
  name: string;
  status: PipelineStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  exitCode?: number;
  logs: string[];
  artifacts: TaskArtifact[];
  error?: string;
  metadata?: Record<string, any>;
}

export interface DeploymentResult {
  id: string;
  deploymentId: string;
  status: PipelineStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  environment: string;
  services: ServiceDeploymentResult[];
  healthChecks: HealthCheckResult[];
  rollbackInfo?: RollbackInfo;
  logs: string[];
  error?: string;
}

export interface ServiceDeploymentResult {
  name: string;
  status: PipelineStatus;
  replicas: {
    desired: number;
    ready: number;
    available: number;
  };
  image: string;
  version: string;
  endpoints: string[];
}

export interface HealthCheckResult {
  name: string;
  status: 'healthy' | 'unhealthy' | 'unknown';
  message: string;
  timestamp: Date;
  duration: number;
}

export interface RollbackResult {
  id: string;
  deploymentId: string;
  status: PipelineStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  previousVersion: string;
  currentVersion: string;
  reason: string;
  logs: string[];
  error?: string;
}

export interface RollbackInfo {
  triggered: boolean;
  reason: string;
  timestamp: Date;
  previousVersion: string;
  automatic: boolean;
}

export interface PipelineMetrics {
  totalDuration: number;
  queueTime: number;
  buildTime: number;
  testTime: number;
  deployTime: number;
  successRate: number;
  failureRate: number;
  averageDuration: number;
  throughput: number;
  leadTime: number;
  changeFailureRate: number;
  meanTimeToRecovery: number;
}

// Pipeline Configuration
export interface PipelineConfig {
  id: string;
  name: string;
  version: string;
  definition: PipelineDefinition;
  enabled: boolean;
  schedule?: string;
  concurrency: number;
  timeout: number;
  retentionPolicy: RetentionPolicy;
  permissions: PipelinePermissions;
  metadata: Record<string, any>;
}

export interface RetentionPolicy {
  maxBuilds: number;
  maxAge: string;
  artifactRetention: string;
  logRetention: string;
}

export interface PipelinePermissions {
  read: string[];
  write: string[];
  execute: string[];
  admin: string[];
}
