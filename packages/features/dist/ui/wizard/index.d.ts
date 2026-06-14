/**
 * Wizard System - Index
 *
 * Interactive user guidance system for The New Fuse
 */
export { WizardBuilder, WizardStateManager, type ValidationResult, type WizardContext, type WizardDefinition, type WizardProgress, type WizardStep, } from './WizardSystem.js';
import { createAgentCreationWizard, createConfigureRBACWizard, createDeployToCloudRuntimeWizard, createGetStartedWizard, createTroubleshootingWizard, DEFAULT_WIZARDS } from './DefaultWizards.js';
export { createAgentCreationWizard, createConfigureRBACWizard, createDeployToCloudRuntimeWizard, createGetStartedWizard, createTroubleshootingWizard, DEFAULT_WIZARDS, };
export { Wizard, WizardList, type WizardListProps, type WizardUIProps } from './WizardUI.js';
export { useWizard, useWizardList, type UseWizardListOptions, type UseWizardOptions, } from './useWizard.js';
export { AgentCapabilities, AgentConfiguration, AgentTesting, DeploymentConfiguration, DeploymentProgress, DiagnosticsRunner, PermissionMatrix, ProblemIdentification, ProfileSetup, CloudRuntimeConnection, RoleConfiguration, SolutionSteps, STEP_COMPONENTS, WelcomeScreen, WorkspaceSetup, } from './steps/index.js';
import './wizard.css';
import { WizardStateManager as WizardStateManagerClass } from './WizardSystem.js';
/**
 * Initialize wizard system with default wizards
 */
export declare function initializeWizardSystem(): WizardStateManagerClass;
/**
 * Create a wizard context provider for React applications
 */
export declare function createWizardProvider(): {
    stateManager: WizardStateManagerClass;
    getAvailableWizards: (userRole: string, skillLevel: "beginner" | "intermediate" | "advanced") => import("./WizardSystem.js").WizardDefinition[];
    startWizard: (wizardId: string, userId: string, userRole: string, initialData?: Record<string, unknown>) => import("./WizardSystem.js").WizardProgress;
    getProgress: (userId: string, wizardId: string) => import("./WizardSystem.js").WizardProgress | null;
};
//# sourceMappingURL=index.d.ts.map