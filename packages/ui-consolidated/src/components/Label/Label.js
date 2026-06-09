import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import * as React from "react";
import * as LabelPrimitive from "@radix-ui/react-label";
import { cva } from "class-variance-authority";
import { cn } from '../../utils/cn'; // Updated import path
const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70", {
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
});
const Label = React.forwardRef(({ className, error, required, variant, optional, children, ...props }, ref) => {
    // Determine variant based on props
    const variantToUse = error ? "error" : required ? "required" : variant;
    return (_jsxs(LabelPrimitive.Root, { ref: ref, className: cn(labelVariants({ variant: variantToUse }), className), ...props, children: [children, optional && _jsx("span", { className: "ml-1 text-muted-foreground text-xs", children: "(optional)" })] }));
});
Label.displayName = "Label";
export { Label, labelVariants };
