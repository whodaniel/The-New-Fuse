const wss = new WebSocketServer({ port: 3001 });
const mockCollaborationData = [
    {
        agentName: 'Agent 1',
        collaborationScore: 85,
        taskCompletionRate: 92
    },
    {
        agentName: 'Agent 2',
        collaborationScore: 78,
        taskCompletionRate: 88
    },
    {
        agentName: 'Agent 3',
        collaborationScore: 92,
        taskCompletionRate: 95
    }
];
wss.on('connection', (ws) => {
    
    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message.toString());
            if (data.type === 'getCollaborationMetrics') {
                ws.send(JSON.stringify({
                    type: 'collaborationMetricsUpdate',
                    payload: mockCollaborationData
                }));
            }
        }
        catch (error) {
            console.error('Error processing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                payload: { message: 'Invalid message format' }
            }));
        }
    });
    ws.on('close', () => {
        
    });
});

//# sourceMappingURL=mockWebSocket.js.map