import * as React from 'react';
import { type VariantProps } from 'class-variance-authority';
/**
 * Radio variants using class-variance-authority
 */
export declare const radioVariants: (props?: ({
    size?: "default" | "sm" | "lg" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
/**
 * Radio component props
 */
export interface RadioProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>, VariantProps<typeof radioVariants> {
    /**
     * Label for the radio
     */
    label?: string;
    /**
     * Helper text to display below the radio
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
 * Radio component for selecting a single option from a group
 *
 * @example
 * // Basic usage
 * <Radio name="option" value="option1" />
 * <Radio name="option" value="option2" />
 *
 * // With labels
 * <Radio name="fruit" value="apple" label="Apple" />
 * <Radio name="fruit" value="banana" label="Banana" />
 *
 * // With helper text
 * <Radio
 *   name="plan"
 *   value="basic"
 *   label="Basic Plan"
 *   helperText="Free tier with limited features"
 * />
 *
 * // With error
 * <Radio
 *   name="required"
 *   value="yes"
 *   label="Required option"
 *   error="This field is required"
 * />
 *
 * // With different size
 * <Radio size="lg" name="size" value="large" label="Large radio" />
 */
declare const Radio: React.ForwardRefExoticComponent<RadioProps & React.RefAttributes<HTMLInputElement>>;
/**
 * RadioGroup component props
 */
export interface RadioGroupProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
    /**
     * Name attribute for all radio inputs in the group
     */
    name: string;
    /**
     * Default value for the radio group
     */
    defaultValue?: string;
    /**
     * Current value of the radio group
     */
    value?: string;
    /**
     * Callback when the value changes
     */
    onChange?: (value: string) => void;
    /**
     * Label for the radio group
     */
    label?: string;
    /**
     * Helper text to display below the radio group
     */
    helperText?: string;
    /**
     * Error message to display
     */
    error?: string;
    /**
     * Options for the radio group
     */
    options: Array<{
        value: string;
        label: string;
        disabled?: boolean;
        helperText?: string;
    }>;
    /**
     * Direction of the radio group
     */
    direction?: 'horizontal' | 'vertical';
    /**
     * Size of the radio inputs
     */
    size?: 'default' | 'sm' | 'lg';
}
/**
 * RadioGroup component for grouping radio inputs
 *
 * @example
 * // Basic usage
 * <RadioGroup
 *   name="fruit"
 *   label="Select a fruit"
 *   options={[
 *     { value: 'apple', label: 'Apple' },
 *     { value: 'banana', label: 'Banana' },
 *     { value: 'orange', label: 'Orange' },
 *   ]}
 * />
 *
 * // With default value
 * <RadioGroup
 *   name="color"
 *   defaultValue="blue"
 *   options={[
 *     { value: 'red', label: 'Red' },
 *     { value: 'blue', label: 'Blue' },
 *     { value: 'green', label: 'Green' },
 *   ]}
 * />
 *
 * // With controlled value
 * <RadioGroup
 *   name="size"
 *   value={selectedSize}
 *   onChange={setSelectedSize}
 *   options={[
 *     { value: 'sm', label: 'Small' },
 *     { value: 'md', label: 'Medium' },
 *     { value: 'lg', label: 'Large' },
 *   ]}
 * />
 *
 * // With horizontal layout
 * <RadioGroup
 *   name="alignment"
 *   direction="horizontal"
 *   options={[
 *     { value: 'left', label: 'Left' },
 *     { value: 'center', label: 'Center' },
 *     { value: 'right', label: 'Right' },
 *   ]}
 * />
 */
export declare const RadioGroup: React.FC<RadioGroupProps>;
export { Radio };
//# sourceMappingURL=Radio.d.ts.map