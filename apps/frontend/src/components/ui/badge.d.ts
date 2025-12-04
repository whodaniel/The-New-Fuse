import React from 'react';
interface BadgeProps {
    children: React.ReactNode;
    variant?: 'default' | 'secondary' | 'destructive' | 'outline';
    className?: string;
}
export declare function Badge({ children, variant, className }: BadgeProps): import("react/jsx-runtime").JSX.Element;
export default Badge;
