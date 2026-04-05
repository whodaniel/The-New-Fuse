import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React from "react";
import { cn } from '../../utils/cn';
const Alert = React.forwardRef(({ className, variant = "default", icon, children, ...props }, ref) => {
    const variantClasses = {
        default: "bg-background text-foreground",
        destructive: "border-destructive/50 text-destructive dark:border-destructive [&>svg]:text-destructive",
        warning: "border-yellow-500/50 text-yellow-600 dark:border-yellow-500 dark:text-yellow-500 [&>svg]:text-yellow-600",
        success: "border-green-500/50 text-green-600 dark:border-green-500 dark:text-green-500 [&>svg]:text-green-600",
        info: "border-blue-500/50 text-blue-600 dark:border-blue-500 dark:text-blue-500 [&>svg]:text-blue-600",
    };
    return (_jsxs("div", { ref: ref, role: "alert", className: cn("relative w-full rounded-lg border p-4", variantClasses[variant], className), ...props, children: [icon && _jsx("span", { className: "mr-2 inline-block", children: icon }), children] }));
});
Alert.displayName = "Alert";
const AlertTitle = React.forwardRef(({ className, children, ...props }, ref) => (_jsx("h5", { ref: ref, className: cn("mb-1 font-medium leading-none tracking-tight", className), ...props, children: children })));
AlertTitle.displayName = "AlertTitle";
const AlertDescription = React.forwardRef(({ className, ...props }, ref) => (_jsx("div", { ref: ref, className: cn("text-sm [&_p]:leading-relaxed", className), ...props })));
AlertDescription.displayName = "AlertDescription";
export { Alert, AlertTitle, AlertDescription };
