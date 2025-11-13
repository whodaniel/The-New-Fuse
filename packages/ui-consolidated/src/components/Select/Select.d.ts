import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Select trigger variants using class-variance-authority
 */
export declare const selectTriggerVariants: (props?: ({
    variant?: "default" | "outline" | "ghost" | "filled" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
    state?: "error" | "default" | "success" | null | undefined;
    width?: "default" | "auto" | "md" | "sm" | "lg" | "xl" | "xs" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Select content variants using class-variance-authority
 */
export declare const selectContentVariants: (props?: ({
    position?: "popper" | "item-aligned" | null | undefined;
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Select component props
 */
export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size' | 'onChange'>, VariantProps<typeof selectTriggerVariants> {
    /**
     * Error message to display
     */
    error?: string;
    /**
     * Success message to display
     */
    success?: string;
    /**
     * Label for the select
     */
    label?: string;
    /**
     * Helper text to display below the select
     */
    helperText?: string;
    /**
     * Options for the select
     */
    options?: Array<{
        value: string;
        label: string;
    }>;
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
     * Callback when the value changes (for compatibility)
     */
    onValueChange?: (value: string) => void;
    /**
     * Standard onChange callback
     */
    onChange?: (event: React.ChangeEvent<HTMLSelectElement>) => void;
}
/**
 * Select component for dropdown selection
 *
 * @example
 * // Basic usage
 * <Select
 *   options={[
 *     { value: 'option1', label: 'Option 1' },
 *     { value: 'option2', label: 'Option 2' },
 *   ]}
 * />
 *
 * // With label and helper text
 * <Select
 *   label="Country"
 *   helperText="Select your country of residence"
 *   options={[
 *     { value: 'us', label: 'United States' },
 *     { value: 'ca', label: 'Canada' },
 *   ]}
 * />
 *
 * // With error state
 * <Select
 *   label="Language"
 *   error="Please select a language"
 *   options={[
 *     { value: 'en', label: 'English' },
 *     { value: 'fr', label: 'French' },
 *   ]}
 * />
 */
declare const Select: React.ForwardRefExoticComponent<SelectProps & React.RefAttributes<HTMLSelectElement>>;
export declare const SelectContent: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLDivElement> & React.RefAttributes<HTMLDivElement>>;
export declare const SelectItem: React.ForwardRefExoticComponent<React.OptionHTMLAttributes<HTMLOptionElement> & React.RefAttributes<HTMLOptionElement>>;
export declare const SelectTrigger: React.ForwardRefExoticComponent<React.ButtonHTMLAttributes<HTMLButtonElement> & React.RefAttributes<HTMLButtonElement>>;
export declare const SelectValue: React.ForwardRefExoticComponent<React.HTMLAttributes<HTMLSpanElement> & {
    placeholder?: string;
} & React.RefAttributes<HTMLSpanElement>>;
export { Select };
//# sourceMappingURL=Select.d.ts.map