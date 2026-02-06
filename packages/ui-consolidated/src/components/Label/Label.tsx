import * as LabelPrimitive from '@radix-ui/react-label';
import { cva, type VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { cn } from '../../utils/cn'; // Updated import path

const labelVariants = cva(
  'text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70',
  {
    variants: {
      variant: {
        default: '',
        required: "after:content-['*'] after:ml-0.5 after:text-destructive",
        error: 'text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>, VariantProps<typeof labelVariants> {
  error?: boolean;
  required?: boolean;
  optional?: boolean; // Added optional prop
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, required, variant, optional, children, ...props }, ref) => {
    // Determine variant based on props
    const variantToUse = error ? 'error' : required ? 'required' : variant;

    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants({ variant: variantToUse }), className)}
        {...props}
      >
        {children}
        {optional && <span className="ml-1 text-muted-foreground text-xs">(optional)</span>}
      </LabelPrimitive.Root>
    );
  }
);

Label.displayName = 'Label';

export { Label, labelVariants };
