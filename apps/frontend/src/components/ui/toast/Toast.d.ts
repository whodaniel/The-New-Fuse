import React from 'react';
interface ToastProps {
    id?: string;
    title?: string;
    description?: React.ReactNode;
    type?: 'default' | 'success' | 'error' | 'warning' | 'info';
    duration?: number;
    onClose?: () => void;
}
export declare const Toast: React.React.FC<ToastProps>;
interface ToasterProps {
    position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
    toastOptions?: {
        duration?: number;
        style?: React.CSSProperties;
        success?: {
            style?: React.CSSProperties;
        };
        error?: {
            style?: React.CSSProperties;
        };
        warning?: {
            style?: React.CSSProperties;
        };
        info?: {
            style?: React.CSSProperties;
        };
    };
}
export declare const Toaster: React.React.FC<ToasterProps>;
export {};
