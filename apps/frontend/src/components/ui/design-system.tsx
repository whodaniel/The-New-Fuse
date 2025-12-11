/**
 * The New Fuse Design System - Comprehensive Component Library
 * This file provides reusable, consistent UI components that implement the design system
 */

import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';
import React, { ButtonHTMLAttributes, forwardRef, HTMLAttributes, ReactNode } from 'react';

// Base Button Component
const buttonVariants = cva(
  'btn transition-all duration-200 ease-in-out focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        primary: 'btn-primary',
        secondary: 'btn-secondary',
        outline: 'btn-outline',
        success: 'btn-success',
        danger: 'btn-danger',
        ghost: 'bg-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800',
        link: 'bg-transparent underline-offset-4 hover:underline text-primary',
      },
      size: {
        sm: 'btn-sm',
        md: 'btn-md',
        lg: 'btn-lg',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  }
);

interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? 'span' : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

// Card Component
const cardVariants = cva('card', {
  variants: {
    variant: {
      default: 'bg-white dark:bg-neutral-800',
      glass: 'glass-effect',
      gradient: 'gradient-primary',
    },
    shadow: {
      none: 'shadow-none',
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    },
  },
  defaultVariants: {
    variant: 'default',
    shadow: 'sm',
  },
});

interface CardProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof cardVariants> {
  children: ReactNode;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant, shadow, children, ...props }, ref) => {
    return (
      <div ref={ref} className={cn(cardVariants({ variant, shadow, className }))} {...props}>
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';

// Card Header
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('flex flex-col space-y-1.5 p-6', className)} {...props} />;
  }
);
CardHeader.displayName = 'CardHeader';

// Card Title
const CardTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h3
        ref={ref}
        className={cn('text-2xl font-semibold leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);
CardTitle.displayName = 'CardTitle';

// Card Description
const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <p ref={ref} className={cn('text-sm text-muted-foreground', className)} {...props} />;
  }
);
CardDescription.displayName = 'CardDescription';

// Card Content
const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('p-6 pt-0', className)} {...props} />;
  }
);
CardContent.displayName = 'CardContent';

// Card Footer
const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('flex items-center p-6 pt-0', className)} {...props} />;
  }
);
CardFooter.displayName = 'CardFooter';

// Badge Component
const badgeVariants = cva('badge', {
  variants: {
    variant: {
      default: 'badge-secondary',
      primary: 'badge-primary',
      secondary: 'badge-secondary',
      success: 'badge-success',
      warning: 'badge-warning',
      danger: 'badge-danger',
    },
    size: {
      sm: 'text-xs px-2 py-0.5',
      md: 'text-sm px-3 py-1',
      lg: 'text-base px-4 py-1.5',
    },
  },
  defaultVariants: {
    variant: 'default',
    size: 'md',
  },
});

interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span ref={ref} className={cn(badgeVariants({ variant, size, className }))} {...props} />
    );
  }
);
Badge.displayName = 'Badge';

// Alert Component
const alertVariants = cva(
  'relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground',
  {
    variants: {
      variant: {
        default: 'bg-background text-foreground',
        primary: 'border-primary/50 text-primary dark:border-primary [&>svg]:text-primary',
        secondary:
          'border-secondary/50 text-secondary dark:border-secondary [&>svg]:text-secondary',
        success: 'border-success/50 text-success dark:border-success [&>svg]:text-success',
        warning: 'border-warning/50 text-warning dark:border-warning [&>svg]:text-warning',
        danger: 'border-danger/50 text-danger dark:border-danger [&>svg]:text-danger',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

interface AlertProps extends HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {}

const Alert = forwardRef<HTMLDivElement, AlertProps>(({ className, variant, ...props }, ref) => {
  return (
    <div ref={ref} role="alert" className={cn(alertVariants({ variant, className }))} {...props} />
  );
});
Alert.displayName = 'Alert';

// Alert Title
const AlertTitle = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => {
    return (
      <h5
        ref={ref}
        className={cn('mb-1 font-medium leading-none tracking-tight', className)}
        {...props}
      />
    );
  }
);
AlertTitle.displayName = 'AlertTitle';

// Alert Description
const AlertDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('text-sm [&_p]:leading-relaxed', className)} {...props} />;
  }
);
AlertDescription.displayName = 'AlertDescription';

// Stat Card Component
interface StatCardProps extends HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  change?: string;
  icon?: ReactNode;
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
}

