import { Priority } from './core/enums';
export interface Command {
    id: string;
    commandType: string;
    payload: Record<string, unknown>;
    timestamp: Date;
    source: string;
    target?: string;
    priority?: Priority;
    timeout?: number;
    correlationId?: string;
    metadata?: Record<string, unknown>;
}
export interface CommandResult {
    id: string;
    commandId: string;
    status: 'success' | 'error' | 'timeout';
    result?: unknown;
    error?: string;
    timestamp: Date;
    duration?: number;
    metadata?: Record<string, unknown>;
}
export interface Notification {
    id: string;
    level: 'info' | 'warning' | 'error' | 'success';
    title: string;
    text: string;
    timestamp: Date;
    source: string;
    target?: string;
    details?: Record<string, unknown>;
    metadata?: Record<string, unknown>;
}
export interface NotificationOptions {
    persistent?: boolean;
    priority?: Priority;
    timeout?: number;
    actions?: NotificationAction[];
}
export interface NotificationAction {
    id: string;
    label: string;
    action: () => void | Promise<void>;
    style?: 'primary' | 'secondary' | 'danger';
}
//# sourceMappingURL=commands.d.ts.map