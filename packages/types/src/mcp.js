export function parseMCPMessage(data) {
    // Implementation would go here
    return data;
}
export function createMCPResponse(id, result) {
    return {
        id,
        type: 'response',
        data: result,
        timestamp: new Date()
    };
}
export function createMCPError(id, error) {
    return {
        id,
        type: 'error',
        data: error,
        timestamp: new Date()
    };
}
//# sourceMappingURL=mcp.js.map