/**
 * Wizard Steps - Index
 *
 * All step components for the wizard system
 */

// Onboarding steps
export { ProfileSetup, type ProfileSetupProps } from './ProfileSetup';
export { WelcomeScreen, type WelcomeScreenProps } from './WelcomeScreen';
export { WorkspaceSetup, type WorkspaceSetupProps } from './WorkspaceSetup';

// Agent creation steps
export { AgentCapabilities, type AgentCapabilitiesProps } from './AgentCapabilities';
export { AgentConfiguration, type AgentConfigurationProps } from './AgentConfiguration';
export { AgentTesting, type AgentTestingProps } from './AgentTesting';

// Deployment steps
export {
  DeploymentConfiguration,
  type DeploymentConfigurationProps,
} from './DeploymentConfiguration';
export { DeploymentProgress, type DeploymentProgressProps } from './DeploymentProgress';
export { RailwayConnection, type RailwayConnectionProps } from './RailwayConnection';

// RBAC steps
export { PermissionMatrix, type PermissionMatrixProps } from './PermissionMatrix';
export { RoleConfiguration, type RoleConfigurationProps } from './RoleConfiguration';

// Troubleshooting steps
export { DiagnosticsRunner, type DiagnosticsRunnerProps } from './DiagnosticsRunner';
export { ProblemIdentification, type ProblemIdentificationProps } from './ProblemIdentification';
export { SolutionSteps, type SolutionStepsProps } from './SolutionSteps';

// Step component mapping for dynamic rendering
export const STEP_COMPONENTS: Record<
  string,
  React.ComponentType<{
    context: import('../WizardSystem').WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
  }>
> = {
  WelcomeScreen: WelcomeScreen as any,
  ProfileSetup: ProfileSetup as any,
  WorkspaceSetup: WorkspaceSetup as any,
  AgentConfiguration: AgentConfiguration as any,
  AgentCapabilities: AgentCapabilities as any,
  AgentTesting: AgentTesting as any,
  RailwayConnection: RailwayConnection as any,
  DeploymentConfiguration: DeploymentConfiguration as any,
  DeploymentProgress: DeploymentProgress as any,
  RoleConfiguration: RoleConfiguration as any,
  PermissionMatrix: PermissionMatrix as any,
  ProblemIdentification: ProblemIdentification as any,
  DiagnosticsRunner: DiagnosticsRunner as any,
  SolutionSteps: SolutionSteps as any,
};
