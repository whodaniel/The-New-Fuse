import React from "react";
import { cn } from '../utils/cn.js'; // Added file extension
import { LabelProps } from './types.js'; // Added file extension

const Label = React.forwardRef<HTMLLabelElement, LabelProps>(
  ({ className, optional, children, ...props }, ref) => (
    <label
      ref={ref}
      className={cn(
        "text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      {...props}
    >
      {children}
      {optional && <span className="ml-1 text-muted-foreground text-xs">(optional)</span>}
    </label>
  )
);

Label.displayName = "Label";

export { Label };