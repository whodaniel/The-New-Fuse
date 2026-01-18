/**
 * Wizard System - Index
 *
 * Interactive user guidance system for The New Fuse
 */

// Core system
export {
  WizardBuilder,
  WizardStateManager,
  type ValidationResult,
  type WizardContext,
  type WizardDefinition,
  type WizardProgress,
  type WizardStep,
} from './WizardSystem';

// Default wizards
export {
  createAgentCreationWizard,
  createConfigureRBACWizard,
  createDeployToRailwayWizard,
  createGetStartedWizard,
  createTroubleshootingWizard,
  DEFAULT_WIZARDS,
} from './DefaultWizards';

// React components
export { Wizard, WizardList, type WizardListProps, type WizardUIProps } from './WizardUI';

// React hooks
export {
  useWizard,
  useWizardList,
  type UseWizardListOptions,
  type UseWizardOptions,
} from './useWizard';

// Step components
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
  STEP_COMPONENTS,
  WelcomeScreen,
  WorkspaceSetup,
} from './steps';

// Styles
import './wizard.css';

import { WizardStateManager as WizardStateManagerClass } from './WizardSystem';

/**
 * Initialize wizard system with default wizards
 */
export function initializeWizardSystem(): WizardStateManagerClass {
  const stateManager = new WizardStateManagerClass();

  // Register all default wizards
  const { DEFAULT_WIZARDS } = require('./DefaultWizards');
  DEFAULT_WIZARDS.forEach((wizard: any) => {
    stateManager.registerWizard(wizard);
  });

  return stateManager;
}

/**
 * Create a wizard context provider for React applications
 */
export function createWizardProvider() {
  const stateManager = initializeWizardSystem();

  return {
    stateManager,
    getAvailableWizards: (userRole: string, skillLevel: 'beginner' | 'intermediate' | 'advanced') =>
      stateManager.getAvailableWizards(userRole, skillLevel),
    startWizard: (
      wizardId: string,
      userId: string,
      userRole: string,
      initialData?: Record<string, unknown>
    ) => stateManager.startWizard(wizardId, userId, userRole, initialData),
    getProgress: (userId: string, wizardId: string) => stateManager.getProgress(userId, wizardId),
  };
}
