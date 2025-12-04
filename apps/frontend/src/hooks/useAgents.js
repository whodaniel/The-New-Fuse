import { useState } from 'react';
var DEFAULT_AGENTS = [
    { id: '1', name: 'Assistant', type: 'general', status: 'active' },
    { id: '2', name: 'Code Expert', type: 'specialist', status: 'active' },
    { id: '3', name: 'Data Analyst', type: 'specialist', status: 'active' },
];
export function useAgents() {
    var _a = useState(DEFAULT_AGENTS), agents = _a[0], setAgents = _a[1];
    var _b = useState(null), selectedAgent = _b[0], setSelectedAgent = _b[1];
    var _c = useState(null), conversationId = _c[0], setConversationId = _c[1];
    var selectAgent = function (agentId) {
        setSelectedAgent(agentId);
    };
    var clearConversation = function () {
        setConversationId(null);
    };
    return {
        agents: agents,
        selectedAgent: selectedAgent,
        conversationId: conversationId,
        selectAgent: selectAgent,
        clearConversation: clearConversation
    };
}
