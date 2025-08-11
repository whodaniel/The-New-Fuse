"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateAgentStatusDtoSchema = exports.updateAgentDtoSchema = exports.createAgentDtoSchema = exports.agentMetricsSchema = exports.agentConfigurationSchema = exports.agentProfileSchema = exports.baseAgentSchema = exports.agentFrameworkSchema = exports.agentToolTypeSchema = exports.agentCapabilitySchema = exports.agentRoleSchema = exports.agentTypeSchema = exports.agentStatusSchema = exports.AgentFramework = exports.AgentToolType = exports.AgentCapability = exports.AgentRole = exports.AgentType = exports.AgentStatus = void 0;
const zod_2 = __importDefault(require("zod"));
// Base enums
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
    AgentStatus["OFFLINE"] = "OFFLINE";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var AgentType;
(function (AgentType) {
    AgentType["CONVERSATIONAL"] = "CONVERSATIONAL";
    AgentType["IDE_EXTENSION"] = "IDE_EXTENSION";
    AgentType["API"] = "API";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentRole;
(function (AgentRole) {
    AgentRole["ASSISTANT"] = "ASSISTANT";
    AgentRole["DEVELOPER"] = "DEVELOPER";
    AgentRole["REVIEWER"] = "REVIEWER";
})(AgentRole || (exports.AgentRole = AgentRole = {}));
var AgentCapability;
(function (AgentCapability) {
    // Code-related capabilities
    AgentCapability["CODE_REVIEW"] = "CODE_REVIEW";
    AgentCapability["CODE_REFACTORING"] = "CODE_REFACTORING";
    AgentCapability["DEBUGGING"] = "DEBUGGING";
    AgentCapability["TESTING"] = "TESTING";
    AgentCapability["DOCUMENTATION"] = "DOCUMENTATION";
    AgentCapability["CODE_COMPLETION"] = "CODE_COMPLETION";
    AgentCapability["CODE_SUGGESTIONS"] = "CODE_SUGGESTIONS";
    AgentCapability["SYNTAX_HIGHLIGHTING"] = "SYNTAX_HIGHLIGHTING";
    AgentCapability["ERROR_DETECTION"] = "ERROR_DETECTION";
    AgentCapability["CODE_FORMATTING"] = "CODE_FORMATTING";
    AgentCapability["INTELLISENSE"] = "INTELLISENSE";
    AgentCapability["REFACTORING"] = "REFACTORING";
    AgentCapability["DOCUMENTATION_GENERATION"] = "DOCUMENTATION_GENERATION";
    // Tool-related capabilities
    AgentCapability["TOOL_USAGE"] = "TOOL_USAGE";
    AgentCapability["TASK_EXECUTION"] = "TASK_EXECUTION";
    AgentCapability["FILE_MANAGEMENT"] = "FILE_MANAGEMENT";
    AgentCapability["PROCESS_MANAGEMENT"] = "PROCESS_MANAGEMENT";
    AgentCapability["SHELL_COMMAND_EXECUTION"] = "SHELL_COMMAND_EXECUTION";
    // Web and API capabilities
    AgentCapability["WEB_SEARCH"] = "WEB_SEARCH";
    AgentCapability["WEB_BROWSING"] = "WEB_BROWSING";
    AgentCapability["API_INTEGRATION"] = "API_INTEGRATION";
    // Integration capabilities
    AgentCapability["GITHUB_INTEGRATION"] = "GITHUB_INTEGRATION";
    AgentCapability["JIRA_INTEGRATION"] = "JIRA_INTEGRATION";
    AgentCapability["LINEAR_INTEGRATION"] = "LINEAR_INTEGRATION";
    AgentCapability["CONFLUENCE_INTEGRATION"] = "CONFLUENCE_INTEGRATION";
    AgentCapability["NOTION_INTEGRATION"] = "NOTION_INTEGRATION";
    AgentCapability["SUPABASE_INTEGRATION"] = "SUPABASE_INTEGRATION";
    // Memory and context capabilities
    AgentCapability["MEMORY_MANAGEMENT"] = "MEMORY_MANAGEMENT";
    AgentCapability["CONTEXT_AWARENESS"] = "CONTEXT_AWARENESS";
    AgentCapability["CODEBASE_RETRIEVAL"] = "CODEBASE_RETRIEVAL";
})(AgentCapability || (exports.AgentCapability = AgentCapability = {}));
var AgentToolType;
(function (AgentToolType) {
    // File Management Tools
    AgentToolType["SAVE_FILE"] = "SAVE_FILE";
    AgentToolType["EDIT_FILE"] = "EDIT_FILE";
    AgentToolType["REMOVE_FILES"] = "REMOVE_FILES";
    // Web Interaction Tools
    AgentToolType["OPEN_BROWSER"] = "OPEN_BROWSER";
    AgentToolType["WEB_SEARCH"] = "WEB_SEARCH";
    AgentToolType["WEB_FETCH"] = "WEB_FETCH";
    // Process Management Tools
    AgentToolType["LAUNCH_PROCESS"] = "LAUNCH_PROCESS";
    AgentToolType["KILL_PROCESS"] = "KILL_PROCESS";
    AgentToolType["READ_PROCESS"] = "READ_PROCESS";
    AgentToolType["WRITE_PROCESS"] = "WRITE_PROCESS";
    AgentToolType["LIST_PROCESSES"] = "LIST_PROCESSES";
    // Code Analysis Tools
    AgentToolType["DIAGNOSTICS"] = "DIAGNOSTICS";
    AgentToolType["CODEBASE_RETRIEVAL"] = "CODEBASE_RETRIEVAL";
    // Integration Tools
    AgentToolType["GITHUB_API"] = "GITHUB_API";
    AgentToolType["LINEAR"] = "LINEAR";
    AgentToolType["JIRA"] = "JIRA";
    AgentToolType["CONFLUENCE"] = "CONFLUENCE";
    AgentToolType["NOTION"] = "NOTION";
    AgentToolType["SUPABASE"] = "SUPABASE";
    // Memory Tool
    AgentToolType["REMEMBER"] = "REMEMBER";
})(AgentToolType || (exports.AgentToolType = AgentToolType = {}));
var AgentFramework;
(function (AgentFramework) {
    AgentFramework["VSCODE"] = "VSCODE";
    AgentFramework["WEBIDE"] = "WEBIDE";
    AgentFramework["CLI"] = "CLI";
})(AgentFramework || (exports.AgentFramework = AgentFramework = {}));
// Zod schemas
exports.agentStatusSchema = zod_2.default.z.nativeEnum(AgentStatus);
exports.agentTypeSchema = zod_2.default.z.nativeEnum(AgentType);
exports.agentRoleSchema = zod_2.default.z.nativeEnum(AgentRole);
exports.agentCapabilitySchema = zod_2.default.z.nativeEnum(AgentCapability);
exports.agentToolTypeSchema = zod_2.default.z.nativeEnum(AgentToolType);
exports.agentFrameworkSchema = zod_2.default.z.nativeEnum(AgentFramework);
exports.baseAgentSchema = zod_2.default.z.object({
    id: zod_2.default.z.string(),
    name: zod_2.default.z.string(),
    description: zod_2.default.z.string().optional(),
    capabilities: zod_2.default.z.array(exports.agentCapabilitySchema),
    status: exports.agentStatusSchema,
    lastActive: zod_2.default.z.date(),
    metadata: zod_2.default.z.record(zod_2.default.z.unknown()).optional(),
});
exports.agentProfileSchema = exports.baseAgentSchema.extend({
    type: exports.agentTypeSchema,
    role: exports.agentRoleSchema,
    framework: exports.agentFrameworkSchema,
    provider: zod_2.default.z.string(),
    config: zod_2.default.z.record(zod_2.default.z.unknown()),
});
exports.agentConfigurationSchema = zod_2.default.z.object({
    provider: zod_2.default.z.string(),
    config: zod_2.default.z.record(zod_2.default.z.unknown()),
});
exports.agentMetricsSchema = zod_2.default.z.object({
    successRate: zod_2.default.z.number(),
    totalTasks: zod_2.default.z.number(),
    averageResponseTime: zod_2.default.z.number(),
    lastUpdated: zod_2.default.z.date(),
});
// Zod schemas for DTOs
exports.createAgentDtoSchema = zod_2.default.z.object({
    name: zod_2.default.z.string(),
    description: zod_2.default.z.string().optional(),
    type: exports.agentTypeSchema,
    role: exports.agentRoleSchema,
    framework: exports.agentFrameworkSchema,
    provider: zod_2.default.z.string(),
    capabilities: zod_2.default.z.array(exports.agentCapabilitySchema),
    config: zod_2.default.z.record(zod_2.default.z.unknown()),
});
exports.updateAgentDtoSchema = exports.createAgentDtoSchema.partial();
exports.updateAgentStatusDtoSchema = zod_2.default.z.object({
    status: exports.agentStatusSchema,
});
//# sourceMappingURL=agent.js.mapexport {};
//# sourceMappingURL=agent.js.map