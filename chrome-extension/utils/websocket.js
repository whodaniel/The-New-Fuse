export const setupWebSocket = (url, handlers) => {
    const ws = new WebSocket(url);
    ws.onopen = () => {
        console.log('WebSocket connected');
        handlers.onOpen?.();
    };
    ws.onclose = () => {
        console.log('WebSocket disconnected');
        handlers.onClose?.();
        // Attempt to reconnect after 5 seconds
        setTimeout(() => {
            setupWebSocket(url, handlers);
        }, 5000);
    };
    ws.onmessage = (event) => {
        try {
            const data = JSON.parse(event.data);
            handlers.onMessage?.(data);
        }
        catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        handlers.onError?.(error);
    };
    return ws;
};
export const sendMessage = (ws, message) => {
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(message));
    }
    else {
        console.error('WebSocket is not connected');
    }
};
//# sourceMappingURL=websocket.js.map