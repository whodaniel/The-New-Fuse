import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Textarea variants using class-variance-authority
 */
export declare const textareaVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "filled" | null | undefined;
    state?: "error" | "default" | "success" | null | undefined;
    width?: "default" | "auto" | "md" | "sm" | "lg" | "xl" | "xs" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Textarea component props
 */
export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement>, VariantProps<typeof textareaVariants> {
    /**
     * Error message to display
     */
    error?: string;
    /**
     * Success message to display
     */
    success?: string;
    /**
     * Label for the textarea
     */
    label?: string;
    /**
     * Helper text to display below the textarea
     */
    helperText?: string;
    /**
     * Class name for the container
     */
    containerClassName?: string;
    /**
     * Class name for the label
     */
    labelClassName?: string;
    /**
     * Class name for the helper text
     */
    helperTextClassName?: string;
    /**
     * Whether to auto-resize the textarea based on content
     */
    autoResize?: boolean;
    /**
     * Maximum height for auto-resize
     */
    maxHeight?: number;
}
//# sourceMappingURL=Textarea.d.ts.map