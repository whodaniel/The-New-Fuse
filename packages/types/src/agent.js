import { AgentCapability, AgentStatus, AgentRole } from './core/enums';
// Re-export the enums for external use
export { AgentCapability, AgentStatus, AgentRole };
export var AgentType;
(function (AgentType) {
    AgentType["BASIC"] = "BASIC";
    AgentType["CHAT"] = "CHAT";
    AgentType["WORKFLOW"] = "WORKFLOW";
    AgentType["TASK"] = "TASK";
    AgentType["ASSISTANT"] = "ASSISTANT";
    AgentType["ANALYSIS"] = "ANALYSIS";
    AgentType["CONVERSATIONAL"] = "CONVERSATIONAL";
    AgentType["IDE_EXTENSION"] = "IDE_EXTENSION";
    AgentType["API"] = "API";
})(AgentType || (AgentType = {}));
// Changed from interface to class that implements BaseEntity
export class Agent {
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
// Changed from interface to class
export class CreateAgentDto {
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
// Changed from interface to class
export class UpdateAgentDto {
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
export class AgentResponseDto {
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
//# sourceMappingURL=agent.js.map