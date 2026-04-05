import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as ProgressPrimitive from '@radix-ui/react-progress';
import * as React from 'react';
import { cn } from '../../lib/utils';
const Progress = React.forwardRef(({ className, value = 0, max = 100, showValue = false, ...props }, ref) => {
    const percentage = Math.min(Math.max(0, (value / max) * 100), 100);
    return (_jsxs("div", { className: "relative", children: [_jsx(ProgressPrimitive.Root, { ref: ref, className: cn('relative h-4 w-full overflow-hidden rounded-full bg-secondary', className), ...props, children: _jsx(ProgressPrimitive.Indicator, { className: "h-full w-full flex-1 bg-primary transition-all", style: { transform: `translateX(-${100 - percentage}%)` } }) }), showValue && (_jsxs("div", { className: "absolute inset-0 flex items-center justify-center text-xs font-medium text-white", children: [Math.round(percentage), "%"] }))] }));
});
Progress.displayName = ProgressPrimitive.Root.displayName;
export { Progress };
