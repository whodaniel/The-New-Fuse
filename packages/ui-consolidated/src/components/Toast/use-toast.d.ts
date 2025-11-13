export interface Toast {
    id: string;
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive';
}
export interface UseToastReturn {
    toasts: Toast[];
    toast: (props: Omit<Toast, 'id'>) => void;
    dismiss: (id: string) => void;
}
export declare function useToast(): UseToastReturn;
//# sourceMappingURL=use-toast.d.ts.map