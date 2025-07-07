import { UserRole } from '../types/user.types';
import { Agent } from './agent.entity';
import { ChatRoom } from './chat-room.entity';
import { Message } from './message.entity';
import { Workflow } from './workflow.entity';
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
