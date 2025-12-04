interface ImportOptions {
    timeout?: number;
    retries?: number;
    retryDelay?: number;
    onError?: (error: Error) => void;
    preload?: boolean;
}
interface ComponentModule {
    default: React.ComponentType<any>;
    [key: string]: any;
}
declare class DynamicImportManager {
    private importCache;
    private loadedModules;
    private preloadQueue;
    dynamicImport<T extends ComponentModule>(importFn: () => Promise<T>, moduleId: string, options?: ImportOptions): Promise<T>;
    private executeWithRetry;
    preloadModule(importFn: () => Promise<ComponentModule>, moduleId: string): void;
    preloadModules(imports: Array<{
        fn: () => Promise<ComponentModule>;
        id: string;
    }>): Promise<void>;
    getImportStats(): {
        cached: number;
        loaded: number;
        queued: number;
    };
    clearCache(): void;
}
declare const dynamicImportManager: DynamicImportManager;
export declare const useDynamicImport: () => {
    importComponent: <T extends ComponentModule>(importFn: () => Promise<T>, componentId: string, options?: ImportOptions) => Promise<T | null>;
    preloadComponent: (importFn: () => Promise<ComponentModule>, componentId: string) => void;
    loadingStates: Record<string, boolean>;
    errorStates: Record<string, Error | null>;
    isLoading: (componentId: string) => boolean;
    hasError: (componentId: string) => boolean;
    error: (componentId: string) => Error | null;
};
export declare const withDynamicImport: <P extends object>(importFn: () => Promise<ComponentModule>, componentId: string, options?: ImportOptions) => import("react").LazyExoticComponent<import("react").ComponentType<any>>;
export declare const ConditionalImport: <P extends object>({ importFn, componentId, condition, fallback, options, ...props }: {
    importFn: () => Promise<ComponentModule>;
    componentId: string;
    condition: boolean;
    fallback?: React.ReactNode;
    options?: ImportOptions;
    [key: string]: any;
}) => import("react").FunctionComponentElement<import("react").FragmentProps> | import("react").FunctionComponentElement<import("react").SuspenseProps> | null;
export declare const preloadCriticalComponents: () => void;
export declare const analyzeImportImpact: (importFn: () => Promise<ComponentModule>) => Promise<{
    loadTime: number;
    memoryImpact: number;
    module: ComponentModule;
}>;
export { dynamicImportManager };
export default dynamicImportManager;
