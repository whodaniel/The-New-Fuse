import React, { FC } from "react";

interface PreloaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  sm: 'w-4 h-4',
  md: 'w-8 h-8',
  lg: 'w-12 h-12'
} as const;

export const Preloader: FC<PreloaderProps> = ({ 
  size = 'md',
  className = ''
}) => {
  return (
    <div className={`flex justify-center items-center ${className}`}>
      <div 
        className={`animate-spin rounded-full border-4 border-gray-200 border-t-blue-600 ${sizeClasses[size]}`}
      />
    </div>
  );
};

export const FullScreenLoader: FC = (): JSX.Element => () => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm z-50">
      <Preloader size="lg" />
    </div>
  );
};

export type { PreloaderProps };
