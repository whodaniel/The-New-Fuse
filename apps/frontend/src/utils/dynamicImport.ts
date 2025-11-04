// Dynamic import utilities for code splitting and lazy loading

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

class DynamicImportManager {
  private importCache = new Map<string, Promise<ComponentModule>>();
  private loadedModules = new Set<string>();
  private preloadQueue: (() => Promise<ComponentModule>)[] = [];

  // Enhanced dynamic import with error handling and caching
  async dynamicImport<T extends ComponentModule>(
    importFn: () => Promise<T>,
    moduleId: string,
    options: ImportOptions = {}
  ): Promise<T> {
    const { 
      timeout = 10000, 
      retries = 3, 
      retryDelay = 1000, 
      onError,
      preload = false 
    } = options;

    // Return cached promise if available
    if (this.importCache.has(moduleId)) {
      return this.importCache.get(moduleId)! as Promise<T>;
    }

    const importPromise = this.executeWithRetry(importFn, retries, retryDelay, onError, timeout);
    this.importCache.set(moduleId, importPromise);

    try {
      const module = await importPromise;
      this.loadedModules.add(moduleId);
      return module;
    } catch (error) {
      this.importCache.delete(moduleId);
      throw error;
    }
  }

  private async executeWithRetry<T extends ComponentModule>(
    importFn: () => Promise<T>,
    retries: number,
    retryDelay: number,
    onError?: (error: Error) => void,
    timeout = 10000
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        // Add timeout wrapper
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error(`Import timeout after ${timeout}ms`)), timeout);
        });

        const importPromise = importFn();
        const result = await Promise.race([importPromise, timeoutPromise]);
        
        return result;
      } catch (error) {
        lastError = error as Error;
        console.warn(`Import attempt ${attempt + 1} failed:`, error);
        
        if (onError) {
          onError(lastError);
        }

        if (attempt < retries) {
          await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
        }
      }
    }

    throw new Error(`Failed to import after ${retries + 1} attempts: ${lastError?.message}`);
  }

  // Preload modules in background
  preloadModule(importFn: () => Promise<ComponentModule>, moduleId: string): void {
    // Add to preloading queue
    this.preloadQueue.push(() => this.dynamicImport(importFn, `preload_${moduleId}`));
    
    // Execute preloading with lower priority
    setTimeout(() => {
      this.dynamicImport(importFn, `preload_${moduleId}`).catch(console.warn);
    }, 0);
  }

  // Preload multiple modules
  async preloadModules(imports: Array<{ fn: () => Promise<ComponentModule>; id: string }>): Promise<void> {
    const preloadPromises = imports.map(({ fn, id }) => 
      this.preloadModule(fn, id)
    );
    
    // Execute preloading concurrently but with lower priority
    await Promise.allSettled(preloadPromises);
  }

  // Get import statistics
  getImportStats() {
    return {
      cached: this.importCache.size,
      loaded: this.loadedModules.size,
      queued: this.preloadQueue.length,
    };
  }

  // Clear cache (useful for development)
  clearCache(): void {
    this.importCache.clear();
    this.loadedModules.clear();
    this.preloadQueue = [];
  }
}

// Create global instance
const dynamicImportManager = new DynamicImportManager();

// Predefined component imports for better organization
const ComponentImports = {
  // UI Components
  ui: {
    Button: () => import('../components/ui/button'),
    Card: () => import('../components/ui/card'),
    Modal: () => import('../components/ui/modal'),
    Table: () => import('../components/ui/table'),
    Form: () => import('../components/ui/form'),
  },

  // Page Components (legacy support for old router)
  pages: {
    Home: () => import('../pages/Home'),
    Dashboard: () => import('../pages/dashboard/index'),
    Login: () => import('../pages/auth/Login'),
    Register: () => import('../pages/auth/Register'),
    NotFound: () => import('../pages/NotFound'),
  },

  // Feature Components
  features: {
    MultiAgentChat: () => import('../components/MultiAgentChat'),
    WorkflowBuilder: () => import('../components/WorkflowBuilder'),
    AgentCreationStudio: () => import('../components/AgentCreationStudio'),
    Analytics: () => import('../components/Analytics'),
    AdminPanel: () => import('../components/AdminPanel/AdminPanel'),
  },

  // Heavy dependencies
  dependencies: {
    MonacoEditor: () => import('@monaco-editor/react'),
    ReactFlow: () => import('reactflow'),
    Recharts: () => import('recharts'),
    D3: () => import('d3'),
    Firebase: () => import('firebase'),
  },
};

