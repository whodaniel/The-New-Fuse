import React, { useState, useEffect } from 'react';
import { dynamicImportManager } from '../utils/dynamicImport';
import { performanceMonitor } from '../utils/performanceMonitor';

interface BundleInfo {
  name: string;
  size: number;
  gzipSize?: number;
  loadingTime: number;
  chunkType: 'route' | 'component' | 'vendor' | 'utility';
  dependencies: string[];
  lastLoaded: number;
}

interface BundleAnalysis {
  totalSize: number;
  totalGzipSize: number;
  chunks: BundleInfo[];
  recommendations: string[];
  heaviestChunks: BundleInfo[];
  loadingPerformance: {
    averageLoadTime: number;
    slowestLoading: BundleInfo | null;
    fastestLoading: BundleInfo | null;
  };
}

const BundleAnalyzer: React.FC = () => {
  const [analysis, setAnalysis] = useState<BundleAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [filterType, setFilterType] = useState<BundleInfo['chunkType'] | 'all'>('all');
  const [sortBy, setSortBy] = useState<'size' | 'loadTime' | 'name'>('size');

  // Mock bundle data for visualization
  const getBundleData = (): BundleInfo[] => {
    // This would normally come from webpack stats
    return [
      {
        name: 'react-vendor.js',
        size: 245 * 1024,
        gzipSize: 78 * 1024,
        loadingTime: 150,
        chunkType: 'vendor',
        dependencies: ['react', 'react-dom', 'react-router-dom'],
        lastLoaded: Date.now() - 1000,
      },
      {
        name: 'monaco-editor.js',
        size: 1800 * 1024,
        gzipSize: 520 * 1024,
        loadingTime: 1200,
        chunkType: 'component',
        dependencies: ['@monaco-editor/react', 'monaco-editor'],
        lastLoaded: Date.now() - 5000,
      },
      {
        name: 'dashboard-page.js',
        size: 125 * 1024,
        gzipSize: 38 * 1024,
        loadingTime: 95,
        chunkType: 'route',
        dependencies: ['@chakra-ui/react', 'recharts'],
        lastLoaded: Date.now() - 2000,
      },
      {
        name: 'workflow-builder.js',
        size: 850 * 1024,
        gzipSize: 240 * 1024,
        loadingTime: 450,
        chunkType: 'component',
        dependencies: ['reactflow', 'd3', '@reactflow/node-resizer'],
        lastLoaded: Date.now() - 3000,
      },
      {
        name: 'firebase-chunk.js',
        size: 320 * 1024,
        gzipSize: 98 * 1024,
        loadingTime: 200,
        chunkType: 'vendor',
        dependencies: ['firebase', '@firebase/app', '@firebase/auth'],
        lastLoaded: Date.now() - 4000,
      },
      {
        name: 'charts-chunk.js',
        size: 95 * 1024,
        gzipSize: 28 * 1024,
        loadingTime: 65,
        chunkType: 'utility',
        dependencies: ['recharts', 'd3'],
        lastLoaded: Date.now() - 6000,
      },
    ];
  };

  // Analyze bundles
  const analyzeBundles = async () => {
    setIsAnalyzing(true);
    
    try {
      // Get current performance data
      const performanceData = performanceMonitor.generateReport();
      const bundleData = getBundleData();
      
      // Calculate totals
      const totalSize = bundleData.reduce((sum, bundle) => sum + bundle.size, 0);
      const totalGzipSize = bundleData.reduce((sum, bundle) => sum + (bundle.gzipSize || 0), 0);
      
      // Find heaviest and fastest/slowest loading
      const heaviestChunks = [...bundleData].sort((a, b) => b.size - a.size).slice(0, 3);
      const loadingTimes = bundleData.map(b => b.loadTime).filter(t => t > 0);
      const averageLoadTime = loadingTimes.length > 0 
        ? loadingTimes.reduce((sum, time) => sum + time, 0) / loadingTimes.length 
        : 0;
      const slowestLoading = bundleData.reduce((prev, current) => 
        (prev.loadTime > current.loadTime) ? prev : current, bundleData[0]
      );
      const fastestLoading = bundleData.reduce((prev, current) => 
        (prev.loadTime < current.loadTime) ? prev : current, bundleData[0]
      );

      // Generate recommendations
      const recommendations: string[] = [];
      const totalSizeMB = totalSize / 1024 / 1024;
      const totalGzipMB = totalGzipSize / 1024 / 1024;

      if (totalSizeMB > 5) {
        recommendations.push(`Total bundle size is ${totalSizeMB.toFixed(1)}MB. Consider further code splitting.`);
      }

      if (totalGzipMB > 1) {
        recommendations.push(`Compressed size is ${totalGzipMB.toFixed(1)}MB. Consider removing unused dependencies.`);
      }

      heaviestChunks.forEach(chunk => {
        if (chunk.size > 500 * 1024) {
          recommendations.push(`${chunk.name} is ${(chunk.size / 1024 / 1024).toFixed(1)}MB. Consider lazy loading or tree shaking.`);
        }
      });

      bundleData.forEach(chunk => {
        if (chunk.loadingTime > 500) {
          recommendations.push(`${chunk.name} loads in ${chunk.loadingTime}ms. Consider preloading or reducing dependencies.`);
        }
      });

      const analysis: BundleAnalysis = {
        totalSize,
        totalGzipSize,
        chunks: bundleData,
        recommendations,
        heaviestChunks,
        loadingPerformance: {
          averageLoadTime,
          slowestLoading,
          fastestLoading,
        },
      };

      setAnalysis(analysis);
    } catch (error) {
      console.error('Bundle analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Filter and sort chunks
  const getFilteredAndSortedChunks = () => {
    if (!analysis) return [];
    
    let chunks = analysis.chunks;
    
    if (filterType !== 'all') {
      chunks = chunks.filter(chunk => chunk.chunkType === filterType);
    }
    
    return [...chunks].sort((a, b) => {
      switch (sortBy) {
        case 'size':
          return b.size - a.size;
        case 'loadTime':
          return b.loadingTime - a.loadingTime;
        case 'name':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      analyzeBundles();
    }
  }, []);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatTime = (ms: number) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  if (isAnalyzing) {
    return (
      <div className="p-8 text-center">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-gray-600">Analyzing bundle sizes...</p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-600 mb-4">No bundle analysis data available.</p>
        <button
          onClick={analyzeBundles}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Start Analysis
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bundle Analysis</h1>
        <p className="text-gray-600">Performance insights and optimization recommendations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Size</h3>
          <p className="text-2xl font-bold text-gray-900">{formatBytes(analysis.totalSize)}</p>
          <p className="text-sm text-gray-500">{formatBytes(analysis.totalGzipSize)} gzipped</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average Load Time</h3>
          <p className="text-2xl font-bold text-gray-900">
            {formatTime(analysis.loadingPerformance.averageLoadTime)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Slowest Loading</h3>
          <p className="text-lg font-bold text-gray-900">
            {analysis.loadingPerformance.slowestLoading?.name}
          </p>
          <p className="text-sm text-gray-500">
            {formatTime(analysis.loadingPerformance.slowestLoading?.loadingTime || 0)}
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow border">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Chunks</h3>
          <p className="text-2xl font-bold text-gray-900">{analysis.chunks.length}</p>
          <p className="text-sm text-gray-500">Code split bundles</p>
        </div>
      </div>

      {/* Recommendations */}
      {analysis.recommendations.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-yellow-800 mb-4">💡 Recommendations</h3>
          <ul className="space-y-2">
            {analysis.recommendations.map((rec, index) => (
              <li key={index} className="text-yellow-700">• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Filters and Controls */}
      <div className="bg-white rounded-lg shadow border p-6 mb-6">
        <div className="flex flex-wrap gap-4 items-center">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="all">All Types</option>
              <option value="vendor">Vendor</option>
              <option value="route">Route</option>
              <option value="component">Component</option>
              <option value="utility">Utility</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sort by</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="border border-gray-300 rounded px-3 py-1"
            >
              <option value="size">Size</option>
              <option value="loadTime">Load Time</option>
              <option value="name">Name</option>
            </select>
          </div>
          
          <button
            onClick={analyzeBundles}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Refresh Analysis
          </button>
        </div>
      </div>

      {/* Bundle Details Table */}
      <div className="bg-white rounded-lg shadow border overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold">Bundle Details</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Bundle Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Gzipped
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Load Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dependencies
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {getFilteredAndSortedChunks().map((chunk, index) => (
                <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{chunk.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      chunk.chunkType === 'vendor' ? 'bg-purple-100 text-purple-800' :
                      chunk.chunkType === 'route' ? 'bg-blue-100 text-blue-800' :
                      chunk.chunkType === 'component' ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {chunk.chunkType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatBytes(chunk.size)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {chunk.gzipSize ? formatBytes(chunk.gzipSize) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTime(chunk.loadingTime)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {chunk.dependencies.slice(0, 2).join(', ')}
                    {chunk.dependencies.length > 2 && ` +${chunk.dependencies.length - 2} more`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BundleAnalyzer;