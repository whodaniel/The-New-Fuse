import { useContext } from 'react';
import { ToastContext, ToastProps } from '../components/ui/toast.js';

/**
 * Hook for accessing the toast context
 *
 * @example
 * // Usage in a component
 * const { toast } = useToast();
 *
 * // Show a success toast
 * toast({
 *   title: 'Success',
 *   description: 'Your changes have been saved',
 *   variant: 'success',
 * });
 *
 * // Show an error toast
 * toast({
 *   title: 'Error',
 *   description: 'Failed to save changes',
 *   variant: 'destructive',
 * });
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

export type { ToastProps };