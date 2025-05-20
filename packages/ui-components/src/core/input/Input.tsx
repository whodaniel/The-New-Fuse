import React from "react";
import { cn } from '../../utils/cn.js'; // Added file extension
import { InputProps } from '../types.js'; // Added file extension

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, error, label, helperText, type, ...props }, ref) => {
    const id = props.id || props.name || Math.random().toString(36).substring(2, 9);
    
    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={id}
            className={cn(
              "mb-1 block text-sm font-medium text-foreground",
              props.disabled && "opacity-70"
            )}
          >
            {label}
            {props.required && <span className="text-destructive">*</span>}
          </label>
        )}
        
        <input
          type={type || "text"}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
          id={id}
          ref={ref}
          {...props}
        />
        
        {helperText && !error && (
          <p className="mt-1 text-xs text-muted-foreground">{helperText}</p>
        )}
        
        {error && (
          <p className="mt-1 text-xs text-destructive">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };