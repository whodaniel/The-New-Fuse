export declare const enum MessageType {
    TEXT = "TEXT",
    IMAGE = "IMAGE",
    FILE = "FILE",
    AUDIO = "AUDIO",
    VIDEO = "VIDEO",
    SYSTEM = "SYSTEM"
}
export declare const enum PerformanceLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare const enum MessagePriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH"
}
export declare const enum MemberRole {
    OWNER = "OWNER",
    ADMIN = "ADMIN",
    MODERATOR = "MODERATOR",
    MEMBER = "MEMBER",
    GUEST = "GUEST"
}
export declare const enum MemberStatus {
    ONLINE = "ONLINE",
    AWAY = "AWAY",
    BUSY = "BUSY",
    OFFLINE = "OFFLINE"
}
export declare const enum RoomType {
    DIRECT = "DIRECT",
    GROUP = "GROUP",
    CHANNEL = "CHANNEL",
    SUPPORT = "SUPPORT"
}
export declare const enum ModerationLevel {
    NONE = "NONE",
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    STRICT = "STRICT"
}
export declare const enum ChatEventType {
    JOIN = "JOIN",
    LEAVE = "LEAVE",
    TYPING = "TYPING",
    READ = "READ",
    REACTION = "REACTION",
    MEMBER_ADDED = "MEMBER_ADDED",
    MEMBER_REMOVED = "MEMBER_REMOVED",
    ROOM_UPDATED = "ROOM_UPDATED",
    MESSAGE_DELETED = "MESSAGE_DELETED",
    MESSAGE_EDITED = "MESSAGE_EDITED"
}
export interface ChatMessage {
    id: string;
    roomId: string;
    senderId: string;
    content: string;
    type: MessageType;
    timestamp: string;
    metadata?: Record<string, any>;
    priority?: MessagePriority;
    replyTo?: string;
    edited?: boolean;
    reactions?: MessageReaction[];
}
export interface MessageReaction {
    emoji: string;
    count: number;
    users: string[];
}
export interface ChatRoomMember {
    id: string;
    name: string;
    avatar?: string;
    role: MemberRole;
    isTyping?: boolean;
    lastSeen?: string;
    status: MemberStatus;
}
export interface ChatRoom {
    id: string;
    name: string;
    description?: string;
    type: RoomType;
    createdAt: string;
    updatedAt: string;
    members: ChatRoomMember[];
    settings: RoomSettings;
    metadata?: Record<string, any>;
}
export interface RoomSettings {
    allowGuests: boolean;
    maxMembers?: number;
    messageRetention?: number;
    allowReactions: boolean;
    allowThreads: boolean;
    allowFiles: boolean;
    allowVoice: boolean;
    allowVideo: boolean;
    moderationLevel: ModerationLevel;
    languages?: string[];
    tags?: string[];
}
export interface ChatEvent {
    type: ChatEventType;
    roomId: string;
    userId: string;
    timestamp: string;
    metadata?: Record<string, any>;
}
export interface ChatError {
    code: string;
    message: string;
    details?: Record<string, any>;
}
