import React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
const typingIndicatorVariants = cva('flex items-center space-x-2', {
    variants: {
        variant: {
            default: 'text-neutral-500',
            primary: 'text-primary-500',
            secondary: 'text-secondary-500',
        },
        size: {
            sm: 'space-x-1.5',
            default: 'space-x-2',
            lg: 'space-x-2.5',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
const dotVariants = cva('rounded-full animate-bounce', {
    variants: {
        variant: {
            default: 'bg-neutral-400',
            primary: 'bg-primary-400',
            secondary: 'bg-secondary-400',
        },
        size: {
            sm: 'w-1.5 h-1.5',
            default: 'w-2 h-2',
            lg: 'w-2.5 h-2.5',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
export function TypingIndicator({ variant, size, className }) {
    return (<div className={cn(typingIndicatorVariants({ variant, size }), className)}>
      <div className={cn(dotVariants({ variant, size }))}/>
      <div className={cn(dotVariants({ variant, size }), 'animation-delay-100')}/>
      <div className={cn(dotVariants({ variant, size }), 'animation-delay-200')}/>
    </div>);
}
//# sourceMappingURL=TypingIndicator.js.map