import React from 'react';
declare const AdvancedLoadingFallback: ({ name, height, showProgress }: {
    name: string;
    height?: string;
    showProgress?: boolean;
}) => import("react/jsx-runtime").JSX.Element;
declare const withLazyLoading: <P extends object>(importFunc: () => Promise<{
    default: React.ComponentType<P>;
}>, fallbackName: string, showProgress?: boolean) => React.LazyExoticComponent<React.ComponentType<P>>;
declare const ConditionalLazyComponent: <P extends object>({ importFunc, fallbackName, condition, showProgress, ...props }: {
    importFunc: () => Promise<{
        default: React.ComponentType<P>;
    }>;
    fallbackName: string;
    condition: boolean;
    showProgress?: boolean;
    [key: string]: any;
}) => import("react/jsx-runtime").JSX.Element | null;
declare const preloadCriticalComponent: (importFunc: () => Promise<any>) => void;
declare const AdvancedLazyComponent: <P extends object>({ importFunc, fallbackName, errorFallback, showProgress, onLoad, ...props }: {
    importFunc: () => Promise<{
        default: React.ComponentType<P>;
    }>;
    fallbackName: string;
    errorFallback?: React.ComponentType<{
        error: Error;
    }>;
    showProgress?: boolean;
    onLoad?: () => void;
    [key: string]: any;
}) => import("react/jsx-runtime").JSX.Element;
export { AdvancedLazyComponent as Lazy, withLazyLoading, ConditionalLazyComponent, AdvancedLoadingFallback, preloadCriticalComponent, };
