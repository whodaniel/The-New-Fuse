import { User } from './user.entity';
import { ChatRoom } from './chat-room.entity';
import { Agent } from './agent.entity';
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
