import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  className?: string;
  label?: string;
  error?: boolean;
  helperText?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', type = 'text', label, error, helperText, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {label}
          </label>
        )}
        <input
          type={type}
          className={`
            flex h-10 w-full rounded-md border ${error ? 'border-red-500' : 'border-gray-300'} bg-white px-3 py-2 text-sm
            ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium
            placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2
            focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed
            disabled:opacity-50
            ${className}
          `}
          ref={ref}
          {...props}
        />
        {helperText && (
          <p className={`mt-1 text-sm ${error ? 'text-red-500' : 'text-gray-500'}`}>
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
