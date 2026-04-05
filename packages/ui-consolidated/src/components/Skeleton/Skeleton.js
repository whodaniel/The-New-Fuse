import { jsx as _jsx } from "react/jsx-runtime";
import { forwardRef } from 'react';
export const Skeleton = forwardRef(({ className = '', ...props }, ref) => {
    return (_jsx("div", { className: `animate-pulse rounded-md bg-gray-200 ${className}`, ref: ref, ...props }));
});
Skeleton.displayName = 'Skeleton';
