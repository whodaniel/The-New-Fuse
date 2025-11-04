"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
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

import utils_1 from '../../lib/utils';
const ToastProvider = Toast.Provider;
exports.ToastProvider = ToastProvider;
const ToastViewport = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Toast.Viewport ref={ref} className={cn("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:bottom-0 sm:right-0 sm:top-auto sm:flex-col md:max-w-[420px]", className)} {...restProps}/>);
});
exports.ToastViewport = ToastViewport;
ToastViewport.displayName = Toast.Viewport.displayName;
const Toast = React.forwardRef((props, ref) => {
    var { className, variant } = props, restProps = __rest(props, ["className", "variant"]);
    return (<Toast.Root ref={ref} className={cn(toastVariants({ variant }), className)} {...restProps}/>);
});
exports.Toast = Toast;
Toast.displayName = Toast.Root.displayName;
const ToastAction = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Toast.Action ref={ref} className={cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 text-sm font-medium ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground group-[.destructive]:focus:ring-destructive", className)} {...restProps}/>);
});
exports.ToastAction = ToastAction;
ToastAction.displayName = Toast.Action.displayName;
const ToastClose = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Toast.Close ref={ref} className={cn("absolute right-2 top-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:hover:text-red-50 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600", className)} toast-close="" {...restProps}>
      <X className="h-4 w-4"/>
    </Toast.Close>);
});
exports.ToastClose = ToastClose;
ToastClose.displayName = Toast.Close.displayName;
const ToastTitle = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Toast.Title ref={ref} className={cn("text-sm font-semibold", className)} {...restProps}/>);
});
exports.ToastTitle = ToastTitle;
ToastTitle.displayName = Toast.Title.displayName;
const ToastDescription = React.forwardRef((props, ref) => {
    var { className } = props, restProps = __rest(props, ["className"]);
    return (<Toast.Description ref={ref} className={cn("text-sm opacity-90", className)} {...restProps}/>);
});
exports.ToastDescription = ToastDescription;
ToastDescription.displayName = Toast.Description.displayName;
export {};
