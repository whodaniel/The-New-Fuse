"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentResponseDto = exports.UpdateAgentDto = exports.CreateAgentDto = exports.Agent = exports.AgentCapability = exports.AgentRole = exports.AgentStatus = exports.AgentType = void 0;
var AgentType;
(function (AgentType) {
    AgentType["BASIC"] = "BASIC";
    AgentType["CHAT"] = "CHAT";
    AgentType["WORKFLOW"] = "WORKFLOW";
    AgentType["TASK"] = "TASK";
    AgentType["ASSISTANT"] = "ASSISTANT";
})(AgentType || (exports.AgentType = AgentType = {}));
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "ACTIVE";
    AgentStatus["INACTIVE"] = "INACTIVE";
    AgentStatus["IDLE"] = "IDLE";
    AgentStatus["BUSY"] = "BUSY";
    AgentStatus["ERROR"] = "ERROR";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var AgentRole;
(function (AgentRole) {
    AgentRole["USER"] = "USER";
    AgentRole["ASSISTANT"] = "ASSISTANT";
    AgentRole["SYSTEM"] = "SYSTEM";
    AgentRole["OPTIMIZATION"] = "OPTIMIZATION";
})(AgentRole || (exports.AgentRole = AgentRole = {}));
var AgentCapability;
(function (AgentCapability) {
    AgentCapability["CHAT"] = "CHAT";
    AgentCapability["CODE_GENERATION"] = "CODE_GENERATION";
    AgentCapability["FILE_MANAGEMENT"] = "FILE_MANAGEMENT";
    AgentCapability["DATA_ANALYSIS"] = "DATA_ANALYSIS";
    AgentCapability["WORKFLOW_EXECUTION"] = "WORKFLOW_EXECUTION";
    AgentCapability["API_INTEGRATION"] = "API_INTEGRATION";
    AgentCapability["MONITORING"] = "MONITORING";
    AgentCapability["AUTOMATION"] = "AUTOMATION";
})(AgentCapability || (exports.AgentCapability = AgentCapability = {}));
// Changed from interface to class that implements BaseEntity
class Agent {
    id;
    createdAt;
    updatedAt;
    name;
    type;
    status;
    description;
    systemPrompt;
    capabilities;
    configuration;
    constructor(data) {
        this.id = data.id || '';
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
        this.name = data.name || '';
        this.type = data.type || AgentType.ASSISTANT;
        this.status = data.status || AgentStatus.INACTIVE;
        this.description = data.description;
        this.systemPrompt = data.systemPrompt;
        this.capabilities = data.capabilities;
        this.configuration = data.configuration;
    }
}
exports.Agent = Agent;
// Changed from interface to class
class CreateAgentDto {
    name;
    type;
    description;
    systemPrompt;
    capabilities;
    configuration;
    metadata;
    role;
    provider;
    constructor(data) {
        this.name = data.name || '';
        this.type = data.type || AgentType.ASSISTANT;
        this.description = data.description;
        this.systemPrompt = data.systemPrompt;
        this.capabilities = data.capabilities;
        this.configuration = data.configuration;
        this.metadata = data.metadata;
        this.role = data.role;
        this.provider = data.provider || 'default';
    }
}
exports.CreateAgentDto = CreateAgentDto;
// Changed from interface to class
class UpdateAgentDto {
    name;
    description;
    systemPrompt;
    capabilities;
    configuration;
    status;
    metadata;
    type;
    role;
    constructor(data = {}) {
        this.name = data.name;
        this.description = data.description;
        this.systemPrompt = data.systemPrompt;
        this.capabilities = data.capabilities;
        this.configuration = data.configuration;
        this.status = data.status;
        this.metadata = data.metadata;
        this.type = data.type;
        this.role = data.role;
    }
}
exports.UpdateAgentDto = UpdateAgentDto;
class AgentResponseDto {
    id;
    name;
    type;
    description;
    status;
    capabilities;
    provider;
    lastActive;
    metadata;
    createdAt;
    updatedAt;
    constructor(data) {
        this.id = data.id || '';
        this.name = data.name || '';
        this.type = data.type || AgentType.ASSISTANT;
        this.description = data.description;
        this.status = data.status || AgentStatus.INACTIVE;
        this.capabilities = data.capabilities;
        this.provider = data.provider;
        this.lastActive = data.lastActive;
        this.metadata = data.metadata;
        this.createdAt = data.createdAt || new Date();
        this.updatedAt = data.updatedAt || new Date();
    }
}
exports.AgentResponseDto = AgentResponseDto;
