import { User } from './user.entity';
import { Message } from './message.entity';
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
//# sourceMappingURL=chat-room.entity.d.ts.map