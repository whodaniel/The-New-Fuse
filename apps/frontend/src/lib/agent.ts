export {}
exports.convertApiStatus = exports.validateAgentStatus = exports.transformStoreToApiAgent = exports.transformApiToStoreAgent = void 0;
const transformApiToStoreAgent = (apiAgent): any => ({
    id: apiAgent.id,
    name: apiAgent.name,
    type: apiAgent.type,
    status: apiAgent.status,
    personality: apiAgent.personality,
    skills: apiAgent.skills,
});
exports.transformApiToStoreAgent = transformApiToStoreAgent;
const transformStoreToApiAgent = (storeAgent): any => ({
    id: storeAgent.id,
    name: storeAgent.name,
    type: storeAgent.type,
    status: storeAgent.status,
    personality: storeAgent.personality,
    skills: storeAgent.skills,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
});
exports.transformStoreToApiAgent = transformStoreToApiAgent;
const validateAgentStatus = (status): any => {
    if (status === 'idle' || status === 'busy' || status === 'offline') {
        return status;
    }
    return 'idle';
};
exports.validateAgentStatus = validateAgentStatus;
const convertApiStatus = (status): any => {
    switch (status) {
        case 'active':
            return 'idle';
        case 'busy':
            return 'busy';
        default:
            return 'offline';
    }
};
exports.convertApiStatus = convertApiStatus;
export {};
//# sourceMappingURL=agent.js.map