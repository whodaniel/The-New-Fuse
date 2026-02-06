/**
 * Infrastructure Management Module
 * Exports all infrastructure-related components
 */

export { ChangeAnalyzer } from './ChangeAnalyzer';
export { EnvironmentManager } from './EnvironmentManager';
export type {
  Environment,
  EnvironmentConfiguration,
  EnvironmentStatus,
} from './EnvironmentManager';
export { InfrastructureAutomation } from './InfrastructureAutomation';
export type {
  AutomationRule,
  CompliancePolicy,
  DisasterRecoveryPlan,
} from './InfrastructureAutomation';
export { InfrastructureManager } from './InfrastructureManager';
export { GCPProvider } from './providers/GCPProvider';
export { ResourceProvisioner } from './ResourceProvisioner';
export type {
  ResourceHealth,
  ResourceImportConfig,
  ResourceProvider,
  ResourceStatus,
} from './ResourceProvisioner';
export { StateManager } from './StateManager';
export type { StateStorage } from './StateManager';
export { TemplateParser } from './TemplateParser';
export type { ParsedTemplate } from './TemplateParser';
export { TemplateValidator } from './TemplateValidator';
export type { ValidationIssue, ValidationRule } from './TemplateValidator';

// Re-export types and interfaces
export * from '../interfaces/IInfrastructureManager';
export * from '../types/infrastructure';
