import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { forwardRef } from 'react';
import { cn } from '../../utils';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, } from '../Card/Card';
export const GlassCard = forwardRef(({ className, gradient, children, ...props }, ref) => {
    return (_jsxs(Card, { ref: ref, className: cn('group relative overflow-hidden border-0 bg-white/50 backdrop-blur-sm transition-all duration-300', 'hover:bg-white/80 hover:shadow-2xl hover:-translate-y-2', className), ...props, children: [gradient && (_jsx("div", { className: cn('absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300', gradient) })), children] }));
});
GlassCard.displayName = 'GlassCard';
export { CardContent as GlassCardContent, CardDescription as GlassCardDescription, CardFooter as GlassCardFooter, CardHeader as GlassCardHeader, CardTitle as GlassCardTitle, };
