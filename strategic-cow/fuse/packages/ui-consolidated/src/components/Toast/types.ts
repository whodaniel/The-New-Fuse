import * as React from 'react';

export interface ToastProps {
  id?: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'success' | 'error' | 'warning' | 'destructive';
  duration?: number;
  action?: React.ReactNode;
}

export type ToastActionElement = React.ReactNode;

export interface ToastContextType {
  toasts: ToastProps[];
  addToast: (toast: ToastProps) => void;
  removeToast: (id: string) => void;
  updateToast: (id: string, toast: Partial<ToastProps>) => void;
}
