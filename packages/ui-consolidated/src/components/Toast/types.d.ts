export interface ToastProps extends React.HTMLAttributes<HTMLDivElement> {
    title?: string;
    description?: string;
    variant?: 'default' | 'destructive' | 'success' | 'warning';
    duration?: number;
    action?: React.ReactElement;
}
export interface ToastActionElement extends React.HTMLAttributes<HTMLButtonElement> {
    altText?: string;
}
//# sourceMappingURL=types.d.ts.map