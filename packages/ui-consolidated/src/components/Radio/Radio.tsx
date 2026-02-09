import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Radio variants using class-variance-authority
 */
export const radioVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-full border border-primary text-primary ring-offset-background focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      size: {
        default: 'h-4 w-4',
        sm: 'h-3 w-3',
        lg: 'h-5 w-5',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  }
);

/**
 * Radio component props
 */
export interface RadioProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof radioVariants> {
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
const Radio = React.forwardRef<HTMLInputElement, RadioProps>(
  ({
    className,
    size,
    label,
    helperText,
    error,
    containerClassName,
    labelClassName,
    helperTextClassName,
    ...props
  }, ref) => {
    const id = React.useId();
    
    return (
      <div className={cn('flex flex-col space-y-2', containerClassName)}>
        <div className="flex items-center space-x-2">
          <input
            type="radio"
            id={id}
            ref={ref}
            className={cn(radioVariants({ size }), className)}
            aria-checked={props.checked}
            aria-invalid={!!error}
            tabIndex={0}
            {...props}
          />
          {label && (
            <label
              htmlFor={id}
              className={cn(
                'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
                error && 'text-destructive',
                labelClassName
              )}
            >
              {label}
            </label>
          )}
        </div>
        {(error || helperText) && (
          <p
            className={cn(
              'text-sm',
              error ? 'text-destructive' : 'text-muted-foreground',
              helperTextClassName
            )}
          >
            {error || helperText}
          </p>
        )}
      </div>
    );
  }
);

Radio.displayName = 'Radio';

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
export const RadioGroup: React.FC<RadioGroupProps> = ({
  name,
  defaultValue,
  value,
  onChange,
  label,
  helperText,
  error,
  options,
  direction = 'vertical',
  size = 'default',
  className,
  ...props
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  };

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {label && (
        <div className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
          {label}
        </div>
      )}
      <div
        className={cn(
          'space-y-2',
          direction === 'horizontal' && 'flex flex-row space-x-4 space-y-0'
        )}
      >
        {options.map((option) => (
          <Radio
            key={option.value}
            name={name}
            value={option.value}
            checked={value === option.value}
            defaultChecked={defaultValue === option.value}
            onChange={handleChange}
            label={option.label}
            helperText={option.helperText}
            disabled={option.disabled}
            size={size}
          />
        ))}
      </div>
      {(error || helperText) && (
        <p
          className={cn(
            'text-sm',
            error ? 'text-destructive' : 'text-muted-foreground'
          )}
        >
          {error || helperText}
        </p>
      )}
    </div>
  );
};

RadioGroup.displayName = 'RadioGroup';

export { Radio };
