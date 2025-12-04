// Dynamic import utilities for code splitting and lazy loading
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
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
var DynamicImportManager = /** @class */ (function () {
    function DynamicImportManager() {
        this.importCache = new Map();
        this.loadedModules = new Set();
        this.preloadQueue = [];
    }
    // Enhanced dynamic import with error handling and caching
    DynamicImportManager.prototype.dynamicImport = function (importFn_1, moduleId_1) {
        return __awaiter(this, arguments, void 0, function (importFn, moduleId, options) {
            var _a, timeout, _b, retries, _c, retryDelay, onError, _d, preload, importPromise, module_1, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        _a = options.timeout, timeout = _a === void 0 ? 10000 : _a, _b = options.retries, retries = _b === void 0 ? 3 : _b, _c = options.retryDelay, retryDelay = _c === void 0 ? 1000 : _c, onError = options.onError, _d = options.preload, preload = _d === void 0 ? false : _d;
                        // Return cached promise if available
                        if (this.importCache.has(moduleId)) {
                            return [2 /*return*/, this.importCache.get(moduleId)];
                        }
                        importPromise = this.executeWithRetry(importFn, retries, retryDelay, onError, timeout);
                        this.importCache.set(moduleId, importPromise);
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, importPromise];
                    case 2:
                        module_1 = _e.sent();
                        this.loadedModules.add(moduleId);
                        return [2 /*return*/, module_1];
                    case 3:
                        error_1 = _e.sent();
                        this.importCache.delete(moduleId);
                        throw error_1;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DynamicImportManager.prototype.executeWithRetry = function (importFn_1, retries_1, retryDelay_1, onError_1) {
        return __awaiter(this, arguments, void 0, function (importFn, retries, retryDelay, onError, timeout) {
            var lastError, _loop_1, attempt, state_1;
            if (timeout === void 0) { timeout = 10000; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var timeoutPromise, importPromise, result, error_2;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 5]);
                                        timeoutPromise = new Promise(function (_, reject) {
                                            setTimeout(function () { return reject(new Error("Import timeout after ".concat(timeout, "ms"))); }, timeout);
                                        });
                                        importPromise = importFn();
                                        return [4 /*yield*/, Promise.race([importPromise, timeoutPromise])];
                                    case 1:
                                        result = _b.sent();
                                        return [2 /*return*/, { value: result }];
                                    case 2:
                                        error_2 = _b.sent();
                                        lastError = error_2;
                                        console.warn("Import attempt ".concat(attempt + 1, " failed:"), error_2);
                                        if (onError) {
                                            onError(lastError);
                                        }
                                        if (!(attempt < retries)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, retryDelay * (attempt + 1)); })];
                                    case 3:
                                        _b.sent();
                                        _b.label = 4;
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 0;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= retries)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw new Error("Failed to import after ".concat(retries + 1, " attempts: ").concat(lastError === null || lastError === void 0 ? void 0 : lastError.message));
                }
            });
        });
    };
    // Preload modules in background
    DynamicImportManager.prototype.preloadModule = function (importFn, moduleId) {
        var _this = this;
        // Add to preloading queue
        this.preloadQueue.push(function () { return _this.dynamicImport(importFn, "preload_".concat(moduleId)); });
        // Execute preloading with lower priority
        setTimeout(function () {
            _this.dynamicImport(importFn, "preload_".concat(moduleId)).catch(console.warn);
        }, 0);
    };
    // Preload multiple modules
    DynamicImportManager.prototype.preloadModules = function (imports) {
        return __awaiter(this, void 0, void 0, function () {
            var preloadPromises;
            var _this = this;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        preloadPromises = imports.map(function (_a) {
                            var fn = _a.fn, id = _a.id;
                            return _this.preloadModule(fn, id);
                        });
                        // Execute preloading concurrently but with lower priority
                        return [4 /*yield*/, Promise.allSettled(preloadPromises)];
                    case 1:
                        // Execute preloading concurrently but with lower priority
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    // Get import statistics
    DynamicImportManager.prototype.getImportStats = function () {
        return {
            cached: this.importCache.size,
            loaded: this.loadedModules.size,
            queued: this.preloadQueue.length,
        };
    };
    // Clear cache (useful for development)
    DynamicImportManager.prototype.clearCache = function () {
        this.importCache.clear();
        this.loadedModules.clear();
        this.preloadQueue = [];
    };
    return DynamicImportManager;
}());
// Create global instance
var dynamicImportManager = new DynamicImportManager();
// Predefined component imports for better organization
var ComponentImports = {
    // UI Components
    ui: {
        Button: function () { return import('../components/ui/button'); },
        Card: function () { return import('../components/ui/card'); },
        Modal: function () { return import('../components/ui/modal'); },
        Table: function () { return import('../components/ui/table'); },
        Form: function () { return import('../components/ui/form'); },
    },
    // Page Components (legacy support for old router)
    pages: {
        Home: function () { return import('../pages/Home'); },
        Dashboard: function () { return import('../pages/dashboard/index'); },
        Login: function () { return import('../pages/auth/Login'); },
        Register: function () { return import('../pages/auth/Register'); },
        NotFound: function () { return import('../pages/NotFound'); },
    },
    // Feature Components
    features: {
        MultiAgentChat: function () { return import('../components/MultiAgentChat'); },
        WorkflowBuilder: function () { return import('../components/WorkflowBuilder'); },
        AgentCreationStudio: function () { return import('../components/AgentCreationStudio'); },
        Analytics: function () { return import('../components/Analytics'); },
        AdminPanel: function () { return import('../components/AdminPanel/AdminPanel'); },
    },
    // Heavy dependencies
    dependencies: {
        MonacoEditor: function () { return import('@monaco-editor/react'); },
        ReactFlow: function () { return import('reactflow'); },
        Recharts: function () { return import('recharts'); },
        D3: function () { return import('d3'); },
        Firebase: function () { return import('firebase'); },
    },
};
// Hook for dynamic imports in React components
export var useDynamicImport = function () {
    var _a = React.useState({}), loadingStates = _a[0], setLoadingStates = _a[1];
    var _b = React.useState({}), errorStates = _b[0], setErrorStates = _b[1];
    var importComponent = React.useCallback(function (importFn_1, componentId_1) {
        var args_1 = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            args_1[_i - 2] = arguments[_i];
        }
        return __awaiter(void 0, __spreadArray([importFn_1, componentId_1], args_1, true), void 0, function (importFn, componentId, options) {
            var component, error_3, errorObj_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        setLoadingStates(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[componentId] = true, _a)));
                        });
                        setErrorStates(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[componentId] = null, _a)));
                        });
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, dynamicImportManager.dynamicImport(importFn, componentId, options)];
                    case 2:
                        component = _a.sent();
                        return [2 /*return*/, component];
                    case 3:
                        error_3 = _a.sent();
                        errorObj_1 = error_3;
                        setErrorStates(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[componentId] = errorObj_1, _a)));
                        });
                        console.error("Failed to import component ".concat(componentId, ":"), errorObj_1);
                        return [2 /*return*/, null];
                    case 4:
                        setLoadingStates(function (prev) {
                            var _a;
                            return (__assign(__assign({}, prev), (_a = {}, _a[componentId] = false, _a)));
                        });
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    }, []);
    var preloadComponent = React.useCallback(function (importFn, componentId) {
        dynamicImportManager.preloadModule(importFn, componentId);
    }, []);
    return {
        importComponent: importComponent,
        preloadComponent: preloadComponent,
        loadingStates: loadingStates,
        errorStates: errorStates,
        isLoading: function (componentId) { return loadingStates[componentId] || false; },
        hasError: function (componentId) { return !!errorStates[componentId]; },
        error: function (componentId) { return errorStates[componentId]; },
    };
};
// Higher-order component for lazy loading with dynamic import
export var withDynamicImport = function (importFn, componentId, options) {
    if (options === void 0) { options = {}; }
    return React.lazy(function () { return __awaiter(void 0, void 0, void 0, function () {
        var module_2, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, dynamicImportManager.dynamicImport(importFn, componentId, options)];
                case 1:
                    module_2 = _a.sent();
                    return [2 /*return*/, module_2];
                case 2:
                    error_4 = _a.sent();
                    console.error("Failed to load component ".concat(componentId, ":"), error_4);
                    // Return a fallback component
                    return [2 /*return*/, {
                            default: function () { return React.createElement('div', {
                                className: 'p-4 text-center text-red-600'
                            }, "Failed to load ".concat(componentId)); }
                        }];
                case 3: return [2 /*return*/];
            }
        });
    }); });
};
// Component for conditional imports
export var ConditionalImport = function (_a) {
    var importFn = _a.importFn, componentId = _a.componentId, condition = _a.condition, _b = _a.fallback, fallback = _b === void 0 ? null : _b, _c = _a.options, options = _c === void 0 ? {} : _c, props = __rest(_a, ["importFn", "componentId", "condition", "fallback", "options"]);
    var LazyComponent = React.useMemo(function () {
        return withDynamicImport(importFn, componentId, options);
    }, [importFn, componentId, options]);
    if (!condition) {
        return fallback ? React.createElement(React.Fragment, null, fallback) : null;
    }
    return React.createElement(React.Suspense, {
        fallback: React.createElement('div', {
            className: 'p-4 text-center'
        }, "Loading ".concat(componentId, "..."))
    }, React.createElement(LazyComponent, props));
};
// Utility function to preload critical components
export var preloadCriticalComponents = function () {
    var criticalImports = [
        { fn: ComponentImports.pages.Home, id: 'home' },
        { fn: ComponentImports.pages.Dashboard, id: 'dashboard' },
        { fn: ComponentImports.features.MultiAgentChat, id: 'multi-agent-chat' },
    ];
    dynamicImportManager.preloadModules(criticalImports);
};
// Utility function to analyze bundle size impact
export var analyzeImportImpact = function (importFn) { return __awaiter(void 0, void 0, void 0, function () {
    var startTime, startMemory, module_3, endTime, endMemory, loadTime, memoryImpact, error_5;
    var _a, _b, _c, _d;
    return __generator(this, function (_e) {
        switch (_e.label) {
            case 0:
                startTime = performance.now();
                startMemory = ((_a = performance.memory) === null || _a === void 0 ? void 0 : _a.usedJSHeapSize) || 0;
                _e.label = 1;
            case 1:
                _e.trys.push([1, 3, , 4]);
                return [4 /*yield*/, importFn()];
            case 2:
                module_3 = _e.sent();
                endTime = performance.now();
                endMemory = ((_b = performance.memory) === null || _b === void 0 ? void 0 : _b.usedJSHeapSize) || 0;
                loadTime = endTime - startTime;
                memoryImpact = endMemory - startMemory;
                console.log("Import Analysis:\n      Component: ".concat(((_c = module_3.default) === null || _c === void 0 ? void 0 : _c.name) || 'Unknown', "\n      Load Time: ").concat(loadTime.toFixed(2), "ms\n      Memory Impact: ").concat((memoryImpact / 1024 / 1024).toFixed(2), "MB\n      Bundle Size: ").concat((((_d = module_3.default) === null || _d === void 0 ? void 0 : _d.bundleSize) || 'Unknown'), "\n    "));
                return [2 /*return*/, { loadTime: loadTime, memoryImpact: memoryImpact, module: module_3 }];
            case 3:
                error_5 = _e.sent();
                console.error('Import analysis failed:', error_5);
                throw error_5;
            case 4: return [2 /*return*/];
        }
    });
}); };
// Export manager for advanced usage
export { dynamicImportManager };
export default dynamicImportManager;
