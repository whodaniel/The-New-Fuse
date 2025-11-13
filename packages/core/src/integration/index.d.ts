export { IntegrationCoreModule } from './integration-core.module';
export { VSCodeTerminalService } from './services/vscode-terminal.service';
export { SecureSubprocessService } from './services/secure-subprocess.service';
export { GitTransactionService } from './services/git-transaction.service';
export { EnhancedGeminiCoordinatorService } from './services/enhanced-gemini-coordinator.service';
export { IntegrationManagerService } from './IntegrationManager';
export type { TerminalSession, TerminalControlOptions } from './services/vscode-terminal.service';
export type { SecureExecutionOptions, ExecutionResult, ProcessInfo } from './services/secure-subprocess.service';
export type { GitTransaction, GitAuditTrail, GitFileChange, GitBranchInfo } from './services/git-transaction.service';
export type { AgentTask, GeminiAgent, CoordinationStrategy, WorkflowExecution } from './services/enhanced-gemini-coordinator.service';
export type { ManagedIntegration, IntegrationCategory, ManagedIntegrationStatus, PerformanceMetrics, IntegrationConfiguration, AlertThresholds, BackupStrategy, ScalingPolicy, MaintenanceWindow, MonitoringConfig, ScheduledTask, TaskType, IntegrationAlert, AlertSeverity, AlertType, IntegrationManagerStats } from './IntegrationManager';
//# sourceMappingURL=index.d.ts.map