export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["OFFLINE"] = "offline";
})(AgentStatus || (AgentStatus = {}));
export var AgentCapability;
(function (AgentCapability) {
    AgentCapability["CHAT"] = "chat";
    AgentCapability["WORKFLOW"] = "workflow";
    AgentCapability["RESEARCH"] = "research";
    AgentCapability["CODE"] = "code";
    AgentCapability["ANALYSIS"] = "analysis";
    AgentCapability["INTEGRATION"] = "integration";
})(AgentCapability || (AgentCapability = {}));
