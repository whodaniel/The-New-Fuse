"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentCapability = exports.AgentStatus = void 0;
var AgentStatus;
(function (AgentStatus) {
    AgentStatus["IDLE"] = "idle";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["OFFLINE"] = "offline";
})(AgentStatus || (exports.AgentStatus = AgentStatus = {}));
var AgentCapability;
(function (AgentCapability) {
    AgentCapability["CHAT"] = "chat";
    AgentCapability["WORKFLOW"] = "workflow";
    AgentCapability["RESEARCH"] = "research";
    AgentCapability["CODE"] = "code";
    AgentCapability["ANALYSIS"] = "analysis";
    AgentCapability["INTEGRATION"] = "integration";
})(AgentCapability || (exports.AgentCapability = AgentCapability = {}));
