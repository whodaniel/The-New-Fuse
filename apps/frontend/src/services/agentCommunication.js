var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
import { webSocketService } from './websocket';
var AgentCommunicationService = /** @class */ (function () {
    function AgentCommunicationService() {
        this.currentAgentId = 'composer';
        this.setupListeners();
    }
    AgentCommunicationService.prototype.setupListeners = function () {
        // Listen for messages from the WebSocket and process them
        webSocketService.on('redis_message', function (data) {
            var channel = data.channel, message = data.message;
            // Forward the message to the appropriate event listeners
            if (channel === 'agent:broadcast') {
                webSocketService.emit('agent:broadcast', message);
            }
            else if (channel.startsWith('agent:direct:')) {
                webSocketService.emit(channel, message);
            }
        });
    };
    AgentCommunicationService.prototype.setCurrentAgent = function (agentId) {
        this.currentAgentId = agentId;
    };
    AgentCommunicationService.prototype.getCurrentAgent = function () {
        return this.currentAgentId;
    };
    /**
     * Send a broadcast message to all agents
     */
    AgentCommunicationService.prototype.broadcastMessage = function (message) {
        var fullMessage = __assign(__assign({}, message), { senderId: this.currentAgentId, timestamp: message.timestamp || new Date().toISOString() });
        webSocketService.send('redis_publish', {
            channel: 'agent:broadcast',
            message: fullMessage
        });
    };
    /**
     * Send a direct message to a specific agent
     */
    AgentCommunicationService.prototype.sendDirectMessage = function (targetAgent, message) {
        var fullMessage = __assign(__assign({}, message), { senderId: this.currentAgentId, targetAgent: targetAgent, timestamp: message.timestamp || new Date().toISOString() });
        webSocketService.send('redis_publish', {
            channel: "agent:direct:".concat(targetAgent),
            message: fullMessage
        });
    };
    /**
     * Subscribe to a direct channel for the current agent
     */
    AgentCommunicationService.prototype.subscribeToDirectChannel = function () {
        webSocketService.send('redis_subscribe', {
            channel: "agent:direct:".concat(this.currentAgentId)
        });
    };
    /**
     * Subscribe to broadcast channel
     */
    AgentCommunicationService.prototype.subscribeToBroadcastChannel = function () {
        webSocketService.send('redis_subscribe', {
            channel: 'agent:broadcast'
        });
    };
    return AgentCommunicationService;
}());
export var agentCommunicationService = new AgentCommunicationService();
