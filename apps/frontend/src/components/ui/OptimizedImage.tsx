import { cn } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';

export interface OptimizedImageProps extends Omit<
  React.ImgHTMLAttributes<HTMLImageElement>,
  'src' | 'srcSet'
> {
  src: string;
  alt: string;
  webpSrc?: string;
  srcSet?: string;
  webpSrcSet?: string;
  sizes?: string;
  lazy?: boolean;
  fadeIn?: boolean;
  aspectRatio?: string;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  webpSrc,
  srcSet,
  webpSrcSet,
  sizes,
  lazy = true,
  fadeIn = true,
  aspectRatio,
  objectFit = 'cover',
  placeholder,
  className,
  onLoad,
  onError,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(!lazy);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image enters viewport
        threshold: 0.01,
      }
    );

    observer.observe(imgRef.current);

    return () => {
      observer.disconnect();
    };
  }, [lazy]);

  const handleLoad = () => {
    setIsLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setHasError(true);
    onError?.();
  };

  const containerStyle: React.CSSProperties = {
    position: 'relative',
    overflow: 'hidden',
    ...(aspectRatio && { aspectRatio }),
  };

  const imageStyle: React.CSSProperties = {
    width: '100%',
    height: '100%',
    objectFit,
    transition: fadeIn ? 'opacity 0.3s ease-in-out' : undefined,
    opacity: fadeIn ? (isLoaded ? 1 : 0) : 1,
  };

  const placeholderStyle: React.CSSProperties = {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: '#f0f0f0',
    backgroundImage: placeholder ? `url(${placeholder})` : undefined,
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    filter: 'blur(10px)',
    transform: 'scale(1.1)', // Slightly scale up to hide blur edges
    transition: 'opacity 0.3s ease-in-out',
    opacity: isLoaded ? 0 : 1,
    pointerEvents: 'none',
  };

  return (
    <div ref={imgRef} style={containerStyle} className={cn('relative', className)}>
      {/* Placeholder */}
      {(fadeIn || placeholder) && !isLoaded && !hasError && (
        <div style={placeholderStyle} aria-hidden="true" />
      )}

      {/* Image with WebP support */}
      {isInView && !hasError && (
        <picture>
          {/* WebP sources with srcSet */}
          {webpSrc && <source type="image/webp" srcSet={webpSrcSet || webpSrc} sizes={sizes} />}

          {/* Fallback sources with srcSet */}
          {srcSet && <source srcSet={srcSet} sizes={sizes} />}

          {/* Fallback img tag */}
          <img
            src={src}
            alt={alt}
            style={imageStyle}
            loading={lazy ? 'lazy' : 'eager'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            {...props}
          />
        </picture>
      )}

      {/* Error state */}
      {hasError && (
        <div
          className="flex items-center justify-center w-full h-full bg-gray-100 text-gray-400"
          role="img"
          aria-label={`Failed to load image: ${alt}`}
        >
          <svg
            className="w-12 h-12"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
      )}
    </div>
  );
};

// Helper function to generate responsive image srcSet
export const generateSrcSet = (basePath: string, sizes: number[], extension = 'jpg'): string => {
  return sizes.map((size) => `${basePath}-${size}w.${extension} ${size}w`).join(', ');
};

// Helper function to generate WebP srcSet
export const generateWebPSrcSet = (basePath: string, sizes: number[]): string => {
  return generateSrcSet(basePath, sizes, 'webp');
};

// Example usage:
// <OptimizedImage
//   src="/images/hero.jpg"
//   webpSrc="/images/hero.webp"
//   srcSet={generateSrcSet('/images/hero', [400, 800, 1200, 1600])}
//   webpSrcSet={generateWebPSrcSet('/images/hero', [400, 800, 1200, 1600])}
//   sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
//   alt="Hero image"
//   aspectRatio="16/9"
//   lazy={true}
//   fadeIn={true}
// />
