export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface NotificationOptions {
  type?: NotificationType;
  title?: string;
  message: string;
  duration?: number;
  position?: 'top' | 'bottom';
  dismissible?: boolean;
}

interface NotificationEvent extends CustomEvent<NotificationOptions> {
  type: string;
}

const NOTIFICATION_EVENT = 'app:notification';

export function showNotification(options: NotificationOptions): void {
  const event = new CustomEvent(NOTIFICATION_EVENT, {
    detail: {
      type: 'info',
      duration: 3000,
      position: 'top',
      dismissible: true,
      ...options,
    },
  }) as NotificationEvent;

  window.dispatchEvent(event);
}

export function success(message: string, title?: string): void {
  showNotification({
    type: 'success',
    message,
    title,
  });
}

export function error(message: string, title?: string): void {
  showNotification({
    type: 'error',
    message,
    title,
  });
}

export function info(message: string, title?: string): void {
  showNotification({
    type: 'info',
    message,
    title,
  });
}

export function warning(message: string, title?: string): void {
  showNotification({
    type: 'warning',
    message,
    title,
  });
}

export function useNotifications(callback: (notification: NotificationOptions): any => void): () => void {
  const handler = ((event: NotificationEvent): any => {
    callback(event.detail);
  }) as EventListener;

  window.addEventListener(NOTIFICATION_EVENT, handler);

  return () => {
    window.removeEventListener(NOTIFICATION_EVENT, handler);
  };
}

// System notification support
export function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return Promise.resolve('denied');
  }
  
  return Notification.requestPermission();
}

export async function showSystemNotification(
  title: string,
  options: NotificationOptions & { icon?: string; tag?: string }
): Promise<void> {
  if (!('Notification' in window)) return;

  const permission = await requestNotificationPermission();
  if (permission !== 'granted') return;

  new Notification(title, {
    body: options.message,
    icon: options.icon,
    tag: options.tag,
  });
}