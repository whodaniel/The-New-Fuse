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
import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const inputVariants = cva('flex rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50', {
    variants: {
        variant: {
            default: 'border-input',
            ghost: 'border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0',
            outline: 'border-2',
            filled: 'border-transparent bg-muted',
            transparent: 'bg-transparent',
        },
        size: {
            default: 'h-10 px-4 py-2',
            sm: 'h-8 px-3 text-xs',
            lg: 'h-12 px-6 text-lg',
        },
        state: {
            default: '',
            error: 'border-destructive focus-visible:ring-destructive',
            success: 'border-success focus-visible:ring-success',
        },
        width: {
            default: 'w-full',
            auto: 'w-auto',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
        state: 'default',
        width: 'default',
    },
});
const Input = React.forwardRef((_a, ref) => {
    var { className, variant, size, state, width, startIcon, endIcon, label, helperText, error, success, containerClassName, labelClassName, helperTextClassName, type = 'text' } = _a, props = __rest(_a, ["className", "variant", "size", "state", "width", "startIcon", "endIcon", "label", "helperText", "error", "success", "containerClassName", "labelClassName", "helperTextClassName", "type"]);
    const inputState = error ? 'error' : success ? 'success' : state;
    return (<div className={cn('space-y-2', containerClassName)}>
        {label && (<label className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', error && 'text-destructive', success && 'text-success', labelClassName)}>
            {label}
          </label>)}
        <div className="relative">
          {startIcon && (<div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>)}
          <input type={type} className={cn(inputVariants({ variant, size, state: inputState, width }), startIcon && 'pl-10', endIcon && 'pr-10', className)} ref={ref} {...props}/>
          {endIcon && (<div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endIcon}
            </div>)}
        </div>
        {(error || success || helperText) && (<p className={cn('text-sm', error && 'text-destructive', success && 'text-success', !error && !success && 'text-muted-foreground', helperTextClassName)}>
            {error || success || helperText}
          </p>)}
      </div>);
});
Input.displayName = 'Input';
export { Input, inputVariants };
//# sourceMappingURL=Input.js.map