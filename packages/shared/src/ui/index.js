// Export UI related utilities and components
// Re-export UI components from the UI package if needed
// Temporarily comment out to avoid circular dependencies
// export * from '@the-new-fuse/ui';
// UI utility functions
export const getThemeClass = (theme) => {
    return `theme-${theme}`;
};
export const getResponsiveClass = (size) => {
    const sizeMap = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl'
    };
    return sizeMap[size] || sizeMap.md;
};
//# sourceMappingURL=index.js.map