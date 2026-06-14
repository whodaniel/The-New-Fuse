"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.toastMessages = void 0;
exports.useToast = useToast;
/**
 * Toast Notification Hook
 * Provides standardized toast messages across the application
 */
const react_hot_toast_1 = __importDefault(require("react-hot-toast"));
/**
 * Standardized toast messages for common operations
 */
exports.toastMessages = {
    // Success messages
    success: {
        saved: 'Changes saved successfully',
        created: (item) => `${item} created successfully`,
        updated: (item) => `${item} updated successfully`,
        deleted: (item) => `${item} deleted successfully`,
        copied: 'Copied to clipboard',
        uploaded: 'Upload completed',
        installed: (item) => `${item} installed successfully`,
        imported: (item) => `${item} imported successfully`,
        exported: (item) => `${item} exported successfully`,
        sent: 'Sent successfully',
        shared: 'Shared successfully',
    },
    // Error messages
    error: {
        generic: 'Something went wrong. Please try again.',
        network: 'Network error. Please check your connection.',
        unauthorized: 'You are not authorized to perform this action.',
        notFound: (item) => `${item} not found`,
        failed: (action) => `Failed to ${action}`,
        invalid: (field) => `Invalid ${field}`,
        required: (field) => `${field} is required`,
        tooLarge: (item, max) => `${item} is too large. Maximum size is ${max}`,
        tooSmall: (item, min) => `${item} is too small. Minimum size is ${min}`,
    },
    // Info messages
    info: {
        loading: (action) => `${action}...`,
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
function useToast() {
    const showSuccess = (message, options) => {
        react_hot_toast_1.default.success(message, options);
    };
    const showError = (message, options) => {
        react_hot_toast_1.default.error(message, options);
    };
    const showInfo = (message, options) => {
        (0, react_hot_toast_1.default)(message, options);
    };
    const showWarning = (message, options) => {
        (0, react_hot_toast_1.default)(message, { icon: '⚠️', ...options });
    };
    const showLoading = (message = exports.toastMessages.info.processing) => {
        return react_hot_toast_1.default.loading(message);
    };
    const dismissLoading = (toastId, message, isSuccess = true) => {
        if (message) {
            react_hot_toast_1.default.dismiss(toastId);
            isSuccess ? showSuccess(message) : showError(message);
        }
        else {
            react_hot_toast_1.default.dismiss(toastId);
        }
    };
    const asyncToast = async (promise, messages) => {
        return react_hot_toast_1.default.promise(promise, messages);
    };
    return {
        success: showSuccess,
        error: showError,
        info: showInfo,
        warning: showWarning,
        loading: showLoading,
        dismissLoading,
        asyncToast,
        messages: exports.toastMessages,
    };
}
//# sourceMappingURL=useToast.js.map