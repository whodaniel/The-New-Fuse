import React from 'react';
import { cn } from '@/lib/utils';

interface BaseLayoutProps {
  children: React.ReactNode;
  className?: string;
}

export const BaseLayout: React.FC<BaseLayoutProps> = ({ children, className }) => {
  return (
    <div className={cn("min-h-screen flex flex-col bg-background", className)}>
      {children}
    </div>
  );
};
