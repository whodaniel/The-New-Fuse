import { User } from './user.entity.js';
import { ChatRoom } from './chat-room.entity.js';
import { Agent } from './agent.entity.js';
export declare class Message {
    id: string;
    content: string;
    sender: User;
    agent?: Agent;
    room: ChatRoom;
    parentMessage?: Message;
    replies: Message[];
    metadata: Record<string, any>;
    attachments?: string[];
    timestamp: Date;
    updatedAt: Date;
    isEdited: boolean;
    isDeleted: boolean;
    reactions: Record<string, string[]>;
}
