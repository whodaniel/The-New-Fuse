import React from 'react';
import { type VariantProps } from 'class-variance-authority';
declare const preloaderVariants: (props?: ({
    size?: "sm" | "md" | "lg" | "xs" | "xl" | null | undefined;
    variant?: "light" | "dark" | "default" | "muted" | null | undefined;
} & import("class-variance-authority/types").ClassProp) | undefined) => string;
export interface PreloaderProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof preloaderVariants> {
    center?: boolean;
}
declare const Preloader: React.ForwardRefExoticComponent<PreloaderProps & React.RefAttributes<HTMLDivElement>>;
declare const FullScreenLoader: React.ForwardRefExoticComponent<Omit<PreloaderProps, "center"> & React.RefAttributes<HTMLDivElement>>;
export { Preloader, FullScreenLoader, preloaderVariants };
