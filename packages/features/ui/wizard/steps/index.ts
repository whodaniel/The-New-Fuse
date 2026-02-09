/**
 * Wizard Steps - Index
 *
 * All step components for the wizard system
 */

import { ProfileSetup, type ProfileSetupProps } from './ProfileSetup';
import { WelcomeScreen, type WelcomeScreenProps } from './WelcomeScreen';
import { WorkspaceSetup, type WorkspaceSetupProps } from './WorkspaceSetup';
import { AgentCapabilities, type AgentCapabilitiesProps } from './AgentCapabilities';
import { AgentConfiguration, type AgentConfigurationProps } from './AgentConfiguration';
import { AgentTesting, type AgentTestingProps } from './AgentTesting';
import { DeploymentConfiguration, type DeploymentConfigurationProps } from './DeploymentConfiguration';
import { DeploymentProgress, type DeploymentProgressProps } from './DeploymentProgress';
import { RailwayConnection, type RailwayConnectionProps } from './RailwayConnection';
import { PermissionMatrix, type PermissionMatrixProps } from './PermissionMatrix';
import { RoleConfiguration, type RoleConfigurationProps } from './RoleConfiguration';
import { DiagnosticsRunner, type DiagnosticsRunnerProps } from './DiagnosticsRunner';
import { ProblemIdentification, type ProblemIdentificationProps } from './ProblemIdentification';
import { SolutionSteps, type SolutionStepsProps } from './SolutionSteps';

// Re-export
export {
  ProfileSetup, type ProfileSetupProps,
  WelcomeScreen, type WelcomeScreenProps,
  WorkspaceSetup, type WorkspaceSetupProps,
  AgentCapabilities, type AgentCapabilitiesProps,
  AgentConfiguration, type AgentConfigurationProps,
  AgentTesting, type AgentTestingProps,
  DeploymentConfiguration, type DeploymentConfigurationProps,
  DeploymentProgress, type DeploymentProgressProps,
  RailwayConnection, type RailwayConnectionProps,
  PermissionMatrix, type PermissionMatrixProps,
  RoleConfiguration, type RoleConfigurationProps,
  DiagnosticsRunner, type DiagnosticsRunnerProps,
  ProblemIdentification, type ProblemIdentificationProps,
  SolutionSteps, type SolutionStepsProps
};

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
