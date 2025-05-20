import React, { ReactNode } from 'react';
import { cn } from '../../lib/utils.js';

interface BaseLayoutProps {
  children: ReactNode;
  className?: string;
}

export const BaseLayout = ({ children, className }: BaseLayoutProps) => {
  return (
    <div className="min-h-screen bg-background dark:bg-gray-900">
      <main className={cn('flex-1 overflow-y-auto p-6', className)}>
        {children}
      </main>
    </div>
  );
};
//# sourceMappingURL=index.js.map