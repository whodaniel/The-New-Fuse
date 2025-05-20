var __rest = (this && this.__rest) || function (s, e): any {
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
import React, { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
export const appCardVariants = cva('rounded-xl transition-all duration-200', {
    variants: {
        variant: {
            default: 'bg-card border shadow-sm hover:shadow-md',
            gradient: 'bg-gradient-to-br from-card to-muted border shadow-md hover:shadow-lg',
            hover: 'bg-card border hover:border-primary shadow-sm hover:shadow-md hover:scale-[1.02]',
            glass: 'bg-card/80 backdrop-blur-sm border shadow-sm hover:shadow-md',
        },
        size: {
            sm: 'p-4',
            default: 'p-6',
            lg: 'p-8',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'default',
    },
});
const AppCard = forwardRef((_a, ref) => {
    var { className, variant, size, asChild = false } = _a, props = __rest(_a, ["className", "variant", "size", "asChild"]);
    const Comp = asChild ? Slot : 'div';
    return (<Comp ref={ref} className={cn(appCardVariants({ variant, size }), className)} {...props}/>);
});
AppCard.displayName = 'AppCard';
const AppCardHeader = forwardRef((_a, ref) => {
    var { className, asChild = false } = _a, props = __rest(_a, ["className", "asChild"]);
    const Comp = asChild ? Slot : 'div';
    return (<Comp ref={ref} className={cn('space-y-1.5 mb-4', className)} {...props}/>);
});
AppCardHeader.displayName = 'AppCardHeader';
const AppCardTitle = forwardRef((_a, ref) => {
    var { className, asChild = false } = _a, props = __rest(_a, ["className", "asChild"]);
    const Comp = asChild ? Slot : 'h3';
    return (<Comp ref={ref} className={cn('text-2xl font-semibold tracking-tight', className)} {...props}/>);
});
AppCardTitle.displayName = 'AppCardTitle';
const AppCardDescription = forwardRef((_a, ref) => {
    var { className, asChild = false } = _a, props = __rest(_a, ["className", "asChild"]);
    const Comp = asChild ? Slot : 'p';
    return (<Comp ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props}/>);
});
AppCardDescription.displayName = 'AppCardDescription';
const AppCardContent = forwardRef((_a, ref) => {
    var { className, asChild = false } = _a, props = __rest(_a, ["className", "asChild"]);
    const Comp = asChild ? Slot : 'div';
    return (<Comp ref={ref} className={cn('', className)} {...props}/>);
});
AppCardContent.displayName = 'AppCardContent';
const AppCardFooter = forwardRef((_a, ref) => {
    var { className, asChild = false } = _a, props = __rest(_a, ["className", "asChild"]);
    const Comp = asChild ? Slot : 'div';
    return (<Comp ref={ref} className={cn('flex items-center pt-4', className)} {...props}/>);
});
AppCardFooter.displayName = 'AppCardFooter';
export { AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent, AppCardFooter, };
//# sourceMappingURL=AppCard.js.map