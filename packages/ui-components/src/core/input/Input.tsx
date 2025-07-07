import React from "react";
import { cn } from '../../utils/cn'; // Added file extension
import { InputProps } from '../types'; // Added file extension

interface ExtendedInputProps extends Omit<InputProps, 'onChange'> {
  multiline?: boolean;
  error?: string;
  label?: string;
  helperText?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>;
}

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  className?: string;
}

const TextareaComponent = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  (props, ref) => <textarea ref={ref} {...props} />
);

const Input = React.forwardRef<HTMLInputElement, ExtendedInputProps>(
  ({ className, error, label, helperText, type, multiline, ...props }, ref) => {
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
        
        {multiline ? (
          <TextareaComponent
            className={cn(
              "flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none",
              error && "border-destructive focus-visible:ring-destructive",
              className
            )}
            id={id}
            {...(props as any)}
          />
        ) : (
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
        )}
        
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