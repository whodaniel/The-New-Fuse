import React from 'react';
import { Toast, Toaster } from './Toast';
export interface ToastProps {
    id?: string;
    title?: string;
    description?: React.ReactNode;
    variant?: 'default' | 'success' | 'destructive' | 'info' | 'warning';
    duration?: number;
}
interface ToastContextType {
    toast: (props: ToastProps) => void;
    dismiss: (id: string) => void;
}
export declare const ToastContext: React.Context<ToastContextType | null>;
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export { Toast, Toaster };
