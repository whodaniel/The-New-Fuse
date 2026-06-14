"use strict";
/**
 * Wizard System - Index
 *
 * Interactive user guidance system for The New Fuse
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkspaceSetup = exports.WelcomeScreen = exports.STEP_COMPONENTS = exports.SolutionSteps = exports.RoleConfiguration = exports.CloudRuntimeConnection = exports.ProfileSetup = exports.ProblemIdentification = exports.PermissionMatrix = exports.DiagnosticsRunner = exports.DeploymentProgress = exports.DeploymentConfiguration = exports.AgentTesting = exports.AgentConfiguration = exports.AgentCapabilities = exports.useWizardList = exports.useWizard = exports.WizardList = exports.Wizard = exports.DEFAULT_WIZARDS = exports.createTroubleshootingWizard = exports.createGetStartedWizard = exports.createDeployToCloudRuntimeWizard = exports.createConfigureRBACWizard = exports.createAgentCreationWizard = exports.WizardStateManager = exports.WizardBuilder = void 0;
exports.initializeWizardSystem = initializeWizardSystem;
exports.createWizardProvider = createWizardProvider;
// Core system
var WizardSystem_js_1 = require("./WizardSystem.js");
Object.defineProperty(exports, "WizardBuilder", { enumerable: true, get: function () { return WizardSystem_js_1.WizardBuilder; } });
Object.defineProperty(exports, "WizardStateManager", { enumerable: true, get: function () { return WizardSystem_js_1.WizardStateManager; } });
// Default wizards
const DefaultWizards_js_1 = require("./DefaultWizards.js");
Object.defineProperty(exports, "createAgentCreationWizard", { enumerable: true, get: function () { return DefaultWizards_js_1.createAgentCreationWizard; } });
Object.defineProperty(exports, "createConfigureRBACWizard", { enumerable: true, get: function () { return DefaultWizards_js_1.createConfigureRBACWizard; } });
Object.defineProperty(exports, "createDeployToCloudRuntimeWizard", { enumerable: true, get: function () { return DefaultWizards_js_1.createDeployToCloudRuntimeWizard; } });
Object.defineProperty(exports, "createGetStartedWizard", { enumerable: true, get: function () { return DefaultWizards_js_1.createGetStartedWizard; } });
Object.defineProperty(exports, "createTroubleshootingWizard", { enumerable: true, get: function () { return DefaultWizards_js_1.createTroubleshootingWizard; } });
Object.defineProperty(exports, "DEFAULT_WIZARDS", { enumerable: true, get: function () { return DefaultWizards_js_1.DEFAULT_WIZARDS; } });
// React components
var WizardUI_js_1 = require("./WizardUI.js");
Object.defineProperty(exports, "Wizard", { enumerable: true, get: function () { return WizardUI_js_1.Wizard; } });
Object.defineProperty(exports, "WizardList", { enumerable: true, get: function () { return WizardUI_js_1.WizardList; } });
// React hooks
var useWizard_js_1 = require("./useWizard.js");
Object.defineProperty(exports, "useWizard", { enumerable: true, get: function () { return useWizard_js_1.useWizard; } });
Object.defineProperty(exports, "useWizardList", { enumerable: true, get: function () { return useWizard_js_1.useWizardList; } });
// Step components
var index_js_1 = require("./steps/index.js");
Object.defineProperty(exports, "AgentCapabilities", { enumerable: true, get: function () { return index_js_1.AgentCapabilities; } });
Object.defineProperty(exports, "AgentConfiguration", { enumerable: true, get: function () { return index_js_1.AgentConfiguration; } });
Object.defineProperty(exports, "AgentTesting", { enumerable: true, get: function () { return index_js_1.AgentTesting; } });
Object.defineProperty(exports, "DeploymentConfiguration", { enumerable: true, get: function () { return index_js_1.DeploymentConfiguration; } });
Object.defineProperty(exports, "DeploymentProgress", { enumerable: true, get: function () { return index_js_1.DeploymentProgress; } });
Object.defineProperty(exports, "DiagnosticsRunner", { enumerable: true, get: function () { return index_js_1.DiagnosticsRunner; } });
Object.defineProperty(exports, "PermissionMatrix", { enumerable: true, get: function () { return index_js_1.PermissionMatrix; } });
Object.defineProperty(exports, "ProblemIdentification", { enumerable: true, get: function () { return index_js_1.ProblemIdentification; } });
Object.defineProperty(exports, "ProfileSetup", { enumerable: true, get: function () { return index_js_1.ProfileSetup; } });
Object.defineProperty(exports, "CloudRuntimeConnection", { enumerable: true, get: function () { return index_js_1.CloudRuntimeConnection; } });
Object.defineProperty(exports, "RoleConfiguration", { enumerable: true, get: function () { return index_js_1.RoleConfiguration; } });
Object.defineProperty(exports, "SolutionSteps", { enumerable: true, get: function () { return index_js_1.SolutionSteps; } });
Object.defineProperty(exports, "STEP_COMPONENTS", { enumerable: true, get: function () { return index_js_1.STEP_COMPONENTS; } });
Object.defineProperty(exports, "WelcomeScreen", { enumerable: true, get: function () { return index_js_1.WelcomeScreen; } });
Object.defineProperty(exports, "WorkspaceSetup", { enumerable: true, get: function () { return index_js_1.WorkspaceSetup; } });
// Styles
require("./wizard.css");
const WizardSystem_js_2 = require("./WizardSystem.js");
/**
 * Initialize wizard system with default wizards
 */
function initializeWizardSystem() {
    const stateManager = new WizardSystem_js_2.WizardStateManager();
    // Register all default wizards
    DefaultWizards_js_1.DEFAULT_WIZARDS.forEach((wizard) => {
        stateManager.registerWizard(wizard);
    });
    return stateManager;
}
/**
 * Create a wizard context provider for React applications
 */
function createWizardProvider() {
    const stateManager = initializeWizardSystem();
    return {
        stateManager,
        getAvailableWizards: (userRole, skillLevel) => stateManager.getAvailableWizards(userRole, skillLevel),
        startWizard: (wizardId, userId, userRole, initialData) => stateManager.startWizard(wizardId, userId, userRole, initialData),
        getProgress: (userId, wizardId) => stateManager.getProgress(userId, wizardId),
    };
}
//# sourceMappingURL=index.js.map