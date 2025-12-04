var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, createContext, useContext } from 'react';
export var ToastContext = createContext(undefined);
export var useToast = function () {
    var context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};
export var ToastProvider = function (_a) {
    var children = _a.children;
    var _b = useState([]), toasts = _b[0], setToasts = _b[1];
    var addToast = function (toastProps) {
        var id = Math.random().toString(36).substring(2, 9);
        var newToast = {
            id: id,
            title: toastProps.title,
            description: toastProps.description,
            variant: toastProps.variant || 'info',
            duration: toastProps.duration || 5000
        };
        setToasts(function (prevToasts) { return __spreadArray(__spreadArray([], prevToasts, true), [newToast], false); });
        // Auto-remove after duration
        if (newToast.duration > 0) {
            setTimeout(function () {
                removeToast(id);
            }, newToast.duration);
        }
    };
    var removeToast = function (id) {
        setToasts(function (prevToasts) { return prevToasts.filter(function (toast) { return toast.id !== id; }); });
    };
    return (_jsx(ToastContext.Provider, { value: { toasts: toasts, addToast: addToast, removeToast: removeToast, toast: addToast }, children: children }));
};
export var Toaster = function () {
    var _a = useToast(), toasts = _a.toasts, removeToast = _a.removeToast;
    return (_jsx("div", { className: "fixed top-4 right-4 z-50 flex flex-col gap-2 w-full max-w-sm", children: toasts.map(function (toast) { return (_jsx("div", { className: "rounded-md px-6 py-4 text-white shadow-lg transform transition-all duration-300 ease-in-out ".concat(toast.variant === 'success'
                ? 'bg-green-500'
                : toast.variant === 'destructive'
                    ? 'bg-red-500'
                    : toast.variant === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'), role: "alert", children: _jsxs("div", { className: "flex items-center justify-between", children: [_jsxs("div", { children: [toast.title && _jsx("p", { className: "font-semibold", children: toast.title }), toast.description && _jsx("p", { className: "text-sm opacity-90", children: toast.description })] }), _jsx("button", { onClick: function () { return removeToast(toast.id); }, className: "ml-4 focus:outline-none", "aria-label": "Close", children: _jsx("span", { className: "text-xl", children: "\u00D7" }) })] }) }, toast.id)); }) }));
};
// Global toast instance for direct usage
var globalAddToast;
export var setGlobalToast = function (addToast) {
    globalAddToast = addToast;
};
// Toast methods for direct usage
export var toast = {
    success: function (message, duration) {
        if (globalAddToast) {
            globalAddToast(message, 'success', duration);
        }
        else {
            console.warn('Toast not initialized. Make sure ToastProvider is setup.');
        }
    },
    error: function (message, duration) {
        if (globalAddToast) {
            globalAddToast(message, 'error', duration);
        }
        else {
            console.warn('Toast not initialized. Make sure ToastProvider is setup.');
        }
    },
    warning: function (message, duration) {
        if (globalAddToast) {
            globalAddToast(message, 'warning', duration);
        }
        else {
            console.warn('Toast not initialized. Make sure ToastProvider is setup.');
        }
    },
    info: function (message, duration) {
        if (globalAddToast) {
            globalAddToast(message, 'info', duration);
        }
        else {
            console.warn('Toast not initialized. Make sure ToastProvider is setup.');
        }
    },
};
