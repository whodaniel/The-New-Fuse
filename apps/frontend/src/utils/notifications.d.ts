export type NotificationType = 'success' | 'error' | 'info' | 'warning';
export interface NotificationOptions {
    type?: NotificationType;
    title?: string;
    message: string;
    duration?: number;
    position?: 'top' | 'bottom';
    dismissible?: boolean;
}
export declare function showNotification(options: NotificationOptions): void;
export declare function success(message: string, title?: string): void;
export declare function error(message: string, title?: string): void;
export declare function info(message: string, title?: string): void;
export declare function warning(message: string, title?: string): void;
export declare function useNotifications(callback: (notification: NotificationOptions) => void): () => void;
export declare function requestNotificationPermission(): Promise<NotificationPermission>;
export declare function showSystemNotification(title: string, options: NotificationOptions & {
    icon?: string;
    tag?: string;
}): Promise<void>;
