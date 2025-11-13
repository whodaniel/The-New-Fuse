import { useState, useCallback } from 'react';
export function useToast() {
    const [toasts, setToasts] = useState([]);
    const toast = useCallback((props) => {
        const id = Math.random().toString(36).substring(7);
        setToasts((prev) => [...prev, { ...props, id }]);
        // Auto-dismiss after 3 seconds
        setTimeout(() => {
            setToasts((prev) => prev.filter((t) => t.id !== id));
        }, 3000);
    }, []);
    const dismiss = useCallback((id) => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
    }, []);
    return { toasts, toast, dismiss };
}
//# sourceMappingURL=use-toast.js.map