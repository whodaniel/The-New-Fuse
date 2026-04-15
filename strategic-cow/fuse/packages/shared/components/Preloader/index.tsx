import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

const preloaderVariants = cva(
  'animate-spin rounded-full border-current border-t-transparent',
  {
    variants: {
      size: {
        xs: 'h-3 w-3 border',
        sm: 'h-4 w-4 border-2',
        md: 'h-6 w-6 border-2',
        lg: 'h-8 w-8 border-[3px]',
        xl: 'h-12 w-12 border-4',
      },
      variant: {
        default: 'text-primary',
        light: 'text-white',
        dark: 'text-gray-900',
        muted: 'text-gray-400',
      }
    },
    defaultVariants: {
      size: 'md',
      variant: 'default',
    }
  }
);

export interface PreloaderProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof preloaderVariants> {
  center?: boolean;
}

const Preloader = React.forwardRef<HTMLDivElement, PreloaderProps>(
  ({ className, size, variant, center, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="status"
        className={center ? 'flex items-center justify-center' : undefined}
        {...props}
      >
        <div className={preloaderVariants({ size, variant, className })} />
        <span className="sr-only">Loading...</span>
      </div>
    );
  }
);

Preloader.displayName = 'Preloader';

const FullScreenLoader = React.forwardRef<HTMLDivElement, Omit<PreloaderProps, 'center'>>(
  (props, ref) => {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm">
        <Preloader ref={ref} size="xl" center {...props} />
      </div>
    );
  }
);

FullScreenLoader.displayName = 'FullScreenLoader';

export { Preloader, FullScreenLoader, preloaderVariants };
