import { EventEmitter } from 'events';
export class AgentChatService extends EventEmitter {
    constructor() {
        super();
        this.messageQueue = [];
        this.ws = WebSocketService.getInstance();
        this.setupWebSocketListeners();
    }
    static getInstance() {
        if (!AgentChatService.instance) {
            AgentChatService.instance = new AgentChatService();
        }
        return AgentChatService.instance;
    }
    setupWebSocketListeners() {
        this.ws.on('message', (message) => {
            this.messageQueue.push(message);
            this.emit('message', message);
        });
        this.ws.on('error', (error) => {
            this.emit('error', error);
        });
    }
    async sendMessage(content, metadata) {
        const message = {
            id: crypto.randomUUID(),
            content,
            role: 'user',
            timestamp: Date.now(),
            metadata
        };
        await this.ws.send(JSON.stringify(message));
        this.messageQueue.push(message);
        this.emit('message', message);
    }
    getMessageHistory() {
        return [...this.messageQueue];
    }
    clearHistory() {
        this.messageQueue = [];
        this.emit('clear');
    }
}
//# sourceMappingURL=agent_chat.js.map