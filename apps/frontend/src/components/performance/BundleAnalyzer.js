var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect } from 'react';
import { performanceMonitor } from '../utils/performanceMonitor';
var BundleAnalyzer = function () {
    var _a, _b;
    var _c = useState(null), analysis = _c[0], setAnalysis = _c[1];
    var _d = useState(false), isAnalyzing = _d[0], setIsAnalyzing = _d[1];
    var _e = useState('all'), filterType = _e[0], setFilterType = _e[1];
    var _f = useState('size'), sortBy = _f[0], setSortBy = _f[1];
    // Mock bundle data for visualization
    var getBundleData = function () {
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
    var analyzeBundles = function () { return __awaiter(void 0, void 0, void 0, function () {
        var performanceData, bundleData, totalSize, totalGzipSize, heaviestChunks, loadingTimes, averageLoadTime, slowestLoading, fastestLoading, recommendations_1, totalSizeMB, totalGzipMB, analysis_1;
        return __generator(this, function (_a) {
            setIsAnalyzing(true);
            try {
                performanceData = performanceMonitor.generateReport();
                bundleData = getBundleData();
                totalSize = bundleData.reduce(function (sum, bundle) { return sum + bundle.size; }, 0);
                totalGzipSize = bundleData.reduce(function (sum, bundle) { return sum + (bundle.gzipSize || 0); }, 0);
                heaviestChunks = __spreadArray([], bundleData, true).sort(function (a, b) { return b.size - a.size; }).slice(0, 3);
                loadingTimes = bundleData.map(function (b) { return b.loadTime; }).filter(function (t) { return t > 0; });
                averageLoadTime = loadingTimes.length > 0
                    ? loadingTimes.reduce(function (sum, time) { return sum + time; }, 0) / loadingTimes.length
                    : 0;
                slowestLoading = bundleData.reduce(function (prev, current) {
                    return (prev.loadTime > current.loadTime) ? prev : current;
                }, bundleData[0]);
                fastestLoading = bundleData.reduce(function (prev, current) {
                    return (prev.loadTime < current.loadTime) ? prev : current;
                }, bundleData[0]);
                recommendations_1 = [];
                totalSizeMB = totalSize / 1024 / 1024;
                totalGzipMB = totalGzipSize / 1024 / 1024;
                if (totalSizeMB > 5) {
                    recommendations_1.push("Total bundle size is ".concat(totalSizeMB.toFixed(1), "MB. Consider further code splitting."));
                }
                if (totalGzipMB > 1) {
                    recommendations_1.push("Compressed size is ".concat(totalGzipMB.toFixed(1), "MB. Consider removing unused dependencies."));
                }
                heaviestChunks.forEach(function (chunk) {
                    if (chunk.size > 500 * 1024) {
                        recommendations_1.push("".concat(chunk.name, " is ").concat((chunk.size / 1024 / 1024).toFixed(1), "MB. Consider lazy loading or tree shaking."));
                    }
                });
                bundleData.forEach(function (chunk) {
                    if (chunk.loadingTime > 500) {
                        recommendations_1.push("".concat(chunk.name, " loads in ").concat(chunk.loadingTime, "ms. Consider preloading or reducing dependencies."));
                    }
                });
                analysis_1 = {
                    totalSize: totalSize,
                    totalGzipSize: totalGzipSize,
                    chunks: bundleData,
                    recommendations: recommendations_1,
                    heaviestChunks: heaviestChunks,
                    loadingPerformance: {
                        averageLoadTime: averageLoadTime,
                        slowestLoading: slowestLoading,
                        fastestLoading: fastestLoading,
                    },
                };
                setAnalysis(analysis_1);
            }
            catch (error) {
                console.error('Bundle analysis failed:', error);
            }
            finally {
                setIsAnalyzing(false);
            }
            return [2 /*return*/];
        });
    }); };
    // Filter and sort chunks
    var getFilteredAndSortedChunks = function () {
        if (!analysis)
            return [];
        var chunks = analysis.chunks;
        if (filterType !== 'all') {
            chunks = chunks.filter(function (chunk) { return chunk.chunkType === filterType; });
        }
        return __spreadArray([], chunks, true).sort(function (a, b) {
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
    useEffect(function () {
        if (typeof window !== 'undefined') {
            analyzeBundles();
        }
    }, []);
    var formatBytes = function (bytes) {
        if (bytes === 0)
            return '0 Bytes';
        var k = 1024;
        var sizes = ['Bytes', 'KB', 'MB', 'GB'];
        var i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    var formatTime = function (ms) {
        if (ms < 1000)
            return "".concat(ms.toFixed(0), "ms");
        return "".concat((ms / 1000).toFixed(2), "s");
    };
    if (isAnalyzing) {
        return (_jsxs("div", { className: "p-8 text-center", children: [_jsx("div", { className: "inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" }), _jsx("p", { className: "mt-4 text-gray-600", children: "Analyzing bundle sizes..." })] }));
    }
    if (!analysis) {
        return (_jsxs("div", { className: "p-8 text-center", children: [_jsx("p", { className: "text-gray-600 mb-4", children: "No bundle analysis data available." }), _jsx("button", { onClick: analyzeBundles, className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: "Start Analysis" })] }));
    }
    return (_jsxs("div", { className: "max-w-6xl mx-auto p-6", children: [_jsxs("div", { className: "mb-8", children: [_jsx("h1", { className: "text-3xl font-bold mb-2", children: "Bundle Analysis" }), _jsx("p", { className: "text-gray-600", children: "Performance insights and optimization recommendations" })] }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8", children: [_jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Total Size" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatBytes(analysis.totalSize) }), _jsxs("p", { className: "text-sm text-gray-500", children: [formatBytes(analysis.totalGzipSize), " gzipped"] })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Average Load Time" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: formatTime(analysis.loadingPerformance.averageLoadTime) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Slowest Loading" }), _jsx("p", { className: "text-lg font-bold text-gray-900", children: (_a = analysis.loadingPerformance.slowestLoading) === null || _a === void 0 ? void 0 : _a.name }), _jsx("p", { className: "text-sm text-gray-500", children: formatTime(((_b = analysis.loadingPerformance.slowestLoading) === null || _b === void 0 ? void 0 : _b.loadingTime) || 0) })] }), _jsxs("div", { className: "bg-white p-6 rounded-lg shadow border", children: [_jsx("h3", { className: "text-sm font-medium text-gray-500 mb-2", children: "Total Chunks" }), _jsx("p", { className: "text-2xl font-bold text-gray-900", children: analysis.chunks.length }), _jsx("p", { className: "text-sm text-gray-500", children: "Code split bundles" })] })] }), analysis.recommendations.length > 0 && (_jsxs("div", { className: "bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8", children: [_jsx("h3", { className: "text-lg font-semibold text-yellow-800 mb-4", children: "\uD83D\uDCA1 Recommendations" }), _jsx("ul", { className: "space-y-2", children: analysis.recommendations.map(function (rec, index) { return (_jsxs("li", { className: "text-yellow-700", children: ["\u2022 ", rec] }, index)); }) })] })), _jsx("div", { className: "bg-white rounded-lg shadow border p-6 mb-6", children: _jsxs("div", { className: "flex flex-wrap gap-4 items-center", children: [_jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Filter by Type" }), _jsxs("select", { value: filterType, onChange: function (e) { return setFilterType(e.target.value); }, className: "border border-gray-300 rounded px-3 py-1", children: [_jsx("option", { value: "all", children: "All Types" }), _jsx("option", { value: "vendor", children: "Vendor" }), _jsx("option", { value: "route", children: "Route" }), _jsx("option", { value: "component", children: "Component" }), _jsx("option", { value: "utility", children: "Utility" })] })] }), _jsxs("div", { children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-1", children: "Sort by" }), _jsxs("select", { value: sortBy, onChange: function (e) { return setSortBy(e.target.value); }, className: "border border-gray-300 rounded px-3 py-1", children: [_jsx("option", { value: "size", children: "Size" }), _jsx("option", { value: "loadTime", children: "Load Time" }), _jsx("option", { value: "name", children: "Name" })] })] }), _jsx("button", { onClick: analyzeBundles, className: "px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700", children: "Refresh Analysis" })] }) }), _jsxs("div", { className: "bg-white rounded-lg shadow border overflow-hidden", children: [_jsx("div", { className: "px-6 py-4 border-b border-gray-200", children: _jsx("h3", { className: "text-lg font-semibold", children: "Bundle Details" }) }), _jsx("div", { className: "overflow-x-auto", children: _jsxs("table", { className: "min-w-full divide-y divide-gray-200", children: [_jsx("thead", { className: "bg-gray-50", children: _jsxs("tr", { children: [_jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Bundle Name" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Type" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Size" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Gzipped" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Load Time" }), _jsx("th", { className: "px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider", children: "Dependencies" })] }) }), _jsx("tbody", { className: "bg-white divide-y divide-gray-200", children: getFilteredAndSortedChunks().map(function (chunk, index) { return (_jsxs("tr", { className: index % 2 === 0 ? 'bg-white' : 'bg-gray-50', children: [_jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("div", { className: "text-sm font-medium text-gray-900", children: chunk.name }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap", children: _jsx("span", { className: "inline-flex px-2 py-1 text-xs font-semibold rounded-full ".concat(chunk.chunkType === 'vendor' ? 'bg-purple-100 text-purple-800' :
                                                        chunk.chunkType === 'route' ? 'bg-blue-100 text-blue-800' :
                                                            chunk.chunkType === 'component' ? 'bg-green-100 text-green-800' :
                                                                'bg-gray-100 text-gray-800'), children: chunk.chunkType }) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatBytes(chunk.size) }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: chunk.gzipSize ? formatBytes(chunk.gzipSize) : 'N/A' }), _jsx("td", { className: "px-6 py-4 whitespace-nowrap text-sm text-gray-900", children: formatTime(chunk.loadingTime) }), _jsxs("td", { className: "px-6 py-4 text-sm text-gray-500", children: [chunk.dependencies.slice(0, 2).join(', '), chunk.dependencies.length > 2 && " +".concat(chunk.dependencies.length - 2, " more")] })] }, index)); }) })] }) })] })] }));
};
export default BundleAnalyzer;
