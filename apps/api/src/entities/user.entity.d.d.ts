import { UserRole } from '../types/user.types.js';
import { Agent } from './agent.entity.js';
import { ChatRoom } from './chat-room.entity.js';
import { Message } from './message.entity.js';
import { Workflow } from './workflow.entity.js';
export declare class User {
    id: string;
    username: string;
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    roles: UserRole[];
    isActive: boolean;
    lastLoginAt?: Date;
    agents: Agent[];
    chatRooms: ChatRoom[];
    messages: Message[];
    workflows: Workflow[];
    createdAt: Date;
    updatedAt: Date;
    preferences: Record<string, any>;
    metadata: Record<string, any>;
}
