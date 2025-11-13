import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Input variants using class-variance-authority
 */
export declare const inputVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "filled" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
    state?: "error" | "default" | "success" | null | undefined;
    width?: "default" | "auto" | "md" | "sm" | "lg" | "xl" | "xs" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Input component props
 */
export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "width">, VariantProps<typeof inputVariants> {
    /**
     * Error message to display
     */
    error?: string;
    /**
     * Success message to display
     */
    success?: string;
    /**
     * Label for the input
     */
    label?: string;
    /**
     * Helper text to display below the input
     */
    helperText?: string;
    /**
     * Icon to display at the start of the input
     */
    startIcon?: React.ReactNode;
    /**
     * Icon to display at the end of the input
     */
    endIcon?: React.ReactNode;
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
}
/**
 * Input component for text entry
 *
 * @example
 * // Basic usage
 * <Input placeholder="Enter text" />
 *
 * // With label and helper text
 * <Input
 *   label="Email"
 *   placeholder="Enter your email"
 *   helperText="We'll never share your email"
 * />
 *
 * // With error state
 * <Input
 *   label="Password"
 *   type="password"
 *   error="Password must be at least 8 characters"
 * />
 *
 * // With icons
 * <Input
 *   startIcon={<MailIcon />}
 *   endIcon={<EyeIcon />}
 *   placeholder="Enter email"
 * />
 */
declare const Input: React.ForwardRefExoticComponent<InputProps & React.RefAttributes<HTMLInputElement>>;
export { Input };
//# sourceMappingURL=Input.d.ts.map