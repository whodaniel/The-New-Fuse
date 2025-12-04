import React from 'react';
interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
}
interface ToastContextType {
    toasts: Toast[];
    toast: (toast: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
}
export declare function ToastProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useToast(): ToastContextType;
export declare const toast: (toast: Omit<Toast, "id">) => Omit<Toast, "id">;
export {};
