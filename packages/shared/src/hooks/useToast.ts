/**
 * Toast Notification Hook
 * Provides standardized toast messages across the application
 */
import toast from 'react-hot-toast';

export interface ToastOptions {
  duration?: number;
  position?:
    | 'top-left'
    | 'top-center'
    | 'top-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'bottom-right';
}

/**
 * Standardized toast messages for common operations
 */
export const toastMessages = {
  // Success messages
  success: {
    saved: 'Changes saved successfully',
    created: (item: string) => `${item} created successfully`,
    updated: (item: string) => `${item} updated successfully`,
    deleted: (item: string) => `${item} deleted successfully`,
    copied: 'Copied to clipboard',
    uploaded: 'Upload completed',
    installed: (item: string) => `${item} installed successfully`,
    imported: (item: string) => `${item} imported successfully`,
    exported: (item: string) => `${item} exported successfully`,
    sent: 'Sent successfully',
    shared: 'Shared successfully',
  },

  // Error messages
  error: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    unauthorized: 'You are not authorized to perform this action.',
    notFound: (item: string) => `${item} not found`,
    failed: (action: string) => `Failed to ${action}`,
    invalid: (field: string) => `Invalid ${field}`,
    required: (field: string) => `${field} is required`,
    tooLarge: (item: string, max: string) => `${item} is too large. Maximum size is ${max}`,
    tooSmall: (item: string, min: string) => `${item} is too small. Minimum size is ${min}`,
  },

  // Info messages
  info: {
    loading: (action: string) => `${action}...`,
    processing: 'Processing your request...',
    waiting: 'Please wait...',
    uploading: 'Uploading...',
    downloading: 'Downloading...',
    syncing: 'Syncing...',
  },

  // Warning messages
  warning: {
    unsaved: 'You have unsaved changes',
    slow: 'This operation may take a while',
    deprecated: 'This feature is deprecated',
    beta: 'This feature is in beta',
  },
};

/**
 * Custom hook for toast notifications with standardized messages
 */
export function useToast() {
  const showSuccess = (message: string, options?: ToastOptions) => {
    toast.success(message, options);
  };

  const showError = (message: string, options?: ToastOptions) => {
    toast.error(message, options);
  };

  const showInfo = (message: string, options?: ToastOptions) => {
    toast(message, options);
  };

  const showWarning = (message: string, options?: ToastOptions) => {
    toast(message, { icon: '⚠️', ...options });
  };

  const showLoading = (message: string = toastMessages.info.processing) => {
    return toast.loading(message);
  };

  const dismissLoading = (toastId: string, message?: string, isSuccess = true) => {
    if (message) {
      toast.dismiss(toastId);
      isSuccess ? showSuccess(message) : showError(message);
    } else {
      toast.dismiss(toastId);
    }
  };

  const asyncToast = async <T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: Error) => string);
    }
  ): Promise<T> => {
    return toast.promise(promise, messages);
  };

  return {
    success: showSuccess,
    error: showError,
    info: showInfo,
    warning: showWarning,
    loading: showLoading,
    dismissLoading,
    asyncToast,
    messages: toastMessages,
  };
}
