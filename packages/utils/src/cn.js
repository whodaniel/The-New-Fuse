import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
/**
 * Utility function to conditionally combine CSS classes with Tailwind CSS support.
 * Combines clsx for conditional class names and tailwind-merge for proper Tailwind CSS class merging.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
//# sourceMappingURL=cn.js.map