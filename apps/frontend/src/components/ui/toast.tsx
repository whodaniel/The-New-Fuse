import { createContext, ReactNode, useContext, useState } from 'react';

// Toast Types
export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface ToastProps {
  title?: string;
  description?: string;
  variant?: 'success' | 'destructive' | 'warning' | 'info';
  duration?: number;
}

interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant: 'success' | 'destructive' | 'warning' | 'info';
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  addToast: (messageOrProps: string | ToastProps, type?: ToastType) => void;
  removeToast: (id: string) => void;
  toast: (toast: ToastProps) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = (messageOrProps: string | ToastProps, type?: ToastType) => {
    const id = Math.random().toString(36).substring(2, 9);
    let newToast: Toast;

    // Support both calling conventions:
    // addToast('message', 'success') and addToast({ title: 'Title', variant: 'success' })
    if (typeof messageOrProps === 'string') {
      // Simple format: addToast(message, type)
      const variantMap: Record<ToastType, Toast['variant']> = {
        success: 'success',
        error: 'destructive',
        warning: 'warning',
        info: 'info',
      };
      newToast = {
        id,
        title: messageOrProps,
        variant: type ? variantMap[type] : 'info',
        duration: 5000,
      };
    } else {
      // Object format: addToast({ title, description, variant, duration })
      newToast = {
        id,
        title: messageOrProps.title,
        description: messageOrProps.description,
        variant: messageOrProps.variant || 'info',
        duration: messageOrProps.duration || 5000,
      };
    }

    setToasts((prevToasts) => [...prevToasts, newToast]);

    // Auto-remove after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, newToast.duration);
    }
  };

  const removeToast = (id: string) => {
    setToasts((prevToasts) => prevToasts.filter((toast) => toast.id !== id));
  };

  // toast function for object-style calls
  const toastFn = (props: ToastProps) => addToast(props);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast, toast: toastFn }}>
      {children}
    </ToastContext.Provider>
  );
};

export const Toaster = () => {
  const { toasts, removeToast } = useToast();

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`rounded-md px-3 py-2 text-white shadow-none transform transition-all duration-300 ease-in-out ${
            toast.variant === 'success'
              ? 'bg-green-500'
              : toast.variant === 'destructive'
                ? 'bg-red-500'
                : toast.variant === 'warning'
                  ? 'bg-yellow-500'
                  : 'bg-blue-500'
          }`}
          role="alert"
        >
          <div className="flex items-center justify-between">
            <div>
              {toast.title && <p className="font-semibold">{toast.title}</p>}
              {toast.description && <p className="text-sm opacity-90">{toast.description}</p>}
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="ml-4 focus:outline-none"
              aria-label="Close"
            >
              <span className="text-xl">&times;</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

// Global toast instance for direct usage
let globalAddToast: ((message: string, type: ToastType, duration?: number) => void) | undefined;

export const setGlobalToast = (
  addToast: (message: string, type: ToastType, duration?: number) => void
) => {
  globalAddToast = addToast;
};

// Toast methods for direct usage
export const toast = {
  success: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, 'success', duration);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is setup.');
    }
  },
  error: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, 'error', duration);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is setup.');
    }
  },
  warning: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, 'warning', duration);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is setup.');
    }
  },
  info: (message: string, duration?: number) => {
    if (globalAddToast) {
      globalAddToast(message, 'info', duration);
    } else {
      console.warn('Toast not initialized. Make sure ToastProvider is setup.');
    }
  },
};
