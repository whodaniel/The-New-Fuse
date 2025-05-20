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
import * as React from 'react';
import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check, Minus } from 'lucide-react';
import { cva } from 'class-variance-authority';
import { cn } from '@/utils/cn';
const checkboxVariants = cva('peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground data-[state=indeterminate]:bg-primary data-[state=indeterminate]:text-primary-foreground', {
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
const Checkbox = React.forwardRef((_a, ref) => {
    var { className, variant, size, state, error, success, label, description, indeterminate, containerClassName, labelClassName, descriptionClassName } = _a, props = __rest(_a, ["className", "variant", "size", "state", "error", "success", "label", "description", "indeterminate", "containerClassName", "labelClassName", "descriptionClassName"]);
    const checkboxState = error ? 'error' : success ? 'success' : state;
    return (<div className={cn('flex items-start space-x-2', containerClassName)}>
        <CheckboxPrimitive.Root ref={ref} className={cn(checkboxVariants({ variant, size, state: checkboxState }), className)} {...props}>
          <CheckboxPrimitive.Indicator className={cn('flex items-center justify-center text-current')}>
            {indeterminate ? (<Minus className="h-3 w-3"/>) : (<Check className="h-3 w-3"/>)}
          </CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
        {(label || description) && (<div className="grid gap-1.5 leading-none">
            {label && (<label htmlFor={props.id} className={cn('text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', labelClassName)}>
                {label}
              </label>)}
            {description && (<p className={cn('text-sm text-muted-foreground', descriptionClassName)}>
                {description}
              </p>)}
            {error && (<p className="text-sm text-destructive">{error}</p>)}
            {success && (<p className="text-sm text-success">{success}</p>)}
          </div>)}
      </div>);
});
Checkbox.displayName = CheckboxPrimitive.Root.displayName;
export { Checkbox };
//# sourceMappingURL=Checkbox.js.map