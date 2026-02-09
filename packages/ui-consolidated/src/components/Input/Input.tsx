import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils';

/**
 * Input variants using class-variance-authority
 */
export const inputVariants = cva(
  'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
  {
    variants: {
      variant: {
        default: '',
        outline: 'border-2',
        ghost: 'border-none shadow-none bg-transparent',
        filled: 'bg-muted border-transparent',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-8 px-3 text-xs rounded-md',
        lg: 'h-12 px-5 text-base rounded-md',
      },
      state: {
        default: '',
        error: 'border-destructive focus-visible:ring-destructive',
        success: 'border-success focus-visible:ring-success',
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
 * Input component props
 */
export interface InputProps 
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size" | "width">,
    VariantProps<typeof inputVariants> {
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
const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({
    className,
    variant,
    size,
    state,
    width = 'default',
    startIcon,
    endIcon,
    label,
    helperText,
    error,
    success,
    containerClassName,
    labelClassName,
    helperTextClassName,
    type = 'text',
    ...props
  }, ref) => {
    const inputState = error ? 'error' : success ? 'success' : state;

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
            htmlFor={props.id}
            aria-label={label}
          >
            {label}
          </label>
        )}
        <div className="relative">
          {startIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {startIcon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              inputVariants({ variant, size, state: inputState, width }),
              startIcon && 'pl-10',
              endIcon && 'pr-10',
              className
            )}
            ref={ref}
            {...props}
          />
          {endIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
              {endIcon}
            </div>
          )}
        </div>
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

Input.displayName = 'Input';

export { Input };
