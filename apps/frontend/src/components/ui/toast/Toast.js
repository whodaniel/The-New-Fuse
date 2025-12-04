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
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
export var Toast = function (_a) {
    var id = _a.id, title = _a.title, description = _a.description, _b = _a.type, type = _b === void 0 ? 'default' : _b, _c = _a.duration, duration = _c === void 0 ? 3000 : _c, onClose = _a.onClose;
    var _d = useState(true), visible = _d[0], setVisible = _d[1];
    useEffect(function () {
        var timer = setTimeout(function () {
            setVisible(false);
            onClose === null || onClose === void 0 ? void 0 : onClose();
        }, duration);
        return function () { return clearTimeout(timer); };
    }, [duration, onClose]);
    if (!visible)
        return null;
    return (_jsxs("div", { className: "toast toast-".concat(type, " p-4 rounded shadow-md flex items-center justify-between"), role: "alert", "aria-live": "assertive", "aria-atomic": "true", children: [_jsxs("div", { children: [title && _jsx("h4", { className: "font-semibold", children: title }), description && _jsx("div", { className: "text-sm", children: description })] }), _jsx("button", { type: "button", onClick: function () {
                    setVisible(false);
                    onClose === null || onClose === void 0 ? void 0 : onClose();
                }, className: "ml-4 text-gray-500 hover:text-gray-700", "aria-label": "Close", children: "\u00D7" })] }));
};
export var Toaster = function (_a) {
    var _b = _a.position, position = _b === void 0 ? 'bottom-right' : _b, _c = _a.toastOptions, toastOptions = _c === void 0 ? {} : _c;
    // In a real implementation, this would manage a list of toasts
    var _d = useState([]), toasts = _d[0], setToasts = _d[1];
    var removeToast = function (id) {
        setToasts(toasts.filter(function (toast) { return toast.id !== id; }));
    };
    var positionClasses = {
        'top-left': 'top-0 left-0',
        'top-right': 'top-0 right-0',
        'bottom-left': 'bottom-0 left-0',
        'bottom-right': 'bottom-0 right-0',
        'top-center': 'top-0 left-1/2 transform -translate-x-1/2',
        'bottom-center': 'bottom-0 left-1/2 transform -translate-x-1/2',
    }[position];
    return (_jsx("div", { className: "fixed z-50 p-4 flex flex-col gap-2 ".concat(positionClasses), role: "region", "aria-label": "Notifications", children: toasts.map(function (toast) { return (_jsx(Toast, __assign({}, toast, { onClose: function () { return removeToast(toast.id || ''); }, duration: toast.duration || toastOptions.duration }), toast.id)); }) }));
};
