"use strict";
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
import { jsx as _jsx } from "react/jsx-runtime";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s)
        if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
            t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToastAction = exports.ToastClose = exports.ToastDescription = exports.ToastTitle = exports.Toast = exports.ToastViewport = exports.ToastProvider = void 0;
import React from 'react';
var ToastProvider = Toast.Provider;
exports.ToastProvider = ToastProvider;
var ToastViewport = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Toast.Viewport, __assign({ ref: ref, className: cn("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className) }, restProps)));
});
exports.ToastViewport = ToastViewport;
ToastViewport.displayName = Toast.Viewport.displayName;
var Toast = React.forwardRef(function (props, ref) {
    var className = props.className, variant = props.variant, restProps = __rest(props, ["className", "variant"]);
    return (_jsx(Toast.Root, __assign({ ref: ref, className: cn(toastVariants({ variant: variant }), className) }, restProps)));
});
exports.Toast = Toast;
Toast.displayName = Toast.Root.displayName;
var ToastAction = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Toast.Action, __assign({ ref: ref, className: cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className) }, restProps)));
});
exports.ToastAction = ToastAction;
ToastAction.displayName = Toast.Action.displayName;
var ToastClose = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Toast.Close, __assign({ ref: ref, className: cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className), "toast-close": "" }, restProps, { children: _jsx(X, { className: "h-4 w-4" }) })));
});
exports.ToastClose = ToastClose;
ToastClose.displayName = Toast.Close.displayName;
var ToastTitle = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Toast.Title, __assign({ ref: ref, className: cn("text-sm font-semibold", className) }, restProps)));
});
exports.ToastTitle = ToastTitle;
ToastTitle.displayName = Toast.Title.displayName;
var ToastDescription = React.forwardRef(function (props, ref) {
    var className = props.className, restProps = __rest(props, ["className"]);
    return (_jsx(Toast.Description, __assign({ ref: ref, className: cn("text-sm opacity-90", className) }, restProps)));
});
exports.ToastDescription = ToastDescription;
ToastDescription.displayName = Toast.Description.displayName;
