import React, { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { Skeleton } from '../Skeleton.js';
export const userIconVariants = cva('relative flex-shrink-0 overflow-hidden rounded-full', {
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
const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-400',
    away: 'bg-yellow-500',
    busy: 'bg-red-500',
};
export const UserIcon = forwardRef(({ role = 'user', src, fallbackSrc, alt, size, variant, className, status, showStatus = false, loading = false, onClick, }, ref) => {
    const defaultFallback = role === 'user'
        ? '/assets/icons/user-default.svg'
        : '/assets/icons/workspace-default.svg';
    const handleError = (e) => {
        const img = e.currentTarget;
        if (img.src !== fallbackSrc && fallbackSrc) {
            img.src = fallbackSrc;
        }
        else if (img.src !== defaultFallback) {
            img.src = defaultFallback;
        }
    };
    if (loading) {
        return <Skeleton className={cn(userIconVariants({ size, variant }), className)}/>;
    }
    return (<div ref={ref} className={cn(userIconVariants({ size, variant }), onClick && 'cursor-pointer', className)} onClick={onClick}>
      <img src={src || fallbackSrc || defaultFallback} alt={alt || `${role} profile picture`} onError={handleError} className="absolute inset-0 w-full h-full object-cover rounded-full" loading="lazy"/>
      {showStatus && status && (<span className={cn('absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-background', statusColors[status])}/>)}
    </div>);
});
UserIcon.displayName = 'UserIcon';
//# sourceMappingURL=UserIcon.js.map