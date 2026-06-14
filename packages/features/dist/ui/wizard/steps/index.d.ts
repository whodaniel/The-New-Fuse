/**
 * Wizard Steps - Index
 *
 * All step components for the wizard system
 */
import { ProfileSetup, type ProfileSetupProps } from './ProfileSetup.js';
import { WelcomeScreen, type WelcomeScreenProps } from './WelcomeScreen.js';
import { WorkspaceSetup, type WorkspaceSetupProps } from './WorkspaceSetup.js';
import { AgentCapabilities, type AgentCapabilitiesProps } from './AgentCapabilities.js';
import { AgentConfiguration, type AgentConfigurationProps } from './AgentConfiguration.js';
import { AgentTesting, type AgentTestingProps } from './AgentTesting.js';
import { DeploymentConfiguration, type DeploymentConfigurationProps } from './DeploymentConfiguration.js';
import { DeploymentProgress, type DeploymentProgressProps } from './DeploymentProgress.js';
import { CloudRuntimeConnection, type CloudRuntimeConnectionProps } from './CloudRuntimeConnection.js';
import { PermissionMatrix, type PermissionMatrixProps } from './PermissionMatrix.js';
import { RoleConfiguration, type RoleConfigurationProps } from './RoleConfiguration.js';
import { DiagnosticsRunner, type DiagnosticsRunnerProps } from './DiagnosticsRunner.js';
import { ProblemIdentification, type ProblemIdentificationProps } from './ProblemIdentification.js';
import { SolutionSteps, type SolutionStepsProps } from './SolutionSteps.js';
export { ProfileSetup, type ProfileSetupProps, WelcomeScreen, type WelcomeScreenProps, WorkspaceSetup, type WorkspaceSetupProps, AgentCapabilities, type AgentCapabilitiesProps, AgentConfiguration, type AgentConfigurationProps, AgentTesting, type AgentTestingProps, DeploymentConfiguration, type DeploymentConfigurationProps, DeploymentProgress, type DeploymentProgressProps, CloudRuntimeConnection, type CloudRuntimeConnectionProps, PermissionMatrix, type PermissionMatrixProps, RoleConfiguration, type RoleConfigurationProps, DiagnosticsRunner, type DiagnosticsRunnerProps, ProblemIdentification, type ProblemIdentificationProps, SolutionSteps, type SolutionStepsProps };
export declare const STEP_COMPONENTS: Record<string, React.ComponentType<{
    context: import('../WizardSystem').WizardContext;
    onDataChange: (data: Record<string, unknown>) => void;
    validationErrors?: string[];
}>>;
//# sourceMappingURL=index.d.ts.map