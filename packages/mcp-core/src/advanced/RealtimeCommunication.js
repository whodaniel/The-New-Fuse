"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeCommunicationHub = void 0;
const events_1 = require("events");
const ws_1 = require("ws");
const crypto_1 = require("crypto");
class RealtimeCommunicationHub extends events_1.EventEmitter {
    agents = new Map();
    channels = new Map();
    messageHistory = new Map();
    pendingAcks = new Map();
    wsServer;
    port;
    isRunning = false;
    constructor(port = 8766) {
        super();
        this.port = port;
        this.setupDefaultChannels();
    }
    /**
     * Start the communication hub
     */
    async start() {
        if (this.isRunning) {
            throw new Error('Communication hub is already running');
        }
        this.wsServer = new ws_1.WebSocketServer({ port: this.port });
        this.wsServer.on('connection', (ws, request) => {
            this.handleNewConnection(ws, request);
        });
        this.wsServer.on('error', (error) => {
            this.emit('error', error);
        });
        this.isRunning = true;
        this.emit('started', { port: this.port });
    }
    /**
     * Stop the communication hub
     */
    async stop() {
        if (!this.isRunning)
            return;
        // Close all agent connections
        for (const agent of this.agents.values()) {
            if (agent.websocket) {
                agent.websocket.close();
            }
        }
        // Clear pending acknowledgments
        for (const { timeout } of this.pendingAcks.values()) {
            clearTimeout(timeout);
        }
        this.pendingAcks.clear();
        if (this.wsServer) {
            this.wsServer.close();
        }
        this.isRunning = false;
        this.emit('stopped');
    }
    /**
     * Register a new agent
     */
    async registerAgent(agent) {
        const agentConnection = {
            ...agent,
            status: 'offline',
            lastSeen: Date.now()
        };
        this.agents.set(agent.id, agentConnection);
        this.messageHistory.set(agent.id, []);
        this.emit('agentRegistered', agentConnection);
    }
    /**
     * Unregister an agent
     */
    async unregisterAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (!agent)
            return;
        if (agent.websocket) {
            agent.websocket.close();
        }
        this.agents.delete(agentId);
        this.messageHistory.delete(agentId);
        this.emit('agentUnregistered', { agentId });
    }
    /**
     * Send message to specific agent(s)
     */
    async sendMessage(message) {
        const fullMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: Date.now()
        };
        // Store message in history
        this.storeMessage(fullMessage);
        // Handle different message types
        if (Array.isArray(message.to)) {
            // Multi-cast message
            for (const agentId of message.to) {
                await this.deliverMessage(fullMessage, agentId);
            }
        }
        else if (message.to === '*') {
            // Broadcast message
            for (const agentId of this.agents.keys()) {
                if (agentId !== message.from) {
                    await this.deliverMessage(fullMessage, agentId);
                }
            }
        }
        else {
            // Direct message
            await this.deliverMessage(fullMessage, message.to);
        }
        // Handle acknowledgment requirement
        if (message.requiresAck) {
            this.setupAckTimeout(fullMessage);
        }
        this.emit('messageSent', fullMessage);
        return fullMessage.id;
    }
    /**
     * Create a communication channel
     */
    async createChannel(channel) {
        const channelId = this.generateChannelId();
        const fullChannel = {
            ...channel,
            id: channelId
        };
        this.channels.set(channelId, fullChannel);
        this.messageHistory.set(channelId, []);
        this.emit('channelCreated', fullChannel);
        return channelId;
    }
    /**
     * Join a channel
     */
    async joinChannel(agentId, channelId) {
        const channel = this.channels.get(channelId);
        const agent = this.agents.get(agentId);
        if (!channel || !agent) {
            throw new Error('Channel or agent not found');
        }
        if (!channel.participants.includes(agentId)) {
            channel.participants.push(agentId);
            this.emit('agentJoinedChannel', { agentId, channelId });
        }
    }
    /**
     * Leave a channel
     */
    async leaveChannel(agentId, channelId) {
        const channel = this.channels.get(channelId);
        if (!channel)
            return;
        const index = channel.participants.indexOf(agentId);
        if (index > -1) {
            channel.participants.splice(index, 1);
            this.emit('agentLeftChannel', { agentId, channelId });
        }
    }
    /**
     * Send message to channel
     */
    async sendChannelMessage(channelId, message) {
        const channel = this.channels.get(channelId);
        if (!channel) {
            throw new Error('Channel not found');
        }
        const fullMessage = {
            ...message,
            id: this.generateMessageId(),
            timestamp: Date.now(),
            to: channel.participants.filter(p => p !== message.from)
        };
        // Store in channel history
        const channelHistory = this.messageHistory.get(channelId) || [];
        channelHistory.push(fullMessage);
        this.messageHistory.set(channelId, channelHistory);
        // Deliver to all participants
        for (const participantId of channel.participants) {
            if (participantId !== message.from) {
                await this.deliverMessage(fullMessage, participantId);
            }
        }
        this.emit('channelMessageSent', { channelId, message: fullMessage });
        return fullMessage.id;
    }
    /**
     * Get agent status
     */
    getAgentStatus(agentId) {
        return this.agents.get(agentId);
    }
    /**
     * Get all online agents
     */
    getOnlineAgents() {
        return Array.from(this.agents.values()).filter(agent => agent.status === 'online');
    }
    /**
     * Get message history
     */
    getMessageHistory(agentId, filter) {
        const history = this.messageHistory.get(agentId) || [];
        if (!filter)
            return history;
        return history.filter(message => {
            if (filter.messageType && message.type !== filter.messageType)
                return false;
            if (filter.priority && message.priority !== filter.priority)
                return false;
            if (filter.timeRange) {
                if (message.timestamp < filter.timeRange.start || message.timestamp > filter.timeRange.end) {
                    return false;
                }
            }
            if (filter.keywords) {
                const messageText = JSON.stringify(message.payload).toLowerCase();
                if (!filter.keywords.some(keyword => messageText.includes(keyword.toLowerCase()))) {
                    return false;
                }
            }
            return true;
        });
    }
    /**
     * Get channel information
     */
    getChannel(channelId) {
        return this.channels.get(channelId);
    }
    /**
     * Get all channels
     */
    getAllChannels() {
        return Array.from(this.channels.values());
    }
    /**
     * Handle new WebSocket connection
     */
    handleNewConnection(ws, request) {
        let agentId = null;
        ws.on('message', async (data) => {
            try {
                const message = JSON.parse(data.toString());
                if (message.type === 'register') {
                    agentId = message.agentId;
                    const agent = this.agents.get(agentId);
                    if (agent) {
                        agent.websocket = ws;
                        agent.status = 'online';
                        agent.lastSeen = Date.now();
                        ws.send(JSON.stringify({
                            type: 'registered',
                            agentId,
                            timestamp: Date.now()
                        }));
                        this.emit('agentConnected', agent);
                    }
                    else {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Agent not registered'
                        }));
                        ws.close();
                    }
                }
                else if (message.type === 'ack') {
                    this.handleAcknowledgment(message.messageId);
                }
                else if (message.type === 'heartbeat') {
                    if (agentId) {
                        const agent = this.agents.get(agentId);
                        if (agent) {
                            agent.lastSeen = Date.now();
                            ws.send(JSON.stringify({ type: 'heartbeat_ack' }));
                        }
                    }
                }
            }
            catch (error) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Invalid message format'
                }));
            }
        });
        ws.on('close', () => {
            if (agentId) {
                const agent = this.agents.get(agentId);
                if (agent) {
                    agent.status = 'offline';
                    agent.websocket = undefined;
                    this.emit('agentDisconnected', agent);
                }
            }
        });
        ws.on('error', (error) => {
            this.emit('connectionError', { agentId, error });
        });
    }
    /**
     * Deliver message to specific agent
     */
    async deliverMessage(message, targetAgentId) {
        const agent = this.agents.get(targetAgentId);
        if (!agent || !agent.websocket || agent.status !== 'online') {
            // Store for later delivery or handle offline delivery
            this.handleOfflineDelivery(message, targetAgentId);
            return;
        }
        try {
            agent.websocket.send(JSON.stringify({
                type: 'message',
                message
            }));
            this.emit('messageDelivered', { message, targetAgentId });
        }
        catch (error) {
            this.emit('deliveryError', { message, targetAgentId, error });
        }
    }
    /**
     * Handle offline message delivery
     */
    handleOfflineDelivery(message, targetAgentId) {
        // Store message for when agent comes online
        const agentHistory = this.messageHistory.get(targetAgentId) || [];
        agentHistory.push(message);
        this.messageHistory.set(targetAgentId, agentHistory);
        this.emit('messageQueued', { message, targetAgentId });
    }
    /**
     * Store message in history
     */
    storeMessage(message) {
        // Store in sender's history
        const senderHistory = this.messageHistory.get(message.from) || [];
        senderHistory.push(message);
        this.messageHistory.set(message.from, senderHistory);
        // Store in recipient's history if direct message
        if (typeof message.to === 'string' && message.to !== '*') {
            const recipientHistory = this.messageHistory.get(message.to) || [];
            recipientHistory.push(message);
            this.messageHistory.set(message.to, recipientHistory);
        }
    }
    /**
     * Setup acknowledgment timeout
     */
    setupAckTimeout(message) {
        const timeout = setTimeout(() => {
            this.pendingAcks.delete(message.id);
            this.emit('ackTimeout', message);
        }, 30000); // 30 second timeout
        this.pendingAcks.set(message.id, { message, timeout });
    }
    /**
     * Handle message acknowledgment
     */
    handleAcknowledgment(messageId) {
        const pending = this.pendingAcks.get(messageId);
        if (pending) {
            clearTimeout(pending.timeout);
            this.pendingAcks.delete(messageId);
            this.emit('messageAcknowledged', pending.message);
        }
    }
    /**
     * Setup default channels
     */
    setupDefaultChannels() {
        // System broadcast channel
        this.channels.set('system', {
            id: 'system',
            name: 'System Broadcast',
            type: 'broadcast',
            participants: [],
            encrypted: false,
            persistent: true,
            metadata: { system: true }
        });
        // General coordination channel
        this.channels.set('coordination', {
            id: 'coordination',
            name: 'Agent Coordination',
            type: 'group',
            participants: [],
            encrypted: true,
            persistent: true,
            metadata: { purpose: 'coordination' }
        });
    }
    /**
     * Generate unique message ID
     */
    generateMessageId() {
        return `msg_${Date.now()}_${(0, crypto_1.randomBytes)(8).toString('hex')}`;
    }
    /**
     * Generate unique channel ID
     */
    generateChannelId() {
        return `ch_${Date.now()}_${(0, crypto_1.randomBytes)(8).toString('hex')}`;
    }
    /**
     * Get communication statistics
     */
    getStatistics() {
        const totalMessages = Array.from(this.messageHistory.values())
            .reduce((sum, history) => sum + history.length, 0);
        const messagesPerAgent = {};
        for (const [agentId, history] of this.messageHistory.entries()) {
            messagesPerAgent[agentId] = history.length;
        }
        return {
            totalAgents: this.agents.size,
            onlineAgents: this.getOnlineAgents().length,
            totalChannels: this.channels.size,
            totalMessages,
            messagesPerAgent
        };
    }
}
exports.RealtimeCommunicationHub = RealtimeCommunicationHub;
exports.default = RealtimeCommunicationHub;
//# sourceMappingURL=RealtimeCommunication.js.map