// Hook for dynamic imports in React components
export const useDynamicImport = () => {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({});
  const [errorStates, setErrorStates] = React.useState<Record<string, Error | null>>({});

  const importComponent = React.useCallback(async <T extends ComponentModule>(
    importFn: () => Promise<T>,
    componentId: string,
    options: ImportOptions = {}
  ): Promise<T | null> => {
    setLoadingStates(prev => ({ ...prev, [componentId]: true }));
    setErrorStates(prev => ({ ...prev, [componentId]: null }));

    try {
      const component = await dynamicImportManager.dynamicImport(importFn, componentId, options);
      return component;
    } catch (error) {
      const errorObj = error as Error;
      setErrorStates(prev => ({ ...prev, [componentId]: errorObj }));
      console.error(`Failed to import component ${componentId}:`, errorObj);
      return null;
    } finally {
      setLoadingStates(prev => ({ ...prev, [componentId]: false }));
    }
  }, []);

  const preloadComponent = React.useCallback((
    importFn: () => Promise<ComponentModule>,
    componentId: string
  ) => {
    dynamicImportManager.preloadModule(importFn, componentId);
  }, []);

  return {
    importComponent,
    preloadComponent,
    loadingStates,
    errorStates,
    isLoading: (componentId: string) => loadingStates[componentId] || false,
    hasError: (componentId: string) => !!errorStates[componentId],
    error: (componentId: string) => errorStates[componentId],
  };
};

// Higher-order component for lazy loading with dynamic import
export const withDynamicImport = <P extends object>(
  importFn: () => Promise<ComponentModule>,
  componentId: string,
  options: ImportOptions = {}
) => {
  return React.lazy(async () => {
    try {
      const module = await dynamicImportManager.dynamicImport(importFn, componentId, options);
      return module;
    } catch (error) {
      console.error(`Failed to load component ${componentId}:`, error);
      // Return a fallback component
      return { 
        default: () => React.createElement('div', { 
          className: 'p-4 text-center text-red-600' 
        }, `Failed to load ${componentId}`) 
      };
    }
  });
};

// Component for conditional imports
export const ConditionalImport = <P extends object>({
  importFn,
  componentId,
  condition,
  fallback = null,
  options = {},
  ...props
}: {
  importFn: () => Promise<ComponentModule>;
  componentId: string;
  condition: boolean;
  fallback?: React.ReactNode;
  options?: ImportOptions;
  [key: string]: any;
}) => {
  const LazyComponent = React.useMemo(() => 
    withDynamicImport(importFn, componentId, options), 
    [importFn, componentId, options]
  );

  if (!condition) {
    return fallback ? React.createElement(React.Fragment, null, fallback) : null;
  }

  return React.createElement(
    React.Suspense,
    { 
      fallback: React.createElement('div', { 
        className: 'p-4 text-center' 
      }, `Loading ${componentId}...`) 
    },
    React.createElement(LazyComponent, props)
  );
};

// Utility function to preload critical components
export const preloadCriticalComponents = () => {
  const criticalImports = [
    { fn: ComponentImports.pages.Home, id: 'home' },
    { fn: ComponentImports.pages.Dashboard, id: 'dashboard' },
    { fn: ComponentImports.features.MultiAgentChat, id: 'multi-agent-chat' },
  ];

  dynamicImportManager.preloadModules(criticalImports);
};

// Utility function to analyze bundle size impact
export const analyzeImportImpact = async (importFn: () => Promise<ComponentModule>) => {
  const startTime = performance.now();
  const startMemory = (performance as any).memory?.usedJSHeapSize || 0;

  try {
    const module = await importFn();
    const endTime = performance.now();
    const endMemory = (performance as any).memory?.usedJSHeapSize || 0;

    const loadTime = endTime - startTime;
    const memoryImpact = endMemory - startMemory;

    console.log(`Import Analysis:
      Component: ${module.default?.name || 'Unknown'}
      Load Time: ${loadTime.toFixed(2)}ms
      Memory Impact: ${(memoryImpact / 1024 / 1024).toFixed(2)}MB
      Bundle Size: ${(module.default?.bundleSize || 'Unknown')}
    `);

    return { loadTime, memoryImpact, module };
  } catch (error) {
    console.error('Import analysis failed:', error);
    throw error;
  }
};

// Export manager for advanced usage
export { dynamicImportManager };
export default dynamicImportManager;