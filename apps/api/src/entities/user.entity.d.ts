import { UserRole } from '../types/user.types.js';
import { Agent } from './agent.entity.tsx';
import { ChatRoom } from './chat-room.entity.tsx';
import { Message } from './message.entity.tsx';
import { Workflow } from './workflow.entity.tsx';
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
