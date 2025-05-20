import * as React from "react";
import { ToastProps, ToastActionElement } from './types.js';
import { cn } from '../lib/utils.js';

const Toast = React.forwardRef<
  HTMLDivElement,
  ToastProps
>(({ title, description, variant = 'default', duration = 3000, action, ...props }, ref) => {
  // Define variant styles
  const variantStyles = {
    default: "border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 dark:text-gray-100",
    success: "border-green-500 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900 dark:text-green-100",
    error: "border-red-500 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100",
    warning: "border-yellow-500 bg-yellow-50 text-yellow-800 dark:border-yellow-700 dark:bg-yellow-900 dark:text-yellow-100",
    destructive: "border-red-500 bg-red-50 text-red-800 dark:border-red-700 dark:bg-red-900 dark:text-red-100"
  };

  // Ensure variant exists in our styles, default to 'default' if not
  const toastVariant = variant in variantStyles ? variant : 'default';

  return (
    <div
      ref={ref}
      className={cn(
        "rounded-lg border shadow-lg p-4",
        variantStyles[toastVariant as keyof typeof variantStyles] // Type assertion to help TypeScript
      )}
      {...props}
    >
      {title && <div className="font-medium">{title}</div>}
      {description && <div className="mt-1 text-sm">{description}</div>}
      {action && (
        <div className="mt-2 flex justify-end">
          {action}
        </div>
      )}
    </div>
  );
});

Toast.displayName = "Toast";

// Create the Toaster component - this will be used to render toasts
const Toaster: React.FC = () => {
  return <div id="toast-container" className="fixed top-0 right-0 z-50 p-4 space-y-4" />;
};

export { Toast, Toaster };