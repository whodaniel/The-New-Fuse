import React, { useState, useEffect } from 'react';

interface ToastProps {
  id?: string;
  title?: string;
  description?: React.ReactNode;
  type?: 'default' | 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
}

export const Toast: React.React.FC<ToastProps> = ({
  id,
  title,
  description,
  type = 'default',
  duration = 3000,
  onClose,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onClose?.();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  if (!visible) return null;

  return (
    <div
      className={`toast toast-${type} p-4 rounded shadow-md flex items-center justify-between`}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div>
        {title && <h4 className="font-semibold">{title}</h4>}
        {description && <div className="text-sm">{description}</div>}
      </div>
      <button
        type="button"
        onClick={() => {
          setVisible(false);
          onClose?.();
        }}
        className="ml-4 text-gray-500 hover:text-gray-700"
        aria-label="Close"
      >
        ×
      </button>
    </div>
  );
};

interface ToasterProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  toastOptions?: {
    duration?: number;
    style?: React.CSSProperties;
    success?: { style?: React.CSSProperties };
    error?: { style?: React.CSSProperties };
    warning?: { style?: React.CSSProperties };
    info?: { style?: React.CSSProperties };
  };
}

export const Toaster: React.React.FC<ToasterProps> = ({
  position = 'bottom-right',
  toastOptions = {}
}) => {
  // In a real implementation, this would manage a list of toasts
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = (id: string) => {
    setToasts(toasts.filter(toast => toast.id !== id));
  };

  const positionClasses = {
    'top-left': 'top-0 left-0',
    'top-right': 'top-0 right-0',
    'bottom-left': 'bottom-0 left-0',
    'bottom-right': 'bottom-0 right-0',
    'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
    'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2',
  }[position];

  return (
    <div
      className={`fixed z-50 p-4 flex flex-col gap-2 ${positionClasses}`}
      role="region"
      aria-label="Notifications"
    >
      {toasts.map(toast => (
        <Toast
          key={toast.id}
          {...toast}
          onClose={() => removeToast(toast.id || '')}
          duration={toast.duration || toastOptions.duration}
        />
      ))}
    </div>
  );
};