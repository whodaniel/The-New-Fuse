import React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const typingIndicatorVariants: (props?: ({
    variant?: "default" | "secondary" | "primary" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface TypingIndicatorProps extends VariantProps<typeof typingIndicatorVariants> {
    className?: string;
}
export declare function TypingIndicator({ variant, size, className }: TypingIndicatorProps): React.JSX.Element;
export {};
