import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from '../../utils/index.js';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary' | 'secondary' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'icon'; // Added 'icon' size to support Footer/Header components
  icon?: React.ReactNode; // Added icon support
  iconPosition?: 'left' | 'right'; // Added icon position support
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      icon,
      iconPosition = 'left',
      isLoading = false,
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    // Calculate base styles for all variants
    const baseStyles = cn(
      'inline-flex items-center justify-center rounded-md font-medium transition-colors',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:pointer-events-none',
    );
    
    // Calculate size-specific styles
    const sizeStyles = {
      sm: 'h-8 px-3 text-xs',
      md: 'h-10 px-4 text-sm',
      lg: 'h-12 px-6 text-base',
      icon: 'p-0 h-auto', // Style for icon size
    }[size];
    
    // Calculate variant-specific styles
    const variantStyles = {
      default: 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-300',
      primary: 'bg-primary text-white hover:bg-primary/90 focus:ring-primary/30',
      secondary: 'bg-secondary text-white hover:bg-secondary/90 focus:ring-secondary/30',
      outline: 'border border-gray-300 bg-transparent hover:bg-gray-50 focus:ring-gray-300 dark:border-gray-600 dark:hover:bg-gray-800 dark:text-gray-100',
      ghost: 'bg-transparent hover:bg-gray-100 focus:ring-gray-300 dark:hover:bg-gray-800 dark:text-gray-100',
    }[variant];
    
    return (
      <button
        ref={ref}
        className={cn(baseStyles, sizeStyles, variantStyles, className)}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg 
            className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24"
          >
            <circle 
              className="opacity-25" 
              cx="12" 
              cy="12" 
              r="10" 
              stroke="currentColor" 
              strokeWidth="4"
            />
            <path 
              className="opacity-75" 
              fill="currentColor" 
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        
        {icon && iconPosition === 'left' && !isLoading && icon}
        
        {children}
        
        {icon && iconPosition === 'right' && !isLoading && icon}
      </button>
    );
  }
);

Button.displayName = 'Button';