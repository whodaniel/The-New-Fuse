/**
 * Wizard Steps - Index
 *
 * All step components for the wizard system
 */

import { AgentCapabilities, type AgentCapabilitiesProps } from './AgentCapabilities';
import { AgentConfiguration, type AgentConfigurationProps } from './AgentConfiguration';
import { AgentTesting, type AgentTestingProps } from './AgentTesting';
import {
  DeploymentConfiguration,
  type DeploymentConfigurationProps,
} from './DeploymentConfiguration';
import { DeploymentProgress, type DeploymentProgressProps } from './DeploymentProgress';
import { DiagnosticsRunner, type DiagnosticsRunnerProps } from './DiagnosticsRunner';
import { PermissionMatrix, type PermissionMatrixProps } from './PermissionMatrix';
import { ProblemIdentification, type ProblemIdentificationProps } from './ProblemIdentification';
import { ProfileSetup, type ProfileSetupProps } from './ProfileSetup';
import { RailwayConnection, type RailwayConnectionProps } from './RailwayConnection';
import { RoleConfiguration, type RoleConfigurationProps } from './RoleConfiguration';
import { SolutionSteps, type SolutionStepsProps } from './SolutionSteps';
import { WelcomeScreen, type WelcomeScreenProps } from './WelcomeScreen';
import { WorkspaceSetup, type WorkspaceSetupProps } from './WorkspaceSetup';

// Re-export
export {
  AgentCapabilities,
  AgentConfiguration,
  AgentTesting,
  DeploymentConfiguration,
  DeploymentProgress,
  DiagnosticsRunner,
  PermissionMatrix,
  ProblemIdentification,
  ProfileSetup,
  RailwayConnection,
  RoleConfiguration,
  SolutionSteps,
  WelcomeScreen,
  WorkspaceSetup,
  type AgentCapabilitiesProps,
  type AgentConfigurationProps,
  type AgentTestingProps,
  type DeploymentConfigurationProps,
  type DeploymentProgressProps,
  type DiagnosticsRunnerProps,
  type PermissionMatrixProps,
  type ProblemIdentificationProps,
  type ProfileSetupProps,
  type RailwayConnectionProps,
  type RoleConfigurationProps,
  type SolutionStepsProps,
  type WelcomeScreenProps,
  type WorkspaceSetupProps,
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
