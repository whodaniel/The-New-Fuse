// Re-export the Button component from the ui-consolidated package
import { Button as UIButton, ButtonProps as UIButtonProps } from '@the-new-fuse/ui-consolidated';
import React from 'react';

// Extend ButtonProps to include `loading` as an alias for `isLoading` if needed,
// but the issue was `loading` being passed to DOM.
// `UIButton` (from ui-consolidated) handles `isLoading` and `asChild`, but we need to verify if it strips `loading` prop if we pass it.
// The crawler error said: "Received `false` for a non-boolean attribute `loading`."
// This means we are passing `loading` to the Button component, and it is passing it down to the DOM element.

export interface ButtonProps extends UIButtonProps {
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ loading, ...props }, ref) => {
  // Map `loading` to `isLoading` which ui-consolidated Button expects
  return <UIButton ref={ref} isLoading={loading || props.isLoading} {...props} />;
});

Button.displayName = 'Button';
