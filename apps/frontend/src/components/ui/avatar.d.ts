import React from 'react';
interface AvatarProps {
    className?: string;
    children?: React.ReactNode;
}
export declare function Avatar({ className, children }: AvatarProps): import("react/jsx-runtime").JSX.Element;
interface AvatarImageProps {
    src?: string;
    alt?: string;
    className?: string;
}
export declare function AvatarImage({ src, alt, className }: AvatarImageProps): import("react/jsx-runtime").JSX.Element;
interface AvatarFallbackProps {
    className?: string;
    children?: React.ReactNode;
}
export declare function AvatarFallback({ className, children }: AvatarFallbackProps): import("react/jsx-runtime").JSX.Element;
export {};
