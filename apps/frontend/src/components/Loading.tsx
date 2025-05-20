import React from 'react';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  className?: string;
}

const Loading: React.React.FC<LoadingProps> = ({ 
  size = 'md', 
  fullScreen = true,
  className = ''
}) => {
  // Size mapping
  const sizeClasses = {
    sm: 'h-8 w-8 border-2',
    md: 'h-12 w-12 border-4',
    lg: 'h-16 w-16 border-4'
  };

  // Container classes based on fullScreen prop
  const containerClasses = fullScreen 
    ? 'flex items-center justify-center min-h-screen' 
    : 'flex items-center justify-center';

  return (
    <div className={containerClasses}>
      <div 
        className={`
          animate-spin 
          rounded-full 
          ${sizeClasses[size]} 
          border-solid 
          border-[var(--theme-loader,#4f46e5)] 
          border-t-transparent 
          ${className}
        `}
        aria-label="Loading"
        role="status"
      />
    </div>
  );
};

// Also export a FullScreenLoader for convenience
export const FullScreenLoader: React.FC = () => <Loading fullScreen={true} size="lg" />;

export default Loading;
