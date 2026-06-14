"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useA2AAgents = useA2AAgents;
const a2a_core_1 = require("@the-new-fuse/a2a-core");
const react_1 = require("react");
const A2AProvider_js_1 = require("../A2AProvider.js");
function useA2AAgents() {
    const { agents: rawAgents, sendMessage } = (0, A2AProvider_js_1.useA2AContext)();
    const agents = (rawAgents || []);
    const refreshAgents = (0, react_1.useCallback)(async () => {
        if (sendMessage) {
            await sendMessage({
                type: a2a_core_1.A2AMessageType.REQUEST,
                payload: { action: 'list_agents' },
            });
        }
    }, [sendMessage]);
    const findAgentsByType = (0, react_1.useCallback)((type) => {
        return agents.filter((agent) => agent.type === type);
    }, [agents]);
    return {
        agents,
        refreshAgents,
        findAgentsByType,
    };
}
//# sourceMappingURL=useA2AAgents.js.map