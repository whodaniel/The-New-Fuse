export var AgentType;
(function (AgentType) {
    AgentType["HUMAN"] = "human";
    AgentType["AI"] = "ai";
    AgentType["ASSISTANT"] = "assistant";
    AgentType["WORKER"] = "worker";
    AgentType["SUPERVISOR"] = "supervisor";
    AgentType["SPECIALIST"] = "specialist";
})(AgentType || (AgentType = {}));
export var IntegrationLevel;
(function (IntegrationLevel) {
    IntegrationLevel["STANDALONE"] = "standalone";
    IntegrationLevel["BASIC"] = "basic";
    IntegrationLevel["ADVANCED"] = "advanced";
    IntegrationLevel["FULL"] = "full";
})(IntegrationLevel || (IntegrationLevel = {}));
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["LEARNING"] = "learning";
    AgentStatus["INACTIVE"] = "inactive";
    AgentStatus["SUSPENDED"] = "suspended";
    AgentStatus["TRAINING"] = "training";
})(AgentStatus || (AgentStatus = {}));
//# sourceMappingURL=agent.js.map