const StatCard = forwardRef<HTMLDivElement, StatCardProps>(
  ({ className, title, value, change, icon, color = 'primary', ...props }, ref) => {
    const colorClasses = {
      primary: 'bg-primary-50 border-primary-200',
      secondary: 'bg-secondary-50 border-secondary-200',
      success: 'bg-success-50 border-success-200',
      warning: 'bg-warning-50 border-warning-200',
      danger: 'bg-danger-50 border-danger-200',
    };

    return (
      <Card ref={ref} className={cn('p-6 border', colorClasses[color], className)} {...props}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={`text-3xl font-bold mt-1 ${
                color === 'primary'
                  ? 'text-primary'
                  : color === 'secondary'
                    ? 'text-secondary'
                    : color === 'success'
                      ? 'text-success'
                      : color === 'warning'
                        ? 'text-warning'
                        : 'text-danger'
              }`}
            >
              {value}
            </p>
            {change && (
              <p
                className={`text-xs mt-1 ${change.includes('+') ? 'text-success' : 'text-danger'}`}
              >
                {change}
              </p>
            )}
          </div>
          {icon && (
            <div
              className={`p-3 rounded-full ${
                color === 'primary'
                  ? 'bg-primary-100'
                  : color === 'secondary'
                    ? 'bg-secondary-100'
                    : color === 'success'
                      ? 'bg-success-100'
                      : color === 'warning'
                        ? 'bg-warning-100'
                        : 'bg-danger-100'
              }`}
            >
              {icon}
            </div>
          )}
        </div>
      </Card>
    );
  }
);
StatCard.displayName = 'StatCard';

// Animated Card Component
interface AnimatedCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gradient?: string;
  hoverEffect?: boolean;
}

const AnimatedCard = forwardRef<HTMLDivElement, AnimatedCardProps>(
  ({ className, children, gradient, hoverEffect = true, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        className={cn(
          'transition-all duration-300 ease-in-out',
          gradient || 'bg-white dark:bg-neutral-800',
          hoverEffect && 'hover:shadow-lg hover:-translate-y-1',
          className
        )}
        {...props}
      >
        <div className="p-6">{children}</div>
      </Card>
    );
  }
);
AnimatedCard.displayName = 'AnimatedCard';

// Glass Card Component
interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gradient?: string;
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, children, gradient, ...props }, ref) => {
    return (
      <Card
        ref={ref}
        variant="glass"
        className={cn(
          'backdrop-blur-md bg-white/40 dark:bg-slate-900/60 border border-white/20 dark:border-white/10 shadow-xl',
          gradient,
          className
        )}
        {...props}
      >
        <div className="p-6">{children}</div>
      </Card>
    );
  }
);
GlassCard.displayName = 'GlassCard';

// Feature Card Component
interface FeatureCardProps extends HTMLAttributes<HTMLDivElement> {
  icon: ReactNode;
  title: string;
  description: string;
  gradient?: string;
}

const FeatureCard = forwardRef<HTMLDivElement, FeatureCardProps>(
  ({ className, icon, title, description, gradient, ...props }, ref) => {
    return (
      <AnimatedCard ref={ref} className={cn('group', className)} gradient={gradient} {...props}>
        <div className="relative">
          <div
            className={`w-14 h-14 rounded-2xl ${gradient || 'bg-gradient-to-br from-primary to-secondary'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg`}
          >
            {icon}
          </div>
          <h3 className="text-xl font-bold mb-3 text-gray-900 dark:text-white group-hover:text-primary transition-colors">
            {title}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 leading-relaxed">{description}</p>
        </div>
      </AnimatedCard>
    );
  }
);
FeatureCard.displayName = 'FeatureCard';

// Loading Spinner Component
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

const LoadingSpinner = ({ size = 'md', color = 'text-primary' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
  };

  return (
    <div className="flex justify-center items-center">
      <div
        className={`animate-spin rounded-full border-t-2 border-b-2 ${sizeClasses[size]} ${color}`}
      />
    </div>
  );
};

// Progress Bar Component
interface ProgressBarProps {
  value: number;
  max?: number;
  color?: string;
  className?: string;
}

