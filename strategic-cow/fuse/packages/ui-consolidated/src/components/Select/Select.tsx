import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Select trigger variants using class-variance-authority
 */
export const selectTriggerVariants = cva(
  'flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border-2',
        ghost: 'border-none shadow-none bg-transparent',
        filled: 'bg-muted border-transparent',
      },
      size: {
        default: 'h-10',
        sm: 'h-8 text-xs rounded-md',
        lg: 'h-12 text-base rounded-md',
      },
      state: {
        default: '',
        error: 'border-destructive focus:ring-destructive',
        success: 'border-success focus:ring-success',
      },
      width: {
        default: 'w-full',
        auto: 'w-auto',
        xs: 'w-20',
        sm: 'w-32',
        md: 'w-48',
        lg: 'w-64',
        xl: 'w-96',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      state: 'default',
      width: 'default',
    },
  }
);

/**
 * Select content variants using class-variance-authority
 */
export const selectContentVariants = cva(
  'relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md animate-in fade-in-80',
  {
    variants: {
      position: {
        popper: 'data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
        'item-aligned': '',
      },
      size: {
        default: '',
        sm: 'text-xs',
        lg: 'text-base',
      },
    },
    defaultVariants: {
      position: 'popper',
      size: 'default',
    },
  }
);

/**
 * Select component props
 */
export interface SelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'size'>,
    VariantProps<typeof selectTriggerVariants> {
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
  options?: Array<{ value: string; label: string }>;
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
const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({
    className,
    variant,
    size,
    state,
    width,
    label,
    helperText,
    error,
    success,
    options = [],
    containerClassName,
    labelClassName,
    helperTextClassName,
    ...props
  }, ref) => {
    const selectState = error ? 'error' : success ? 'success' : state;

    return (
      <div className={cn('space-y-2', containerClassName)}>
        {label && (
          <label
            className={cn(
              'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
              error && 'text-destructive',
              success && 'text-success',
              labelClassName
            )}
          >
            {label}
          </label>
        )}
        <select
          className={cn(
            selectTriggerVariants({ variant, size, state: selectState, width }),
            className
          )}
          ref={ref}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
          {props.children}
        </select>
        {(error || success || helperText) && (
          <p
            className={cn(
              'text-sm',
              error && 'text-destructive',
              success && 'text-success',
              !error && !success && 'text-muted-foreground',
              helperTextClassName
            )}
          >
            {error || success || helperText}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';

export { Select };
