interface ToastProps {
    type?: 'success' | 'error' | 'info';
    message: string;
    duration?: number;
}
export declare const useToast: () => {
    showToast: ({ type, message, duration }: ToastProps) => void;
};
export type { ToastProps };
export default useToast;
