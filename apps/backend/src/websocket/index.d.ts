import { Server } from 'socket.io';
import { AgentService } from '../services/agent.service.js';
import { ChatService } from '../services/chatService.js';
export declare function initializeWebSocket(server: any, deps: {
    agentService: AgentService;
    chatService: ChatService;
}): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
