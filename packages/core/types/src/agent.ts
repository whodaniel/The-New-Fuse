
export {}
exports.updateAgentStatusDtoSchema = exports.updateAgentDtoSchema = exports.createAgentDtoSchema = exports.agentMetricsSchema = exports.agentConfigurationSchema = exports.agentProfileSchema = exports.baseAgentSchema = exports.agentFrameworkSchema = exports.agentToolTypeSchema = exports.agentCapabilitySchema = exports.agentRoleSchema = exports.agentTypeSchema = exports.agentStatusSchema = exports.AgentFramework = exports.AgentToolType = exports.AgentCapability = exports.AgentRole = exports.AgentType = exports.AgentStatus = void 0;
import zod_1 from 'zod';
// Base enums
var AgentStatus;
(function (AgentStatus): any {
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
    AgentStatus["OFFLINE"] = "OFFLINE";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var AgentType;
(function (AgentType): any {
    AgentType["CONVERSATIONAL"] = "CONVERSATIONAL";
    AgentType["IDE_EXTENSION"] = "IDE_EXTENSION";
    AgentType["API"] = "API";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentRole;
(function (AgentRole): any {
    AgentRole["ASSISTANT"] = "ASSISTANT";
    AgentRole["DEVELOPER"] = "DEVELOPER";
    AgentRole["REVIEWER"] = "REVIEWER";
})(AgentRole || (exports.AgentRole = AgentRole = {}));
var AgentCapability;
(function (AgentCapability): any {
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
(function (AgentToolType): any {
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
(function (AgentFramework): any {
    AgentFramework["VSCODE"] = "VSCODE";
    AgentFramework["WEBIDE"] = "WEBIDE";
    AgentFramework["CLI"] = "CLI";
})(AgentFramework || (exports.AgentFramework = AgentFramework = {}));
// Zod schemas
exports.agentStatusSchema = zod_1.z.nativeEnum(AgentStatus);
exports.agentTypeSchema = zod_1.z.nativeEnum(AgentType);
exports.agentRoleSchema = zod_1.z.nativeEnum(AgentRole);
exports.agentCapabilitySchema = zod_1.z.nativeEnum(AgentCapability);
exports.agentToolTypeSchema = zod_1.z.nativeEnum(AgentToolType);
exports.agentFrameworkSchema = zod_1.z.nativeEnum(AgentFramework);
exports.baseAgentSchema = zod_1.z.object({
    id: zod_1.z.string(),
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    capabilities: zod_1.z.array(exports.agentCapabilitySchema),
    status: exports.agentStatusSchema,
    lastActive: zod_1.z.date(),
    metadata: zod_1.z.record(zod_1.z.unknown()).optional(),
});
exports.agentProfileSchema = exports.baseAgentSchema.extend({
    type: exports.agentTypeSchema,
    role: exports.agentRoleSchema,
    framework: exports.agentFrameworkSchema,
    provider: zod_1.z.string(),
    config: zod_1.z.record(zod_1.z.unknown()),
});
exports.agentConfigurationSchema = zod_1.z.object({
    provider: zod_1.z.string(),
    config: zod_1.z.record(zod_1.z.unknown()),
});
exports.agentMetricsSchema = zod_1.z.object({
    successRate: zod_1.z.number(),
    totalTasks: zod_1.z.number(),
    averageResponseTime: zod_1.z.number(),
    lastUpdated: zod_1.z.date(),
});
// Zod schemas for DTOs
exports.createAgentDtoSchema = zod_1.z.object({
    name: zod_1.z.string(),
    description: zod_1.z.string().optional(),
    type: exports.agentTypeSchema,
    role: exports.agentRoleSchema,
    framework: exports.agentFrameworkSchema,
    provider: zod_1.z.string(),
    capabilities: zod_1.z.array(exports.agentCapabilitySchema),
    config: zod_1.z.record(zod_1.z.unknown()),
});
exports.updateAgentDtoSchema = exports.createAgentDtoSchema.partial();
exports.updateAgentStatusDtoSchema = zod_1.z.object({
    status: exports.agentStatusSchema,
});
//# sourceMappingURL=agent.js.mapexport {};
