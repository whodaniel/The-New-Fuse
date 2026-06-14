"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useA2ADiscovery = useA2ADiscovery;
const react_1 = require("react");
function useA2ADiscovery() {
    const [discoveredAgents, setDiscoveredAgents] = (0, react_1.useState)([]);
    const discoverAgents = (0, react_1.useCallback)(async (criteria) => {
        // Mock implementation - in real scenario this would discover via A2A service
        setDiscoveredAgents([]);
    }, []);
    return {
        discoveredAgents,
        discoverAgents
    };
}
//# sourceMappingURL=useA2ADiscovery.js.map