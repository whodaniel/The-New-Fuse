import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils.js';

/**
 * Checkbox variants using class-variance-authority
 */
export const checkboxVariants = cva(
  'peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground',
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
 * Checkbox component props
 */
export interface CheckboxProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof checkboxVariants> {
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
const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
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
            type="checkbox"
            id={id}
            ref={ref}
            className={cn(checkboxVariants({ size }), className)}
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

Checkbox.displayName = 'Checkbox';

export { Checkbox };
