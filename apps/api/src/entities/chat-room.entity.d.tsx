import { User } from './user.entity.js';
import { Message } from './message.entity.js';
export declare class ChatRoom {
    id: string;
    name: string;
    description?: string;
    isPrivate: boolean;
    owner: User;
    members: User[];
    messages: Message[];
    settings: Record<string, any>;
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    lastMessageAt?: Date;
    isActive: boolean;
}