const ProgressBar = ({ value, max = 100, color = 'bg-primary', className }: ProgressBarProps) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  return (
    <div className={cn('w-full bg-neutral-200 rounded-full h-2 dark:bg-neutral-700', className)}>
      <div
        className={cn('h-2 rounded-full transition-all duration-300 ease-in-out', color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Toast Component
interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  onClose?: () => void;
}

const Toast = ({ message, type = 'info', onClose }: ToastProps) => {
  const typeClasses = {
    success: 'bg-success-100 border-success-300 text-success-800',
    error: 'bg-danger-100 border-danger-300 text-danger-800',
    warning: 'bg-warning-100 border-warning-300 text-warning-800',
    info: 'bg-primary-100 border-primary-300 text-primary-800',
  };

  return (
    <div
      className={cn(
        'p-4 rounded-lg border shadow-lg transition-all duration-300',
        typeClasses[type]
      )}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <div className="mr-3">
            {type === 'success' && '✓'}
            {type === 'error' && '✗'}
            {type === 'warning' && '⚠'}
            {type === 'info' && 'ℹ'}
          </div>
          <p className="text-sm">{message}</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="ml-4 text-sm font-medium hover:opacity-70 transition-opacity"
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
};

// Modal Component
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  title?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | 'full';
}

const Modal = ({ isOpen, onClose, children, title, size = 'md' }: ModalProps) => {
  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    full: 'max-w-full',
  };

  return (
    <div className="fixed inset-0 z-modal overflow-y-auto">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="flex min-h-full items-center justify-center p-4 text-center">
        <div
          className={cn(
            'relative w-full transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-left shadow-xl transition-all',
            sizeClasses[size]
          )}
        >
          {title && (
            <div className="border-b border-neutral-200 dark:border-neutral-700 px-6 py-4">
              <h3 className="text-lg font-medium text-neutral-900 dark:text-neutral-100">
                {title}
              </h3>
            </div>
          )}

          <div className="px-6 py-4">{children}</div>

          <div className="border-t border-neutral-200 dark:border-neutral-700 px-6 py-4">
            <button onClick={onClose} className="btn btn-outline btn-sm">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Chakra-compatible Modal subcomponents for easier migration
const ModalOverlay = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity', className)}
      {...props}
    />
  )
);
ModalOverlay.displayName = 'ModalOverlay';

const ModalContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement> & { size?: ModalProps['size'] }>(
  ({ className, size = 'md', ...props }, ref) => {
    const sizeClasses = {
      sm: 'max-w-sm',
      md: 'max-w-md',
      lg: 'max-w-lg',
      xl: 'max-w-xl',
      '2xl': 'max-w-2xl',
      '3xl': 'max-w-3xl',
      '4xl': 'max-w-4xl',
      '5xl': 'max-w-5xl',
      '6xl': 'max-w-6xl',
      full: 'max-w-full',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative w-full transform overflow-hidden rounded-2xl bg-white dark:bg-neutral-800 text-left shadow-xl transition-all',
          sizeClasses[size],
          className
        )}
        {...props}
      />
    );
  }
);
ModalContent.displayName = 'ModalContent';

const ModalHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-b border-neutral-200 dark:border-neutral-700 px-6 py-4', className)}
      {...props}
    />
  )
);
ModalHeader.displayName = 'ModalHeader';

const ModalBody = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-4', className)} {...props} />
  )
);
ModalBody.displayName = 'ModalBody';

const ModalFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('border-t border-neutral-200 dark:border-neutral-700 px-6 py-4 flex gap-2 justify-end', className)}
      {...props}
    />
  )
);
ModalFooter.displayName = 'ModalFooter';

const ModalCloseButton = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      className={cn('absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors', className)}
      {...props}
    >
      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    </button>
  )
);
ModalCloseButton.displayName = 'ModalCloseButton';

// Tabs Component
interface Tab {
  id: string;
  title: string;
  content: ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab?: string;
  onTabChange?: (tabId: string) => void;
}

const Tabs = ({ tabs, activeTab, onTabChange }: TabsProps) => {
  const [active, setActive] = React.useState(activeTab || tabs[0]?.id);

  const handleTabChange = (tabId: string) => {
    setActive(tabId);
    if (onTabChange) onTabChange(tabId);
  };

  return (
    <div className="w-full">
      <div className="flex border-b border-neutral-200 dark:border-neutral-700">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={cn(
              'px-4 py-2 text-sm font-medium transition-colors',
              active === tab.id
                ? 'border-b-2 border-primary text-primary'
                : 'text-neutral-500 hover:text-neutral-700 dark:text-neutral-400 dark:hover:text-neutral-200'
            )}
          >
            {tab.title}
          </button>
        ))}
      </div>

      <div className="mt-4">{tabs.find((tab) => tab.id === active)?.content}</div>
    </div>
  );
};

// Export all components
export {
  Alert,
  AlertDescription,
  AlertTitle,
  AnimatedCard,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  FeatureCard,
  GlassCard,
  LoadingSpinner,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  ProgressBar,
  StatCard,
  Tabs,
  Toast,
};
