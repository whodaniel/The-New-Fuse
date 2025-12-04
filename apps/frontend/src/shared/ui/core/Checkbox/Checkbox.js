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
import * as React from 'react';
import { Check, Minus } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';
var checkboxVariants = cva('peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground', {
    variants: {
        variant: {
            default: '',
            ghost: 'border-transparent bg-transparent hover:bg-accent hover:text-accent-foreground',
            outline: 'border-2',
            filled: 'border-transparent bg-muted',
        },
        size: {
            default: 'h-4 w-4',
            sm: 'h-3 w-3',
            lg: 'h-5 w-5',
        },
        state: {
            default: '',
            error: 'border-destructive focus-visible:ring-destructive',
            success: 'border-success focus-visible:ring-success',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        state: 'default',
    },
});
var Checkbox = React.forwardRef(function (props, ref) {
    var className = props.className, variant = props.variant, size = props.size, state = props.state, error = props.error, success = props.success, label = props.label, description = props.description, indeterminate = props.indeterminate, containerClassName = props.containerClassName, labelClassName = props.labelClassName, descriptionClassName = props.descriptionClassName, restProps = __rest(props, ["className", "variant", "size", "state", "error", "success", "label", "description", "indeterminate", "containerClassName", "labelClassName", "descriptionClassName"]);
    var checkboxState = error ? 'error' : success ? 'success' : state;
    return (_jsxs("div", { className: cn('flex items-start space-x-2', containerClassName), children: [_jsx(CheckboxPrimitive.Root, __assign({ ref: ref, className: cn(checkboxVariants({ variant: variant, size: size, state: checkboxState }), className) }, restProps, { children: _jsx(CheckboxPrimitive.Indicator, { className: cn('flex items-center justify-center text-current'), children: indeterminate ? (_jsx(Minus, { className: "h-3 w-3" })) : (_jsx(Check, { className: "h-3 w-3" })) }) })), (label || description) && (_jsxs("div", { className: "grid gap-1.5 leading-none", children: [label && (_jsx("label", { htmlFor: props.id, className: cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', labelClassName), children: label })), description && (_jsx("p", { className: cn('text-sm text-muted-foreground', descriptionClassName), children: description })), error && (_jsx("p", { className: "text-sm text-destructive", children: error })), success && (_jsx("p", { className: "text-sm text-success", children: success }))] }))] }));
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox };
