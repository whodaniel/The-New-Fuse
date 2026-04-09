import { Button as UIButton } from '@the-new-fuse/ui-consolidated';
import React from 'react';

// Extend ButtonProps to include `loading` and ensure standard HTML attributes + variants are present
export interface ButtonProps extends React.ComponentPropsWithoutRef<typeof UIButton> {
  loading?: boolean;
  isLoading?: boolean; // Included in UIButtonProps but helpful to be explicit
  asChild?: boolean;
  loading?: boolean;
  isLoading?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'start' | 'end';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      isLoading = false,
      icon,
      iconPosition = 'start',
      children,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : 'button';
    const busy = loading || isLoading;

    const content = (
      <>
        {busy && (
          <svg
            className="animate-spin -ml-1 mr-2 h-4 w-4"
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
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        {icon && iconPosition === 'start' && !busy ? <span className="mr-2">{icon}</span> : null}
        {children}
        {icon && iconPosition === 'end' && !busy ? <span className="ml-2">{icon}</span> : null}
      </>
    );

    return (
      <Comp
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={busy || props.disabled}
        {...props}
      >
        {asChild ? children : content}
      </Comp>
    );
  }
);

Button.displayName = 'Button';
