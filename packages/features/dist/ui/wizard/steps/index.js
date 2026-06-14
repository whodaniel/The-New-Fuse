"use strict";
/**
 * Wizard Steps - Index
 *
 * All step components for the wizard system
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.STEP_COMPONENTS = exports.SolutionSteps = exports.ProblemIdentification = exports.DiagnosticsRunner = exports.RoleConfiguration = exports.PermissionMatrix = exports.CloudRuntimeConnection = exports.DeploymentProgress = exports.DeploymentConfiguration = exports.AgentTesting = exports.AgentConfiguration = exports.AgentCapabilities = exports.WorkspaceSetup = exports.WelcomeScreen = exports.ProfileSetup = void 0;
const ProfileSetup_js_1 = require("./ProfileSetup.js");
Object.defineProperty(exports, "ProfileSetup", { enumerable: true, get: function () { return ProfileSetup_js_1.ProfileSetup; } });
const WelcomeScreen_js_1 = require("./WelcomeScreen.js");
Object.defineProperty(exports, "WelcomeScreen", { enumerable: true, get: function () { return WelcomeScreen_js_1.WelcomeScreen; } });
const WorkspaceSetup_js_1 = require("./WorkspaceSetup.js");
Object.defineProperty(exports, "WorkspaceSetup", { enumerable: true, get: function () { return WorkspaceSetup_js_1.WorkspaceSetup; } });
const AgentCapabilities_js_1 = require("./AgentCapabilities.js");
Object.defineProperty(exports, "AgentCapabilities", { enumerable: true, get: function () { return AgentCapabilities_js_1.AgentCapabilities; } });
const AgentConfiguration_js_1 = require("./AgentConfiguration.js");
Object.defineProperty(exports, "AgentConfiguration", { enumerable: true, get: function () { return AgentConfiguration_js_1.AgentConfiguration; } });
const AgentTesting_js_1 = require("./AgentTesting.js");
Object.defineProperty(exports, "AgentTesting", { enumerable: true, get: function () { return AgentTesting_js_1.AgentTesting; } });
const DeploymentConfiguration_js_1 = require("./DeploymentConfiguration.js");
Object.defineProperty(exports, "DeploymentConfiguration", { enumerable: true, get: function () { return DeploymentConfiguration_js_1.DeploymentConfiguration; } });
const DeploymentProgress_js_1 = require("./DeploymentProgress.js");
Object.defineProperty(exports, "DeploymentProgress", { enumerable: true, get: function () { return DeploymentProgress_js_1.DeploymentProgress; } });
const CloudRuntimeConnection_js_1 = require("./CloudRuntimeConnection.js");
Object.defineProperty(exports, "CloudRuntimeConnection", { enumerable: true, get: function () { return CloudRuntimeConnection_js_1.CloudRuntimeConnection; } });
const PermissionMatrix_js_1 = require("./PermissionMatrix.js");
Object.defineProperty(exports, "PermissionMatrix", { enumerable: true, get: function () { return PermissionMatrix_js_1.PermissionMatrix; } });
const RoleConfiguration_js_1 = require("./RoleConfiguration.js");
Object.defineProperty(exports, "RoleConfiguration", { enumerable: true, get: function () { return RoleConfiguration_js_1.RoleConfiguration; } });
const DiagnosticsRunner_js_1 = require("./DiagnosticsRunner.js");
Object.defineProperty(exports, "DiagnosticsRunner", { enumerable: true, get: function () { return DiagnosticsRunner_js_1.DiagnosticsRunner; } });
const ProblemIdentification_js_1 = require("./ProblemIdentification.js");
Object.defineProperty(exports, "ProblemIdentification", { enumerable: true, get: function () { return ProblemIdentification_js_1.ProblemIdentification; } });
const SolutionSteps_js_1 = require("./SolutionSteps.js");
Object.defineProperty(exports, "SolutionSteps", { enumerable: true, get: function () { return SolutionSteps_js_1.SolutionSteps; } });
// Step component mapping for dynamic rendering
exports.STEP_COMPONENTS = {
    WelcomeScreen: WelcomeScreen_js_1.WelcomeScreen,
    ProfileSetup: ProfileSetup_js_1.ProfileSetup,
    WorkspaceSetup: WorkspaceSetup_js_1.WorkspaceSetup,
    AgentConfiguration: AgentConfiguration_js_1.AgentConfiguration,
    AgentCapabilities: AgentCapabilities_js_1.AgentCapabilities,
    AgentTesting: AgentTesting_js_1.AgentTesting,
    CloudRuntimeConnection: CloudRuntimeConnection_js_1.CloudRuntimeConnection,
    DeploymentConfiguration: DeploymentConfiguration_js_1.DeploymentConfiguration,
    DeploymentProgress: DeploymentProgress_js_1.DeploymentProgress,
    RoleConfiguration: RoleConfiguration_js_1.RoleConfiguration,
    PermissionMatrix: PermissionMatrix_js_1.PermissionMatrix,
    ProblemIdentification: ProblemIdentification_js_1.ProblemIdentification,
    DiagnosticsRunner: DiagnosticsRunner_js_1.DiagnosticsRunner,
    SolutionSteps: SolutionSteps_js_1.SolutionSteps,
};
//# sourceMappingURL=index.js.map