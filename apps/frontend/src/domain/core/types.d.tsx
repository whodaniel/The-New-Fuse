import { UserRole, AgentStatus, TaskPriority, TaskStatus, MessageType } from '../../models/enums.js';
export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface UserProfile extends BaseEntity {
    email: string;
    firstName?: string;
    lastName?: string;
    role: UserRole;
    isEmailVerified: boolean;
    isTwoFactorEnabled: boolean;
    preferences?: Record<string, any>;
}
export interface AgentConfig {
    id: string;
    name: string;
    description: string;
    status: AgentStatus;
    capabilities: string[];
    metadata: Record<string, any>;
}
export interface TaskDefinition extends BaseEntity {
    title: string;
    description: string;
    status: TaskStatus;
    priority: TaskPriority;
    assigneeId?: string;
    dueDate?: Date;
    tags: string[];
}
export interface Message extends BaseEntity {
    type: MessageType;
    content: string;
    senderId: string;
    recipientId?: string;
    metadata?: Record<string, any>;
}
export interface WorkspaceConfig {
    id: string;
    name: string;
    description: string;
    ownerId: string;
    members: WorkspaceMember[];
    settings: Record<string, any>;
}
export interface WorkspaceMember {
    userId: string;
    role: UserRole;
    permissions: string[];
    joinedAt: Date;
}
export interface ApiEndpoint {
    path: string;
    method: string;
    requiresAuth: boolean;
    rateLimit?: number;
}
export interface WebSocketEvent {
    type: string;
    payload: any;
    metadata?: Record<string, any>;
}
export interface ErrorResponse {
    code: string;
    message: string;
    details?: any;
}
export type Result<T> = {
    success: true;
    data: T;
} | {
    success: false;
    error: ErrorResponse;
};
