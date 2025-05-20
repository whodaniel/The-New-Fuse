import { forwardRef } from "react";
import { cn } from '../../utils/index.js';

// Fix the Input interface to correctly handle the size property
export interface InputProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  [key: string]: any;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, size = 'md', icon, iconPosition = 'left', ...props }, ref) => {
    // Explicitly define the size styles with proper type safety
    const sizeStyles: Record<string, string> = {
      sm: 'h-8 px-3 py-1 text-sm',
      md: 'h-10 px-4 py-2',
      lg: 'h-12 px-5 py-3 text-lg',
    };

    // Use a type assertion to help TypeScript understand size is a valid key
    const sizeStyle = sizeStyles[size as keyof typeof sizeStyles] || sizeStyles.md;

    const inputStyles = cn(
      'flex w-full rounded-md border border-input bg-background',
      'text-sm ring-offset-background',
      'placeholder:text-muted-foreground',
      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      'disabled:cursor-not-allowed disabled:opacity-50',
      sizeStyle,
      className
    );

    // If there's an icon, wrap the input in a relative div
    if (icon) {
      return (
        <div className="relative w-full">
          {iconPosition === 'left' && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {icon}
            </div>
          )}
          
          <input
            ref={ref}
            className={cn(
              inputStyles,
              iconPosition === 'left' ? 'pl-10' : '',
              iconPosition === 'right' ? 'pr-10' : ''
            )}
            {...props}
          />
          
          {iconPosition === 'right' && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      );
    }

    return <input className={inputStyles} ref={ref} {...props} />;
  }
);

Input.displayName = 'Input';