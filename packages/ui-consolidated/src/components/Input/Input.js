import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { cva } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../utils';
/**
 * Input variants using class-variance-authority
 */
export const inputVariants = cva('flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', {
    variants: {
        variant: {
            default: '',
            outline: 'border-2',
            ghost: 'border-none shadow-none bg-transparent',
            filled: 'bg-muted border-transparent',
        },
        size: {
            default: 'h-9 px-3 py-1.5',
            sm: 'h-8 px-2 text-xs rounded-md',
            lg: 'h-10 px-4 text-base rounded-md',
        },
        state: {
            default: '',
            error: 'border-destructive focus-visible:ring-destructive',
            success: 'border-success focus-visible:ring-success',
        },
        width: {
            default: 'w-full',
            auto: 'w-auto',
            xs: 'w-20',
            sm: 'w-32',
            md: 'w-48',
            lg: 'w-64',
            xl: 'w-96',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        state: 'default',
        width: 'default',
    },
});
/**
 * Input component for text entry
 *
 * @example
 * // Basic usage
 * <Input placeholder="Enter text" />
 *
 * // With label and helper text
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 *
 * // With error state
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * // With icons
 * <Input
 *   startIcon={<MailIcon />}
 *   endIcon={<EyeIcon />}
 *   placeholder="Enter email"
 * />
 */
const Input = React.forwardRef(({ className, variant, size, state, width = 'default', startIcon, endIcon, label, helperText, error, success, containerClassName, labelClassName, helperTextClassName, type = 'text', ...props }, ref) => {
    const inputState = error ? 'error' : success ? 'success' : state;
    return (_jsxs("div", { className: cn('space-y-2', containerClassName), children: [label && (_jsx("label", { className: cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', error && 'text-destructive', success && 'text-success', labelClassName), htmlFor: props.id, "aria-label": label, children: label })), _jsxs("div", { className: "relative", children: [startIcon && (_jsx("div", { className: "absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground", children: startIcon })), _jsx("input", { type: type, className: cn(inputVariants({ variant, size, state: inputState, width }), startIcon && 'pl-10', endIcon && 'pr-10', className), ref: ref, ...props }), endIcon && (_jsx("div", { className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground", children: endIcon }))] }), (error || success || helperText) && (_jsx("p", { className: cn('text-sm', error && 'text-destructive', success && 'text-success', !error && !success && 'text-muted-foreground', helperTextClassName), children: error || success || helperText }))] }));
});
Input.displayName = 'Input';
export { Input };
