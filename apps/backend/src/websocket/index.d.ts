import { Server } from 'socket.io';
import { AgentService } from '../services/agent.service';
import { ChatService } from '../services/chatService';
export declare function initializeWebSocket(server: any, deps: {
    agentService: AgentService;
    chatService: ChatService;
}): Server<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
