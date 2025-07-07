import { User } from './user.entity';
export declare class Message {
    id: string;
    userId: string;
    role: string;
    content: string;
    createdAt: Date;
    user: User;
}
