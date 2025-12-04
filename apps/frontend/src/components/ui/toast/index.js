var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
import { createContext, useState, useCallback } from 'react';
import { Toast, Toaster } from './Toast';
// Create toast context
export var ToastContext = createContext(null);
// Toast provider component
export function ToastProvider(_a) {
    var children = _a.children;
    var _b = useState([]), toasts = _b[0], setToasts = _b[1];
    // Add toast
    var toast = useCallback(function (props) {
        var id = props.id || Math.random().toString(36).substring(2, 9);
        setToasts(function (prevToasts) { return __spreadArray(__spreadArray([], prevToasts, true), [__assign(__assign({}, props), { id: id })], false); });
        // Auto dismiss
        if (props.duration !== 0) {
            setTimeout(function () {
                dismiss(id);
            }, props.duration || 3000);
        }
        return id;
    }, []);
    // Dismiss toast
    var dismiss = useCallback(function (id) {
        setToasts(function (prevToasts) { return prevToasts.filter(function (toast) { return toast.id !== id; }); });
    }, []);
    return (_jsxs(ToastContext.Provider, { value: { toast: toast, dismiss: dismiss }, children: [children, _jsx(Toaster, { position: "top-right", toastOptions: {
                    duration: 3000,
                    style: {
                        background: 'var(--background)',
                        color: 'var(--foreground)',
                        border: '1px solid var(--border)',
                    },
                    success: {
                        style: {
                            background: 'var(--success)',
                            color: 'var(--success-foreground)',
                        },
                    },
                    error: {
                        style: {
                            background: 'var(--destructive)',
                            color: 'var(--destructive-foreground)',
                        },
                    },
                }, children: toasts.map(function (toast) { return (_jsx(Toast, { id: toast.id, title: toast.title, description: toast.description, type: toast.variant === 'destructive' ? 'error' :
                        toast.variant === 'success' ? 'success' : 'default', onClose: function () { return dismiss(toast.id || ''); } }, toast.id)); }) })] }));
}
export { Toast, Toaster };
