import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast } from './index.js';
import { ToastProps, ToasterToast } from '../types.js';

// Define toast context
interface ToastContextType {
  toasts: ToasterToast[];
  toast: (props: Omit<ToastProps, 'id'>) => string;
  dismiss: (id: string) => void;
  update: (id: string, props: Partial<ToastProps>) => void;
}

// Create toast context
export const ToastContext = createContext<ToastContextType | null>(null);

// Toast provider component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToasterToast[]>([]);

  // Add toast
  const toast = useCallback((props: Omit<ToastProps, 'id'>) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: ToasterToast = { ...props, id };

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto dismiss
    if (props.duration !== 0) {
      setTimeout(() => {
        dismiss(id);
      }, props.duration || 5000);
    }

    return id;
  }, []);

  // Dismiss toast
  const dismiss = useCallback((id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  }, []);

  // Update toast
  const update = useCallback((id: string, props: Partial<ToastProps>) => {
    setToasts((prevToasts) =>
      prevToasts.map((toast) =>
        toast.id === id ? { ...toast, ...props } : toast
      )
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, toast, dismiss, update }}>
      {children}
      <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            title={toast.title}
            description={toast.description}
            action={
              <button
                type="button"
                onClick={() => dismiss(toast.id)}
                className="ml-auto p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
                aria-label="Close"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              </button>
            }
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
}
