"use strict";
// Export UI related utilities and components
Object.defineProperty(exports, "__esModule", { value: true });
exports.getResponsiveClass = exports.getThemeClass = void 0;
// Re-export UI components from the UI package if needed
// Temporarily comment out to avoid circular dependencies
// export * from '@the-new-fuse/ui';
// UI utility functions
const getThemeClass = (theme) => {
    return `theme-${theme}`;
};
exports.getThemeClass = getThemeClass;
const getResponsiveClass = (size) => {
    const sizeMap = {
        'sm': 'max-w-sm',
        'md': 'max-w-md',
        'lg': 'max-w-lg',
        'xl': 'max-w-xl'
    };
    return sizeMap[size] || sizeMap.md;
};
exports.getResponsiveClass = getResponsiveClass;
//# sourceMappingURL=index.js.map