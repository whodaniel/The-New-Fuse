import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from '../utils.js';

const labelVariants = cva(
  "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
  {
    variants: {
      variant: {
        default: "",
        required: "after:content-['*'] after:ml-0.5 after:text-destructive",
        error: "text-destructive"
      }
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface LabelProps
  extends React.LabelHTMLAttributes<HTMLLabelElement>,
    VariantProps<typeof labelVariants> {
  error?: boolean;
  required?: boolean;
}

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, error, required, variant, ...props }, ref) => {
    // Determine variant based on props
    const variantToUse = error ? "error" : required ? "required" : variant;

    return (
      <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants({ variant: variantToUse }), className)}
        {...props}
      />
    );
  }
);

Label.displayName = "Label";

export { Label, labelVariants };