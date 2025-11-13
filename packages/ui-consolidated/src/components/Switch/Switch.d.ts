import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Switch variants using class-variance-authority
 */
export declare const switchVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Switch thumb variants using class-variance-authority
 */
export declare const switchThumbVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Switch component props
 */
export interface SwitchProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size' | 'onChange'>, VariantProps<typeof switchVariants> {
    /**
     * Label for the switch
     */
    label?: string;
    /**
     * Helper text to display below the switch
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
    /**
     * Position of the label
     */
    labelPosition?: 'left' | 'right';
    /**
     * Callback when the checked state changes (for compatibility)
     */
    onCheckedChange?: (checked: boolean) => void;
    /**
     * Standard onChange callback
     */
    onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}
/**
 * Switch component for toggling between two states
 *
 * @example
 * // Basic usage
 * <Switch />
 *
 * // With label
 * <Switch label="Enable notifications" />
 *
 * // With helper text
 * <Switch
 *   label="Dark mode"
 *   helperText="Switch between light and dark theme"
 * />
 *
 * // With error
 * <Switch
 *   label="Required toggle"
 *   error="This setting must be enabled"
 * />
 *
 * // With different size
 * <Switch size="lg" label="Large switch" />
 *
 * // With label on the left
 * <Switch labelPosition="left" label="Label on left" />
 */
declare const Switch: React.ForwardRefExoticComponent<SwitchProps & React.RefAttributes<HTMLInputElement>>;
export { Switch };
//# sourceMappingURL=Switch.d.ts.map