import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Skeleton } from '../Skeleton';
export var userIconVariants = cva('relative flex-shrink-0 overflow-hidden rounded-full', {
    variants: {
        size: {
            xs: 'w-6 h-6',
            sm: 'w-8 h-8',
            default: 'w-[35px] h-[35px]',
            lg: 'w-12 h-12',
            xl: 'w-16 h-16',
        },
        variant: {
            default: 'border border-border',
            solid: 'border-2 border-primary',
            ghost: 'border border-transparent',
        },
    },
    defaultVariants: {
        size: 'default',
        variant: 'default',
    },
});
var statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
};
export var UserIcon = forwardRef(function (_a, ref) {
    var _b = _a.role, role = _b === void 0 ? 'user' : _b, src = _a.src, fallbackSrc = _a.fallbackSrc, alt = _a.alt, size = _a.size, variant = _a.variant, className = _a.className, status = _a.status, _c = _a.showStatus, showStatus = _c === void 0 ? false : _c, _d = _a.loading, loading = _d === void 0 ? false : _d, onClick = _a.onClick;
    var defaultFallback = role === 'user'
        ? '/assets/icons/user-default.svg'
        : '/assets/icons/workspace-default.svg';
    var handleError = function (e) {
        var img = e.currentTarget;
        if (img.src !== fallbackSrc && fallbackSrc) {
            img.src = fallbackSrc;
        }
        else if (img.src !== defaultFallback) {
            img.src = defaultFallback;
        }
    };
    if (loading) {
        return _jsx(Skeleton, { className: cn(userIconVariants({ size: size, variant: variant }), className) });
    }
    return (_jsxs("div", { ref: ref, className: cn(userIconVariants({ size: size, variant: variant }), onClick && 'cursor-pointer', className), onClick: onClick, children: [_jsx("img", { src: src || fallbackSrc || defaultFallback, alt: alt || "".concat(role, " profile picture"), onError: handleError, className: "absolute inset-0 w-full h-full object-cover rounded-full", loading: "lazy" }), showStatus && status && (_jsx("span", { className: cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[status]) }))] }));
});
UserIcon.displayName = 'UserIcon';
