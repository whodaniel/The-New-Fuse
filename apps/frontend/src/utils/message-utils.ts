export const getAgentStatusColor = (status): any => {
    switch (status.toLowerCase()) {
        case 'active':
            return 'bg-green-500';
        case 'idle':
            return 'bg-yellow-500';
        case 'offline':
            return 'bg-red-500';
        default:
            return 'bg-gray-500';
    }
};
//# sourceMappingURL=message-utils.js.map