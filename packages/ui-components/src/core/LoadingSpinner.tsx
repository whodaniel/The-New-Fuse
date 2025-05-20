import React from 'react';
import { cn } from '../lib/utils.js';

interface LoadingSpinnerProps {
  className?: string;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ className }) => {
  return (<div className={cn('flex items-center justify-center w-full h-full', className)}>
    <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
  </div>);
};

export { LoadingSpinner };