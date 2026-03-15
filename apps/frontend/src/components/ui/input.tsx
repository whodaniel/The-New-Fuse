import React, { useId } from 'react';
import { cn } from '../../lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, helperText, id: providedId, ...props }, ref) => {
    const generatedId = useId();
    const id = providedId || generatedId;
    const helperTextId = helperText ? `${id}-helper` : undefined;

    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="block text-sm font-medium text-foreground mb-1">
            {label}
          </label>
        )}
        <input
          id={id}
          type={type}
          aria-invalid={!!error}
          aria-describedby={helperTextId}
          className={cn(
            'flex h-9 w-full rounded-md border bg-background px-3 py-1.5 text-sm text-foreground',
            'ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium',
            'placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2',
            'focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed',
            'disabled:opacity-50',
            error ? 'border-red-500' : 'border-input',
            className
          )}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p
            id={helperTextId}
            className={cn('mt-1 text-xs', error ? 'text-red-500' : 'text-muted-foreground')}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
