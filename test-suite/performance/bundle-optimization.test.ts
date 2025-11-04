/**
 * Bundle Size Optimization Tests
 * Tests to verify that bundle splitting, lazy loading, and code splitting work effectively
 */

import { Test, TestingModule } from '@nestjs/testing';
import { BundleAnalyzerService } from '../utils/bundle-analyzer.service';
import { PerformanceMonitor } from '../utils/performance-monitor';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock build artifacts
interface MockBuildStats {
  chunks: Array<{
    name: string;
    size: number;
    modules: string[];
    imports: string[];
    exports: string[];
  }>;
  modules: Array<{
    name: string;
    size: number;
    chunks: number[];
  }>;
  totalSize: number;
  gzippedSize: number;
  assets: Array<{
    name: string;
    size: number;
    type: string;
  }>;
}

describe('Bundle Optimization Tests', () => {
  let bundleAnalyzer: BundleAnalyzerService;
  let performanceMonitor: PerformanceMonitor;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BundleAnalyzerService,
        PerformanceMonitor,
      ],
    }).compile();

    bundleAnalyzer = module.get<BundleAnalyzerService>(BundleAnalyzerService);
    performanceMonitor = module.get<PerformanceMonitor>(PerformanceMonitor);
  });

  describe('Code Splitting Verification', () => {
    it('should properly split vendor chunks', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Check for expected vendor chunks
      const vendorChunks = stats.chunks.filter(chunk => 
        chunk.name.includes('react') || 
        chunk.name.includes('vendor') ||
        chunk.name.includes('mui') ||
        chunk.name.includes('chakra')
      );

      expect(vendorChunks.length).toBeGreaterThan(0);
      
      // Vendor chunks should be reasonably sized
      vendorChunks.forEach(chunk => {
        expect(chunk.size).toBeLessThan(5 * 1024 * 1024); // Less than 5MB
      });
    });

    it('should separate Monaco Editor into own chunk', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      const monacoChunk = stats.chunks.find(chunk => 
        chunk.name.includes('monaco') || 
        chunk.modules.some(module => module.includes('monaco'))
      );

      expect(monacoChunk).toBeDefined();
      
      if (monacoChunk) {
        // Monaco should be in its own chunk due to lazy loading
        expect(monacoChunk.size).toBeGreaterThan(0);
        
        // Should not be in the main bundle
        const mainChunk = stats.chunks.find(chunk => chunk.name.includes('main') || chunk.name.includes('index'));
        if (mainChunk) {
          const monacoInMain = mainChunk.modules.some(module => module.includes('monaco'));
          expect(monacoInMain).toBe(false);
        }
      }
    });

    it('should separate workflow components', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      const workflowChunk = stats.chunks.find(chunk => 
        chunk.name.includes('workflow') || 
        chunk.modules.some(module => module.includes('reactflow'))
      );

      expect(workflowChunk).toBeDefined();
      
      if (workflowChunk) {
        // Workflow components should be lazy loaded
        expect(workflowChunk.size).toBeGreaterThan(0);
      }
    });

    it('should split Firebase and heavy dependencies', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      const firebaseChunk = stats.chunks.find(chunk => 
        chunk.name.includes('firebase') || 
        chunk.modules.some(module => 
          module.includes('firebase') || 
          module.includes('@firebase')
        )
      );

      expect(firebaseChunk).toBeDefined();
      
      if (firebaseChunk) {
        // Firebase should be in its own chunk
        expect(firebaseChunk.size).toBeGreaterThan(0);
      }
    });
  });

  describe('Lazy Loading Verification', () => {
    it('should implement React.lazy for heavy components', async () => {
      const lazyComponents = [
        'MonacoEditor',
        'WorkflowBuilder', 
        'AdvancedChart',
        'DataVisualization',
        'AdminPanel',
      ];

      for (const componentName of lazyComponents) {
        const isLazy = await bundleAnalyzer.isComponentLazyLoaded(componentName);
        expect(isLazy).toBe(true);
      }
    });

    it('should not lazy load critical components', async () => {
      const criticalComponents = [
        'App',
        'Router',
        'AuthProvider',
        'ThemeProvider',
        'Layout',
      ];

      for (const componentName of criticalComponents) {
        const isLazy = await bundleAnalyzer.isComponentLazyLoaded(componentName);
        expect(isLazy).toBe(false);
      }
    });

    it('should implement dynamic imports correctly', async () => {
      const dynamicImports = await bundleAnalyzer.getDynamicImports();
      
      expect(dynamicImports.length).toBeGreaterThan(0);
      
      // Verify dynamic imports are used for heavy components
      const expectedDynamicImports = [
        /monaco-editor/i,
        /workflow/i,
        /chart/i,
        /dashboard/i,
      ];

      const hasExpectedImports = expectedDynamicImports.some(pattern =>
        dynamicImports.some(importPath => pattern.test(importPath))
      );
      
      expect(hasExpectedImports).toBe(true);
    });
  });

  describe('Bundle Size Limits', () => {
    it('should respect initial bundle size limits', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Main bundle should be under 3MB
      const mainChunk = stats.chunks.find(chunk => 
        chunk.name.includes('main') || 
        chunk.name.includes('index') ||
        (!chunk.name.includes('vendor') && !chunk.name.includes('chunk'))
      );
      
      if (mainChunk) {
        expect(mainChunk.size).toBeLessThan(3 * 1024 * 1024); // 3MB
      }

      // Total initial load should be under 2MB gzipped
      const initialLoadChunks = stats.chunks.filter(chunk => 
        chunk.name.includes('main') || 
        chunk.name.includes('vendor') ||
        chunk.name.includes('react')
      );
      
      const totalInitialSize = initialLoadChunks.reduce((sum, chunk) => sum + chunk.size, 0);
      expect(totalInitialSize).toBeLessThan(2 * 1024 * 1024); // 2MB
    });

    it('should compress assets effectively', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Gzipped size should be significantly smaller
      const compressionRatio = stats.gzippedSize / stats.totalSize;
      expect(compressionRatio).toBeLessThan(0.5); // At least 50% compression
    });

    it('should limit chunk sizes for code splitting effectiveness', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Individual chunks should not be too large
      const largeChunks = stats.chunks.filter(chunk => chunk.size > 1024 * 1024); // > 1MB
      
      expect(largeChunks.length).toBeLessThan(3); // No more than 3 large chunks
    });
  });

  describe('Tree Shaking Verification', () => {
    it('should eliminate dead code', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Check that unused exports are not included
      stats.chunks.forEach(chunk => {
        chunk.modules.forEach(module => {
          // Unused helper functions should be tree-shaken
          if (module.includes('utils') || module.includes('helpers')) {
            expect(module).not.toMatch(/unused|dead|old/i);
          }
        });
      });
    });

    it('should properly tree-shake UI libraries', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Check for tree-shaken UI components
      const uiChunks = stats.chunks.filter(chunk => 
        chunk.name.includes('mui') || 
        chunk.name.includes('chakra') ||
        chunk.modules.some(module => 
          module.includes('@mui') || 
          module.includes('@chakra')
        )
      );
      
      uiChunks.forEach(chunk => {
        // Should not contain entire UI library if properly tree-shaken
        expect(chunk.size).toBeLessThan(2 * 1024 * 1024); // Less than 2MB
      });
    });

    it('should remove development-only code from production', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Check for dev-only modules in production build
      const devModules = stats.modules.filter(module => 
        module.name.includes('test') ||
        module.name.includes('debug') ||
        module.name.includes('dev') ||
        module.name.includes('mock')
      );
      
      expect(devModules.length).toBe(0);
    });
  });

  describe('Import Optimization', () => {
    it('should use named imports instead of barrel imports where possible', async () => {
      const importAnalysis = await bundleAnalyzer.getImportAnalysis();
      
      // Check for optimized named imports
      const hasNamedImports = importAnalysis.namedImports > importAnalysis.barrelImports;
      expect(hasNamedImports).toBe(true);
    });

    it('should avoid importing entire libraries when possible', async () => {
      const stats = await bundleAnalyzer.getBuildStats();
      
      // Check that heavy libraries are not imported in full
      stats.chunks.forEach(chunk => {
        chunk.modules.forEach(module => {
          // React should not be imported as entire library
          if (module.includes('react')) {
            expect(module).not.toMatch(/react\/index\.js$/);
          }
          
          // UI libraries should use specific components
          if (module.includes('@mui/material') && module.includes('index')) {
            expect(module).toMatch(/index\.js$/); // Allowed for MUI
          }
        });
      });
    });
  });

  describe('Performance Impact', () => {
    it('should load initial route quickly', async () => {
      const loadTime = await performanceMonitor.measureInitialLoad();
      
      // Initial load should be under 3 seconds
      expect(loadTime).toBeLessThan(3000);
    });

    it('should have fast route transitions', async () => {
      const routeTransitionTimes: number[] = [];
      
      const routes = ['/dashboard', '/agents', '/settings', '/analytics'];
      
      for (const route of routes) {
        const loadTime = await performanceMonitor.measureRouteLoad(route);
        routeTransitionTimes.push(loadTime);
      }
      
      // All route transitions should be under 500ms
      routeTransitionTimes.forEach(time => {
        expect(time).toBeLessThan(500);
      });
      
      // Average should be very fast
      const averageTime = routeTransitionTimes.reduce((sum, time) => sum + time, 0) / routeTransitionTimes.length;
      expect(averageTime).toBeLessThan(200);
    });

    it('should efficiently handle lazy-loaded components', async () => {
      const lazyLoadTimes: number[] = [];
      
      const lazyComponents = [
        'MonacoEditor',
        'WorkflowBuilder',
        'AdvancedChart',
      ];
      
      for (const component of lazyComponents) {
        const loadTime = await performanceMonitor.measureLazyComponentLoad(component);
        lazyLoadTimes.push(loadTime);
      }
      
      // Lazy-loaded components should load reasonably fast
      lazyLoadTimes.forEach(time => {
        expect(time).toBeLessThan(2000); // Under 2 seconds
      });
    });
  });

  describe('Bundle Analysis', () => {
    it('should provide detailed bundle analysis', async () => {
      const analysis = await bundleAnalyzer.generateBundleReport();
      
      expect(analysis).toBeDefined();
      expect(analysis.totalSize).toBeGreaterThan(0);
      expect(analysis.chunks).toBeDefined();
      expect(analysis.recommendations).toBeDefined();
      
      // Should include size recommendations
      expect(analysis.recommendations).toContain('bundle size');
    });

    it('should identify optimization opportunities', async () => {
      const analysis = await bundleAnalyzer.getOptimizationSuggestions();
      
      expect(analysis).toBeDefined();
      expect(Array.isArray(analysis)).toBe(true);
      
      // Should suggest optimizations if needed
      if (analysis.length > 0) {
        analysis.forEach(suggestion => {
          expect(suggestion).toHaveProperty('type');
          expect(suggestion).toHaveProperty('description');
          expect(suggestion).toHaveProperty('impact');
        });
      }
    });

    it('should track bundle size trends', async () => {
      const trend = await bundleAnalyzer.getBundleSizeTrend();
      
      expect(trend).toBeDefined();
      expect(trend.history).toBeDefined();
      expect(trend.history.length).toBeGreaterThan(0);
      
      // Should show whether bundle is growing or shrinking
      expect(trend.change).toBeDefined();
      expect(typeof trend.change).toBe('number');
    });
  });

  describe('Critical Path Optimization', () => {
    it('should prioritize critical resources', async () => {
      const criticalResources = await bundleAnalyzer.getCriticalResources();
      
      expect(criticalResources).toBeDefined();
      expect(criticalResources.length).toBeGreaterThan(0);
      
      // Critical CSS should be inlined
      const hasInlineCSS = criticalResources.some(resource => 
        resource.type === 'inline-css' && resource.critical
      );
      expect(hasInlineCSS).toBe(true);
      
      // Critical JS should be loaded first
      const hasCriticalJS = criticalResources.some(resource => 
        resource.type === 'script' && resource.critical
      );
      expect(hasCriticalJS).toBe(true);
    });

    it('should preload important chunks', async () => {
      const preloadAnalysis = await bundleAnalyzer.getPreloadAnalysis();
      
      expect(preloadAnalysis).toBeDefined();
      expect(preloadAnalysis.preloadedChunks).toBeDefined();
      
      // Important chunks should be preloaded
      const shouldBePreloaded = ['react', 'main', 'vendor'];
      shouldBePreloaded.forEach(chunkName => {
        const isPreloaded = preloadAnalysis.preloadedChunks.some(chunk => 
          chunk.name.includes(chunkName)
        );
        expect(isPreloaded).toBe(true);
      });
    });
  });

  describe('Memory Usage', () => {
    it('should manage bundle memory efficiently', async () => {
      const memoryUsage = await performanceMonitor.measureMemoryUsage();
      
      expect(memoryUsage).toBeDefined();
      expect(memoryUsage.heapUsed).toBeGreaterThan(0);
      expect(memoryUsage.heapTotal).toBeGreaterThan(memoryUsage.heapUsed);
      
      // Memory usage should be reasonable
      expect(memoryUsage.heapUsed).toBeLessThan(100 * 1024 * 1024); // Less than 100MB
    });

    it('should not cause memory leaks in component loading', async () => {
      const initialMemory = process.memoryUsage().heapUsed;
      
      // Simulate multiple component loads
      for (let i = 0; i < 50; i++) {
        await performanceMonitor.simulateComponentLoad('Chart');
        await performanceMonitor.simulateComponentLoad('Editor');
        await performanceMonitor.simulateComponentLoad('Dashboard');
      }
      
      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;
      
      // Memory increase should be minimal
      expect(memoryIncrease).toBeLessThan(20 * 1024 * 1024); // Less than 20MB increase
    });
  });

  describe('Browser Compatibility', () => {
    it('should work with modern bundling targets', async () => {
      const buildConfig = await bundleAnalyzer.getBuildConfiguration();
      
      expect(buildConfig).toBeDefined();
      expect(buildConfig.target).toBeDefined();
      expect(buildConfig.browserslist).toBeDefined();
      
      // Should target modern browsers
      const browsers = buildConfig.browserslist;
      expect(browsers).toContain('defaults');
      expect(browsers).toContain('not ie 11');
    });

    it('should use appropriate polyfills', async () => {
      const polyfillAnalysis = await bundleAnalyzer.getPolyfillAnalysis();
      
      expect(polyfillAnalysis).toBeDefined();
      expect(polyfillAnalysis.polyfills).toBeDefined();
      
      // Should not include unnecessary polyfills
      const coreJSModules = polyfillAnalysis.polyfills.filter(polyfill => 
        polyfill.includes('core-js') || 
        polyfill.includes('regenerator-runtime')
      );
      
      // Should be minimal for modern browsers
      expect(coreJSModules.length).toBeLessThan(10);
    });
  });

  describe('Build Optimization Summary', () => {
    it('should provide comprehensive optimization report', async () => {
      const report = await bundleAnalyzer.generateOptimizationReport();
      
      expect(report).toBeDefined();
      expect(report.summary).toBeDefined();
      expect(report.metrics).toBeDefined();
      expect(report.recommendations).toBeDefined();
      
      // Report should include key metrics
      expect(report.metrics.bundleSize).toBeDefined();
      expect(report.metrics.loadTime).toBeDefined();
      expect(report.metrics.compressionRatio).toBeDefined();
      
      // Should have actionable recommendations
      expect(report.recommendations.length).toBeGreaterThan(0);
    });

    it('should validate optimization targets are met', async () => {
      const validation = await bundleAnalyzer.validateOptimizationTargets();
      
      expect(validation).toBeDefined();
      expect(validation.passed).toBeDefined();
      expect(validation.targets).toBeDefined();
      
      // Most targets should be met
      const passedTargets = Object.values(validation.targets).filter(target => target.passed);
      expect(passedTargets.length / Object.keys(validation.targets).length).toBeGreaterThan(0.7);
    });
  });
});
