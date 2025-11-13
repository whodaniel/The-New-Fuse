/**
 * MCP Agent Integration Interface
 *
 * This interface defines the contract for integrating agents with the MCP system,
 * enabling agent-to-agent communication through standardized MCP protocols.
 */
/**
 * Agent status enumeration
 */
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ACTIVE"] = "active";
    AgentStatus["INACTIVE"] = "inactive";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["ERROR"] = "error";
    AgentStatus["MAINTENANCE"] = "maintenance";
})(AgentStatus || (AgentStatus = {}));
//# sourceMappingURL=IMCPAgentIntegration.js.map