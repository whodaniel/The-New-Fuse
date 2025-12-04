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
import { jsx as _jsx } from "react/jsx-runtime";
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
import { forwardRef } from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';
export var appCardVariants = cva('rounded-xl transition-all duration-200', {
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
var AppCard = forwardRef(function (props, ref) {
    var className = props.className, variant = props.variant, size = props.size, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "variant", "size", "asChild"]);
    var Comp = asChild ? Slot : 'div';
    return (_jsx(Comp, __assign({ ref: ref, className: cn(appCardVariants({ variant: variant, size: size }), className) }, restProps)));
});
AppCard.displayName = 'AppCard';
var AppCardHeader = forwardRef(function (props, ref) {
    var className = props.className, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "asChild"]);
    var Comp = asChild ? Slot : 'div';
    return (_jsx(Comp, __assign({ ref: ref, className: cn('space-y-1.5 mb-4', className) }, restProps)));
});
AppCardHeader.displayName = 'AppCardHeader';
var AppCardTitle = forwardRef(function (props, ref) {
    var className = props.className, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "asChild"]);
    var Comp = asChild ? Slot : 'h3';
    return (_jsx(Comp, __assign({ ref: ref, className: cn('text-2xl font-semibold tracking-tight', className) }, restProps)));
});
AppCardTitle.displayName = 'AppCardTitle';
var AppCardDescription = forwardRef(function (props, ref) {
    var className = props.className, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "asChild"]);
    var Comp = asChild ? Slot : 'p';
    return (_jsx(Comp, __assign({ ref: ref, className: cn('text-sm text-muted-foreground', className) }, restProps)));
});
AppCardDescription.displayName = 'AppCardDescription';
var AppCardContent = forwardRef(function (props, ref) {
    var className = props.className, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "asChild"]);
    var Comp = asChild ? Slot : 'div';
    return (_jsx(Comp, __assign({ ref: ref, className: cn('', className) }, restProps)));
});
AppCardContent.displayName = 'AppCardContent';
var AppCardFooter = forwardRef(function (props, ref) {
    var className = props.className, _a = props.asChild, asChild = _a === void 0 ? false : _a, restProps = __rest(props, ["className", "asChild"]);
    var Comp = asChild ? Slot : 'div';
    return (_jsx(Comp, __assign({ ref: ref, className: cn('flex items-center pt-4', className) }, restProps)));
});
AppCardFooter.displayName = 'AppCardFooter';
export { AppCard, AppCardHeader, AppCardTitle, AppCardDescription, AppCardContent, AppCardFooter, };
