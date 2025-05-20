import React from 'react';
import { Toast } from './index.js';
import { useToast } from './use-toast.js';
import { cn } from '../../utils/cn.js';
import './toast.css';

/**
 * Toaster component that displays all active toasts
 *
 * @example
 * ```tsx
 * // In your app layout
 * import { Toaster } from '@the-new-fuse/ui-consolidated';
 *
 * function Layout({ children }) {
 *   return (
 *     <>
 *       {children}
 *       <Toaster />
 *     </>
 *   );
 * }
 * ```
 */
export function Toaster({
  position = 'bottom-right',
  className,
}: {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  className?: string;
}) {
  const { toasts, dismiss } = useToast();

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-right': 'bottom-4 right-4',
  };

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col gap-2 w-full max-w-sm',
        positionClasses[position],
        className
      )}
    >
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          variant={toast.variant}
          title={toast.title}
          description={toast.description}
          className={cn('animate-slide-in-right', toast.className)}
          action={
            <button
              type="button"
              onClick={() => dismiss(toast.id)}
              className="ml-auto p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-400 dark:focus:ring-gray-600"
              aria-label="Close"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          }
        />
      ))}
    </div>
  );
}
