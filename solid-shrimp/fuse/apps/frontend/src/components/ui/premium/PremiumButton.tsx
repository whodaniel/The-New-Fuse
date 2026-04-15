import { LucideIcon } from 'lucide-react';
import React, { ButtonHTMLAttributes, ReactNode } from 'react';

interface PremiumButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  loading?: boolean;
  fullWidth?: boolean;
  ariaLabel?: string;
}

/**
 * Premium Button Component with Gradient Effects
 */
export const PremiumButton: React.FC<PremiumButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  loading = false,
  fullWidth = false,
  ariaLabel,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-4 py-2 text-sm h-10', // 40px tall
    md: 'px-6 py-3 text-base h-12', // 48px tall
    lg: 'px-8 py-4 text-lg h-14', // 56px tall
    xl: 'px-10 py-5 text-xl h-16', // 64px tall
    '2xl': 'px-12 py-6 text-2xl h-20', // 80px tall
  };

  const variantClasses = {
    primary:
      'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]',
    secondary:
      'bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-500 hover:to-gray-600 text-white shadow-md hover:shadow-lg',
    outline:
      'border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm hover:border-white/30',
    ghost: 'text-white hover:bg-white/10 backdrop-blur-sm',
    danger:
      'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 text-white shadow-lg hover:shadow-xl',
    gradient:
      'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98]',
  };

  const widthClass = fullWidth ? 'w-full' : '';

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      {...props}
    >
      {loading && (
        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
      )}
      {!loading && Icon && iconPosition === 'left' && <Icon className="w-5 h-5" />}
      {children}
      {!loading && Icon && iconPosition === 'right' && <Icon className="w-5 h-5" />}
    </button>
  );
};

/**
 * Icon Button - Round button with just an icon
 */
interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon: LucideIcon;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  tooltip?: string;
  'aria-label'?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  icon: Icon,
  variant = 'ghost',
  size = 'md',
  tooltip,
  className = '',
  'aria-label': ariaLabel,
  ...props
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-500 text-white',
    secondary: 'bg-gray-600 hover:bg-gray-500 text-white',
    outline: 'border-2 border-white/20 text-white hover:bg-white/10 backdrop-blur-sm',
    ghost: 'text-white hover:bg-white/10 backdrop-blur-sm',
  };

  return (
    <button
      className={`rounded-full flex items-center justify-center transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      title={tooltip}
      aria-label={ariaLabel || tooltip}
      {...props}
    >
      <Icon className={iconSizeClasses[size]} />
    </button>
  );
};
