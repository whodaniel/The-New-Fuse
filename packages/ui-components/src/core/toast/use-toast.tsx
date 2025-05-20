import { useContext } from 'react';
import { ToastContext } from './toast-provider.js';
import { ToastProps } from '../types.js';

/**
 * Hook for accessing the toast context
 *
 * @example
 * ```tsx
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
 * ```
 */
export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  return context;
}

/**
 * Shorthand function to create a toast without using the hook
 * Useful for utility functions outside of React components
 *
 * @example
 * ```tsx
 * // In a utility function
 * import { toast } from '@the-new-fuse/ui-consolidated';
 *
 * function handleApiError(error: Error) {
 *   toast({
 *     title: 'API Error',
 *     description: error.message,
 *     variant: 'destructive',
 *   });
 * }
 * ```
 */
export function toast(props: Omit<ToastProps, 'id'>) {
  // This is a placeholder that will be replaced at runtime
  // when the ToastProvider is mounted
  console.warn('Toast was called before ToastProvider was mounted');
  return '';
}
