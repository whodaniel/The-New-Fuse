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
import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useState, useCallback } from 'react';
var ToastContext = createContext(undefined);
export function ToastProvider(_a) {
    var children = _a.children;
    var _b = useState([]), toasts = _b[0], setToasts = _b[1];
    var toast = useCallback(function (toast) {
        var id = Math.random().toString(36).substr(2, 9);
        setToasts(function (prev) { return __spreadArray(__spreadArray([], prev, true), [__assign(__assign({}, toast), { id: id })], false); });
        // Auto dismiss after 5 seconds
        setTimeout(function () {
            setToasts(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
        }, 5000);
    }, []);
    var dismiss = useCallback(function (id) {
        setToasts(function (prev) { return prev.filter(function (t) { return t.id !== id; }); });
    }, []);
    return (_jsx(ToastContext.Provider, { value: { toasts: toasts, toast: toast, dismiss: dismiss }, children: children }));
}
export function useToast() {
    var context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
}
export var toast = function (toast) {
    // This is a simplified version for direct usage
    // In a real implementation, this would add to a toast queue
    // For now, we'll just return the options to satisfy the interface
    return toast;
};
