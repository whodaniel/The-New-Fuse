import React from "react";
import { cn } from '../../utils/cn.js';
import { ToastProps } from '../types.js';
import { X } from "lucide-react";

/**
 * Toast component for displaying notifications
 *
 * @example
 * ```tsx
 * <Toast
 *   variant="success"
 *   title="Success"
 *   description="Your changes have been saved"
 * />
 * ```
 */
const Toast = React.forwardRef<HTMLDivElement, ToastProps>(
  ({ className, variant = "default", title, description, action, ...props }, ref) => {
    const variantStyles = {
      default: "border bg-background",
      success: "border-green-600 bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400",
      info: "border-blue-600 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
      warning: "border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-400",
      destructive: "group border-destructive bg-destructive text-destructive-foreground",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full items-center justify-between space-x-4 rounded-md border p-4 shadow-lg",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="flex flex-col gap-1">
          {title && <div className="text-sm font-medium">{title}</div>}
          {description && (
            <div className="text-sm opacity-90">{description}</div>
          )}
        </div>
        {action}
      </div>
    );
  }
);

Toast.displayName = "Toast";

/**
 * Close button for toast notifications
 */
const ToastClose = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-70 transition-opacity hover:text-foreground hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100",
      className
    )}
    {...props}
  >
    <X className="h-4 w-4" />
  </button>
));

ToastClose.displayName = "ToastClose";

// Export components
export { Toast, ToastClose };

// Re-export from other files
export { ToastProvider } from './toast-provider.js';
export { useToast, toast } from './use-toast.js';
export { Toaster } from './toaster.js';