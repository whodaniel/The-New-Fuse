import React, { ReactNode } from 'react';
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
    addToast: (toast: ToastProps) => void;
    removeToast: (id: string) => void;
    toast: (toast: ToastProps) => void;
}
export declare const ToastContext: React.Context<ToastContextType | undefined>;
export declare const useToast: () => ToastContextType;
export declare const ToastProvider: ({ children }: {
    children: ReactNode;
}) => import("react/jsx-runtime").JSX.Element;
export declare const Toaster: () => import("react/jsx-runtime").JSX.Element;
export declare const setGlobalToast: (addToast: (message: string, type: ToastType, duration?: number) => void) => void;
export declare const toast: {
    success: (message: string, duration?: number) => void;
    error: (message: string, duration?: number) => void;
    warning: (message: string, duration?: number) => void;
    info: (message: string, duration?: number) => void;
};
export {};
