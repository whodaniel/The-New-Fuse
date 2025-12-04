import React from 'react';
export interface OptimizedImageProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
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
export declare const OptimizedImage: React.FC<OptimizedImageProps>;
export declare const generateSrcSet: (basePath: string, sizes: number[], extension?: string) => string;
export declare const generateWebPSrcSet: (basePath: string, sizes: number[]) => string;
