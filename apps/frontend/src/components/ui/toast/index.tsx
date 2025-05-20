import React, { createContext, useState, useCallback } from 'react';
import { Toast, Toaster } from './Toast.js';

// Define toast props
export interface ToastProps {
  id?: string;
  title?: string;
  description?: React.ReactNode;
  variant?: 'default' | 'success' | 'destructive' | 'info' | 'warning';
  duration?: number;
}

// Define toast context
interface ToastContextType {
  toast: (props: ToastProps) => void;
  dismiss: (id: string) => void;
}

// Create toast context
export const ToastContext = createContext<ToastContextType | null>(null);

// Toast provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  // Add toast
  const toast = useCallback((props: ToastProps) => {
    const id = props.id || Math.random().toString(36).substring(2, 9);
    setToasts((prevToasts) => [...prevToasts, { ...props, id }]);

    // Auto dismiss
    if (props.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, props.duration || 3000);
    }

    return id;
  }, []);

  // Dismiss toast
  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'var(--background)',
            color: 'var(--foreground)',
            border: '1px solid var(--border)',
          },
          success: {
            style: {
              background: 'var(--success)',
              color: 'var(--success-foreground)',
            },
          },
          error: {
            style: {
              background: 'var(--destructive)',
              color: 'var(--destructive-foreground)',
            },
          },
        }}
      >
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            id={toast.id}
            title={toast.title}
            description={toast.description}
            type={toast.variant === 'destructive' ? 'error' :
                 toast.variant === 'success' ? 'success' : 'default'}
            onClose={() => dismiss(toast.id || '')}
          />
        ))}
      </Toaster>
    </ToastContext.Provider>
  );
}

export { Toast, Toaster };