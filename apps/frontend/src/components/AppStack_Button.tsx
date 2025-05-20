// This file is kept for backward compatibility
// It re-exports the consolidated Button component with a wrapper for AppStack_Button
import React from 'react';
import { Button } from '@the-new-fuse/ui-components/src/core/button';

interface AppStackButtonProps {
  onClick?: () => void;
  variant?: 'default' | 'destructive';
  children: React.ReactNode;
  disabled?: boolean;
  className?: string;
}

// Wrapper component that maintains the same API but uses the consolidated Button
export const AppStack_Button: React.React.FC<AppStackButtonProps> = ({
  onClick,
  variant = 'default',
  children,
  disabled,
  className = ''
}) => {
  // Map the AppStack_Button variants to the consolidated Button variants
  const mappedVariant = variant === 'destructive' ? 'destructive' : 'default';

  return (
    <Button
      onClick={onClick}
      variant={mappedVariant}
      disabled={disabled}
      className={className}
    >
      {children}
    </Button>
  );
};
