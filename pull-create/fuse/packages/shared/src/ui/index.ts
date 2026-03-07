// Export UI related utilities and components

// Re-export UI components from the UI package if needed
// Temporarily comment out to avoid circular dependencies
// export * from '@the-new-fuse/ui';

// UI utility functions
export const getThemeClass = (theme: string): string => {
  return `theme-${theme}`;
};

export const getResponsiveClass = (size: 'sm' | 'md' | 'lg' | 'xl'): string => {
  const sizeMap = {
    'sm': 'max-w-sm',
    'md': 'max-w-md',
    'lg': 'max-w-lg',
    'xl': 'max-w-xl'
  };

  return sizeMap[size] || (sizeMap as any).md;
};