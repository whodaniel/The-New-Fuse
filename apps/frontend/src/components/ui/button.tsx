import { Button as UIButton, buttonVariants } from '@the-new-fuse/ui-consolidated';
import { type VariantProps } from 'class-variance-authority';
import React from 'react';

// Extend ButtonProps to include `loading` and ensure standard HTML attributes + variants are present
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  loading?: boolean;
  isLoading?: boolean; // Included in UIButtonProps but helpful to be explicit
  asChild?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, ...props }, ref) => {
    // Map `loading` to `isLoading` which ui-consolidated Button expects
    return <UIButton ref={ref} isLoading={loading || props.isLoading} {...props} />;
  }
);

Button.displayName = 'Button';
