/**
 * Avatar Component - Chakra-compatible Avatar for The New Fuse
 */

import { cn } from '@/lib/utils';
import React, { useState, type ReactNode } from 'react';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  children?: ReactNode;
  className?: string;
}

export const Avatar = ({ name, src, size = 'md', children, className }: AvatarProps) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl',
    '2xl': 'h-24 w-24 text-2xl',
  };

  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const showImage = src && !imageError;
  const showInitials = name && !showImage && !children;

  return (
    <div
      className={cn(
        'relative inline-flex items-center justify-center rounded-full bg-neutral-200 dark:bg-neutral-700 overflow-hidden',
        sizeClasses[size],
        className
      )}
    >
      {showImage && (
        <img
          src={src}
          alt={name || 'Avatar'}
          onError={() => setImageError(true)}
          className="h-full w-full object-cover"
        />
      )}
      {showInitials && (
        <span className="font-medium text-neutral-700 dark:text-neutral-300">
          {getInitials(name)}
        </span>
      )}
      {children}
    </div>
  );
};

export const AvatarBadge = ({
  children,
  className,
  placement = 'bottom-right',
}: {
  children?: ReactNode;
  className?: string;
  placement?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}) => {
  const placementClasses = {
    'top-right': 'top-0 right-0',
    'bottom-right': 'bottom-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-left': 'bottom-0 left-0',
  };

  return (
    <div
      className={cn(
        'absolute h-3 w-3 rounded-full border-2 border-white dark:border-neutral-800 bg-success-500',
        placementClasses[placement],
        className
      )}
    >
      {children}
    </div>
  );
};

export const AvatarGroup = ({
  children,
  max,
  size = 'md',
  spacing = '-2',
  className,
}: {
  children: ReactNode;
  max?: number;
  size?: AvatarProps['size'];
  spacing?: string;
  className?: string;
}) => {
  const childArray = React.Children.toArray(children);
  const displayChildren = max ? childArray.slice(0, max) : childArray;
  const remaining = max && childArray.length > max ? childArray.length - max : 0;

  return (
    <div className={cn('flex items-center', className)}>
      {displayChildren.map((child, index) => (
        <div key={index} className={index > 0 ? `ml-${spacing}` : ''}>
          {React.isValidElement(child) ? React.cloneElement(child as any, { size }) : child}
        </div>
      ))}
      {remaining > 0 && (
        <Avatar size={size} className={`ml-${spacing}`}>
          <span className="text-xs font-medium">+{remaining}</span>
        </Avatar>
      )}
    </div>
  );
};

// Composition-based Avatar components for compatibility
export const AvatarImage = ({
  src,
  alt,
  className,
}: {
  src?: string;
  alt?: string;
  className?: string;
}) => {
  const [imageError, setImageError] = useState(false);

  if (!src || imageError) return null;

  return (
    <img
      src={src}
      alt={alt || 'Avatar'}
      onError={() => setImageError(true)}
      className={cn('h-full w-full object-cover', className)}
    />
  );
};

export const AvatarFallback = ({
  children,
  className,
}: {
  children?: ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        'flex h-full w-full items-center justify-center bg-neutral-200 dark:bg-neutral-700',
        className
      )}
    >
      <span className="font-medium text-neutral-700 dark:text-neutral-300">{children}</span>
    </div>
  );
};
