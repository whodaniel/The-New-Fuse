import React, { forwardRef } from 'react';

export interface AvatarProps {
  children?: React.ReactNode;
  className?: string;
}

export const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div 
        className={`inline-flex items-center justify-center overflow-hidden rounded-full ${className}`} 
        ref={ref} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

Avatar.displayName = 'Avatar';

export interface AvatarImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  className?: string;
}

export const AvatarImage = forwardRef<HTMLImageElement, AvatarImageProps>(
  ({ className = '', ...props }, ref) => {
    return (
      <img 
        className={`h-full w-full object-cover ${className}`} 
        ref={ref} 
        {...props}
      />
    );
  }
);

AvatarImage.displayName = 'AvatarImage';

export interface AvatarFallbackProps {
  children?: React.ReactNode;
  className?: string;
}

export const AvatarFallback = forwardRef<HTMLDivElement, AvatarFallbackProps>(
  ({ children, className = '', ...props }, ref) => {
    return (
      <div 
        className={`flex h-full w-full items-center justify-center bg-gray-100 ${className}`} 
        ref={ref} 
        {...props}
      >
        {children}
      </div>
    );
  }
);

AvatarFallback.displayName = 'AvatarFallback';