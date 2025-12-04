interface ResponsiveImageProps {
    src: string;
    alt: string;
    className?: string;
    sizes?: string;
    priority?: boolean;
    objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    aspectRatio?: string;
}
/**
 * Responsive Image Component
 * - Lazy loads images by default
 * - Supports priority loading for above-the-fold images
 * - Automatically generates responsive srcset for different screen sizes
 * - Optimized for mobile performance
 */
export default function ResponsiveImage({ src, alt, className, sizes, priority, objectFit, aspectRatio, }: ResponsiveImageProps): import("react/jsx-runtime").JSX.Element;
export {};
