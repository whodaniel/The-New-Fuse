import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Checkbox variants using class-variance-authority
 */
export declare const checkboxVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Checkbox component props
 */
export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof checkboxVariants> {
    /**
     * Label for the checkbox
     */
    label?: string;
    /**
     * Helper text to display below the checkbox
     */
    helperText?: string;
    /**
     * Error message to display
     */
    error?: string;
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
 * Checkbox component for boolean input
 *
 * @example
 * // Basic usage
 * <Checkbox />
 *
 * // With label
 * <Checkbox label="Accept terms and conditions" />
 *
 * // With helper text
 * <Checkbox
 *   label="Subscribe to newsletter"
 *   helperText="We'll send you weekly updates"
 * />
 *
 * // With error
 * <Checkbox
 *   label="Accept terms"
 *   error="You must accept the terms to continue"
 * />
 *
 * // With different size
 * <Checkbox size="lg" label="Large checkbox" />
 */
declare const Checkbox: React.ForwardRefExoticComponent<CheckboxProps & React.RefAttributes<HTMLInputElement>>;
export { Checkbox };
//# sourceMappingURL=Checkbox.d.ts.map