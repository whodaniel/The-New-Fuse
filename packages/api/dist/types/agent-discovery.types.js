/**
 * Agent Discovery System Types
 *
 * Defines interfaces for live agent discovery, capability registration,
 * and dynamic querying of agents in the distributed system.
 */
/**
 * Agent Status
 */
export var AgentStatus;
(function (AgentStatus) {
    AgentStatus["ONLINE"] = "online";
    AgentStatus["BUSY"] = "busy";
    AgentStatus["IDLE"] = "idle";
    AgentStatus["OFFLINE"] = "offline";
    AgentStatus["ERROR"] = "error";
    AgentStatus["STARTING"] = "starting";
    AgentStatus["STOPPING"] = "stopping";
})(AgentStatus || (AgentStatus = {}));
/**
 * Agent Discovery Events
 */
export var DiscoveryEvent;
(function (DiscoveryEvent) {
    DiscoveryEvent["AGENT_REGISTERED"] = "agent:registered";
    DiscoveryEvent["AGENT_UPDATED"] = "agent:updated";
    DiscoveryEvent["AGENT_DEREGISTERED"] = "agent:deregistered";
    DiscoveryEvent["AGENT_HEARTBEAT"] = "agent:heartbeat";
    DiscoveryEvent["AGENT_STATUS_CHANGED"] = "agent:status_changed";
    DiscoveryEvent["AGENT_HEALTH_CHANGED"] = "agent:health_changed";
})(DiscoveryEvent || (DiscoveryEvent = {}));
//# sourceMappingURL=agent-discovery.types.js.map