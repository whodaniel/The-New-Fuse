import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../../utils.js';

/**
 * Alert variants using class-variance-authority
 */
export const alertVariants = cva(
  'relative w-full rounded-lg border p-4',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        error: 'border-destructive bg-destructive/10 text-destructive',
        warning: 'border-warning bg-warning/10 text-warning',
        success: 'border-success bg-success/10 text-success',
        info: 'border-info bg-info/10 text-info',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

/**
 * Alert component props
 */
export interface AlertProps 
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof alertVariants> {
  /**
   * Icon to display in the alert
   */
  icon?: React.ReactNode;
}

/**
 * Alert title component props
 */
export interface AlertTitleProps extends React.HTMLAttributes<HTMLHeadingElement> {}

/**
 * Alert description component props
 */
export interface AlertDescriptionProps extends React.HTMLAttributes<HTMLParagraphElement> {}

/**
 * Alert component for displaying status messages
 *
 * @example
 * // Basic usage
 * <Alert>
 *   <AlertTitle>Information</AlertTitle>
 *   <AlertDescription>This is an informational message.</AlertDescription>
 * </Alert>
 *
 * // With variant
 * <Alert variant="error">
 *   <AlertTitle>Error</AlertTitle>
 *   <AlertDescription>Something went wrong. Please try again.</AlertDescription>
 * </Alert>
 *
 * // With custom icon
 * <Alert icon={<InfoIcon />}>
 *   <AlertTitle>Note</AlertTitle>
 *   <AlertDescription>Please read this important information.</AlertDescription>
 * </Alert>
 */
const Alert = React.forwardRef<HTMLDivElement, AlertProps>(
  ({ className, variant, icon, children, ...props }, ref) => (
    <div
      ref={ref}
      role="alert"
      className={cn(alertVariants({ variant, className }))}
      {...props}
    >
      {icon && <div className="mr-4">{icon}</div>}
      <div className="flex-1">{children}</div>
    </div>
  )
);
Alert.displayName = 'Alert';

/**
 * Alert title component
 */
const AlertTitle = React.forwardRef<HTMLHeadingElement, AlertTitleProps>(
  ({ className, ...props }, ref) => (
    <h5 ref={ref} className={cn('mb-1 font-medium', className)} {...props} />
  )
);
AlertTitle.displayName = 'AlertTitle';

/**
 * Alert description component
 */
const AlertDescription = React.forwardRef<HTMLParagraphElement, AlertDescriptionProps>(
  ({ className, ...props }, ref) => (
    <p ref={ref} className={cn('text-sm', className)} {...props} />
  )
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertTitle, AlertDescription };
