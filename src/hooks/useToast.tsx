import { useState, useCallback } from "react";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info" | "warning";
  duration?: number;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback(
    (newToast: Omit<Toast, "id">) => {
      const id = Math.random().toString(36).substr(2, 9);
      const toast: Toast = {
        ...newToast,
        id,
        duration: newToast.duration || 5000, // Default duration if not provided
      };

      setToasts((currentToasts) => [...currentToasts, toast]);

      // Auto-remove toast after duration
      setTimeout(() => {
        removeToast(id);
      }, toast.duration);
    },
    [],
  );

  const removeToast = useCallback(
    (id: string) => {
      setToasts((currentToasts) =>
        currentToasts.filter((toast) => toast.id !== id),
      );
    },
    [],
  );

  return {
    toasts,
    addToast,
    removeToast,
  };
}
