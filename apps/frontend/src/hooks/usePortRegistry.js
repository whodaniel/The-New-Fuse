// apps/frontend/src/hooks/usePortRegistry.ts
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
import { useState, useEffect, useCallback } from 'react';
import { portManagementApi } from '../services/port-management-api';
export var usePortRegistry = function () {
    var _a = useState([]), ports = _a[0], setPorts = _a[1];
    var _b = useState([]), conflicts = _b[0], setConflicts = _b[1];
    var _c = useState(false), loading = _c[0], setLoading = _c[1];
    var _d = useState(null), error = _d[0], setError = _d[1];
    // Fetch all ports
    var refreshPorts = useCallback(function () { return __awaiter(void 0, void 0, void 0, function () {
        var _a, portsData, conflictsData, err_1;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    setLoading(true);
                    setError(null);
                    _b.label = 1;
                case 1:
                    _b.trys.push([1, 3, 4, 5]);
                    return [4 /*yield*/, Promise.all([
                            portManagementApi.getAllPorts(),
                            portManagementApi.getConflicts()
                        ])];
                case 2:
                    _a = _b.sent(), portsData = _a[0], conflictsData = _a[1];
                    setPorts(portsData);
                    setConflicts(conflictsData);
                    return [3 /*break*/, 5];
                case 3:
                    err_1 = _b.sent();
                    setError(err_1 instanceof Error ? err_1.message : 'Failed to fetch port data');
                    return [3 /*break*/, 5];
                case 4:
                    setLoading(false);
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    }); }, []);
    // Register a new port
    var registerPort = useCallback(function (config) { return __awaiter(void 0, void 0, void 0, function () {
        var registration, err_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, portManagementApi.registerPort(config)];
                case 1:
                    registration = _a.sent();
                    return [4 /*yield*/, refreshPorts()];
                case 2:
                    _a.sent(); // Refresh to get updated data
                    return [2 /*return*/, registration];
                case 3:
                    err_2 = _a.sent();
                    setError(err_2 instanceof Error ? err_2.message : 'Failed to register port');
                    throw err_2;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [refreshPorts]);
    // Reassign a port
    var reassignPort = useCallback(function (portId, newPort) { return __awaiter(void 0, void 0, void 0, function () {
        var err_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, portManagementApi.reassignPort(portId, newPort)];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, refreshPorts()];
                case 2:
                    _a.sent(); // Refresh to get updated data
                    return [3 /*break*/, 4];
                case 3:
                    err_3 = _a.sent();
                    setError(err_3 instanceof Error ? err_3.message : 'Failed to reassign port');
                    throw err_3;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [refreshPorts]);
    // Resolve a conflict
    var resolveConflict = useCallback(function (port, resolution) { return __awaiter(void 0, void 0, void 0, function () {
        var err_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, portManagementApi.resolveConflict({ port: port, resolution: resolution })];
                case 1:
                    _a.sent();
                    return [4 /*yield*/, refreshPorts()];
                case 2:
                    _a.sent(); // Refresh to get updated data
                    return [3 /*break*/, 4];
                case 3:
                    err_4 = _a.sent();
                    setError(err_4 instanceof Error ? err_4.message : 'Failed to resolve conflict');
                    throw err_4;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [refreshPorts]);
    // Find available port
    var findAvailablePort = useCallback(function (serviceName, environment) { return __awaiter(void 0, void 0, void 0, function () {
        var err_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, portManagementApi.findAvailablePort(serviceName, environment)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    err_5 = _a.sent();
                    setError(err_5 instanceof Error ? err_5.message : 'Failed to find available port');
                    throw err_5;
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    // Check port health
    var checkPortHealth = useCallback(function (port) { return __awaiter(void 0, void 0, void 0, function () {
        var err_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, portManagementApi.checkPortHealth(port)];
                case 1: return [2 /*return*/, _a.sent()];
                case 2:
                    err_6 = _a.sent();
                    setError(err_6 instanceof Error ? err_6.message : 'Failed to check port health');
                    throw err_6;
                case 3: return [2 /*return*/];
            }
        });
    }); }, []);
    // Setup WebSocket for real-time updates
    useEffect(function () {
        var ws = portManagementApi.connectWebSocket();
        ws.onmessage = function (event) {
            var data = JSON.parse(event.data);
            switch (data.type) {
                case 'portRegistered':
                case 'portReassigned':
                case 'portInactive':
                case 'healthCheckFailed':
                    refreshPorts();
                    break;
                case 'conflictDetected':
                    setConflicts(function (prev) { return __spreadArray(__spreadArray([], prev, true), [data.conflict], false); });
                    break;
                case 'conflictResolved':
                    setConflicts(function (prev) { return prev.filter(function (c) { return c.port !== data.port; }); });
                    break;
            }
        };
        ws.onerror = function () {
            setError('WebSocket connection failed');
        };
        return function () {
            ws.close();
        };
    }, [refreshPorts]);
    // Initial load
    useEffect(function () {
        refreshPorts();
    }, [refreshPorts]);
    return {
        ports: ports,
        conflicts: conflicts,
        loading: loading,
        error: error,
        refreshPorts: refreshPorts,
        registerPort: registerPort,
        reassignPort: reassignPort,
        resolveConflict: resolveConflict,
        findAvailablePort: findAvailablePort,
        checkPortHealth: checkPortHealth
    };
};
