import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '../../../utils/cn.js'; // Fixed import path
import { cva, type VariantProps } from 'class-variance-authority';

/**
 * Button variants configuration using class-variance-authority
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'underline-offset-4 hover:underline text-primary',
      },
      size: {
        default: 'h-10 py-2 px-4',
        sm: 'h-9 px-3 rounded-md',
        lg: 'h-11 px-8 rounded-md',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

/**
 * Button component props interface combining HTML button props and variant props
 */
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Optional icon to display before button text
   */
  startIcon?: React.ReactNode;
  /**
   * Optional icon to display after button text
   */
  endIcon?: React.ReactNode;
  /**
   * Whether the button is in a loading state
   */
  isLoading?: boolean;
  /**
   * Text to display when button is in loading state
   */
  loadingText?: string;
  /**
   * Optional custom loading indicator
   */
  loadingIndicator?: React.ReactNode;
  /**
   * Whether the button takes full width of its container
   */
  fullWidth?: boolean;
}

/**
 * Button component with support for various variants, sizes, icons, and loading state
 * 
 * @example
 * // Default button
 * <Button>Click me</Button>
 * 
 * @example
 * // Destructive button with loading state
 * <Button variant="destructive" isLoading loadingText="Deleting...">
 *   Delete item
 * </Button>
 * 
 * @example
 * // Button with start and end icons
 * <Button 
 *   startIcon={<Icon name="plus" />} 
 *   endIcon={<Icon name="arrow-right" />}
 * >
 *   Create and continue
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      startIcon,
      endIcon,
      isLoading = false,
      loadingText,
      loadingIndicator,
      fullWidth = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    // Default loading indicator
    const defaultLoadingIndicator = (
      <svg
        className="animate-spin -ml-1 mr-2 h-4 w-4"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    );

    return (
      <button
        className={cn(
          buttonVariants({ variant, size }),
          fullWidth ? 'w-full' : '',
          className
        )}
        ref={ref}
        disabled={isLoading || disabled}
        {...props}
      >
        {isLoading ? (
          <>
            {loadingIndicator || defaultLoadingIndicator}
            {loadingText || children}
          </>
        ) : (
          <>
            {startIcon && <span className="mr-2">{startIcon}</span>}
            {children}
            {endIcon && <span className="ml-2">{endIcon}</span>}
          </>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

export { Button, buttonVariants };