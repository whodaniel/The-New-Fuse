import { User } from './user.entity.tsx';
import { ChatRoom } from './chat-room.entity.tsx';
import { Agent } from './agent.entity.tsx';
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
