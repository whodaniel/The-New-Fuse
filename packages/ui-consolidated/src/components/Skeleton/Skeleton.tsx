import React, { forwardRef } from 'react';

export interface SkeletonProps {
  className?: string;
}

export const Skeleton = forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <div 
        className={`animate-pulse rounded-md bg-gray-200 ${className}`} 
        ref={ref} 
        {...props} 
      />
    );
  }
);

Skeleton.displayName = 'Skeleton';