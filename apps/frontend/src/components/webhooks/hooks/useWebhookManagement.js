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
import { useState, useCallback, useEffect } from 'react';
import { DeliveryStatus, } from '@the-new-fuse/types';
export function useWebhookManagement() {
    var _this = this;
    var _a = useState({
        configurations: [],
        deliveryLogs: [],
        loading: false,
        error: null,
    }), state = _a[0], setState = _a[1];
    var apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001';
    var getAuthHeaders = useCallback(function () {
        var token = localStorage.getItem('authToken');
        return {
            'Content-Type': 'application/json',
            'Authorization': "Bearer ".concat(token),
        };
    }, []);
    var handleApiError = useCallback(function (error, action) {
        console.error("Failed to ".concat(action, ":"), error);
        var errorMessage = error instanceof Error ? error.message : "Failed to ".concat(action);
        setState(function (prev) { return (__assign(__assign({}, prev), { error: errorMessage, loading: false })); });
        throw error;
    }, []);
    var registerWebhook = useCallback(function (request) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/register"), {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(request),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    // Refresh configurations after successful registration
                    return [4 /*yield*/, loadConfigurations()];
                case 4:
                    // Refresh configurations after successful registration
                    _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: false })); });
                    return [2 /*return*/, result];
                case 5:
                    error_1 = _a.sent();
                    handleApiError(error_1, 'register webhook');
                    throw error_1;
                case 6: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var getWebhookStatus = useCallback(function (webhookId) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/status/").concat(webhookId), {
                            headers: getAuthHeaders(),
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_2 = _a.sent();
                    handleApiError(error_2, 'get webhook status');
                    throw error_2;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var retryFailedEvent = useCallback(function (eventId) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/events/").concat(eventId, "/retry"), {
                            method: 'POST',
                            headers: getAuthHeaders(),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    // Refresh delivery logs after retry
                    return [4 /*yield*/, loadDeliveryLogs()];
                case 3:
                    // Refresh delivery logs after retry
                    _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: false })); });
                    return [3 /*break*/, 5];
                case 4:
                    error_3 = _a.sent();
                    handleApiError(error_3, 'retry failed event');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var loadConfigurations = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, configurations_1, error_4;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/configurations"), {
                            headers: getAuthHeaders(),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    configurations_1 = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { configurations: configurations_1, loading: false })); });
                    return [3 /*break*/, 5];
                case 4:
                    error_4 = _a.sent();
                    handleApiError(error_4, 'load webhook configurations');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var loadDeliveryLogs = useCallback(function (webhookId) { return __awaiter(_this, void 0, void 0, function () {
        var url, response, deliveryLogs_1, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    url = webhookId
                        ? "".concat(apiBaseUrl, "/webhooks/").concat(webhookId, "/delivery-logs")
                        : "".concat(apiBaseUrl, "/webhooks/delivery-logs");
                    return [4 /*yield*/, fetch(url, {
                            headers: getAuthHeaders(),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    deliveryLogs_1 = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { deliveryLogs: deliveryLogs_1, loading: false })); });
                    return [3 /*break*/, 5];
                case 4:
                    error_5 = _a.sent();
                    handleApiError(error_5, 'load delivery logs');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var deleteWebhook = useCallback(function (webhookId) { return __awaiter(_this, void 0, void 0, function () {
        var response, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/").concat(webhookId), {
                            method: 'DELETE',
                            headers: getAuthHeaders(),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    // Remove from local state
                    setState(function (prev) { return (__assign(__assign({}, prev), { configurations: prev.configurations.filter(function (config) { return config.id !== webhookId; }), loading: false })); });
                    return [3 /*break*/, 4];
                case 3:
                    error_6 = _a.sent();
                    handleApiError(error_6, 'delete webhook');
                    return [3 /*break*/, 4];
                case 4: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var updateWebhook = useCallback(function (webhookId, updates) { return __awaiter(_this, void 0, void 0, function () {
        var response, updatedConfig_1, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/").concat(webhookId), {
                            method: 'PATCH',
                            headers: getAuthHeaders(),
                            body: JSON.stringify(updates),
                        })];
                case 2:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 3:
                    updatedConfig_1 = _a.sent();
                    // Update local state
                    setState(function (prev) { return (__assign(__assign({}, prev), { configurations: prev.configurations.map(function (config) {
                            return config.id === webhookId ? updatedConfig_1 : config;
                        }), loading: false })); });
                    return [3 /*break*/, 5];
                case 4:
                    error_7 = _a.sent();
                    handleApiError(error_7, 'update webhook');
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    var testWebhook = useCallback(function (webhookId, testPayload) { return __awaiter(_this, void 0, void 0, function () {
        var response, result, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: true, error: null })); });
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/").concat(webhookId, "/test"), {
                            method: 'POST',
                            headers: getAuthHeaders(),
                            body: JSON.stringify({ payload: testPayload }),
                        })];
                case 2:
                    response = _a.sent();
                    return [4 /*yield*/, response.json()];
                case 3:
                    result = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: false })); });
                    return [2 /*return*/, {
                            success: response.ok,
                            response: result,
                            error: response.ok ? undefined : result.message || 'Test failed',
                        }];
                case 4:
                    error_8 = _a.sent();
                    setState(function (prev) { return (__assign(__assign({}, prev), { loading: false })); });
                    return [2 /*return*/, {
                            success: false,
                            error: error_8 instanceof Error ? error_8.message : 'Test failed',
                        }];
                case 5: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders]);
    var getIntegrationStats = useCallback(function () { return __awaiter(_this, void 0, void 0, function () {
        var response, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 3, , 4]);
                    return [4 /*yield*/, fetch("".concat(apiBaseUrl, "/webhooks/stats"), {
                            headers: getAuthHeaders(),
                        })];
                case 1:
                    response = _a.sent();
                    if (!response.ok) {
                        throw new Error("HTTP ".concat(response.status, ": ").concat(response.statusText));
                    }
                    return [4 /*yield*/, response.json()];
                case 2: return [2 /*return*/, _a.sent()];
                case 3:
                    error_9 = _a.sent();
                    handleApiError(error_9, 'get integration stats');
                    throw error_9;
                case 4: return [2 /*return*/];
            }
        });
    }); }, [apiBaseUrl, getAuthHeaders, handleApiError]);
    // Helper functions for filtering and grouping
    var getConfigurationsBySource = useCallback(function (source) {
        return state.configurations.filter(function (config) { return config.source === source; });
    }, [state.configurations]);
    var getActiveConfigurations = useCallback(function () {
        return state.configurations.filter(function (config) { return config.is_active; });
    }, [state.configurations]);
    var getRecentDeliveryLogs = useCallback(function (limit) {
        if (limit === void 0) { limit = 50; }
        return state.deliveryLogs
            .sort(function (a, b) { return new Date(b.created_at).getTime() - new Date(a.created_at).getTime(); })
            .slice(0, limit);
    }, [state.deliveryLogs]);
    var getFailedDeliveries = useCallback(function () {
        return state.deliveryLogs.filter(function (log) { return log.delivery_status === DeliveryStatus.FAILED; });
    }, [state.deliveryLogs]);
    // Load initial data
    useEffect(function () {
        loadConfigurations();
        loadDeliveryLogs();
    }, [loadConfigurations, loadDeliveryLogs]);
    return __assign(__assign({}, state), { 
        // Actions
        registerWebhook: registerWebhook, getWebhookStatus: getWebhookStatus, retryFailedEvent: retryFailedEvent, loadConfigurations: loadConfigurations, loadDeliveryLogs: loadDeliveryLogs, deleteWebhook: deleteWebhook, updateWebhook: updateWebhook, testWebhook: testWebhook, getIntegrationStats: getIntegrationStats, 
        // Helpers
        getConfigurationsBySource: getConfigurationsBySource, getActiveConfigurations: getActiveConfigurations, getRecentDeliveryLogs: getRecentDeliveryLogs, getFailedDeliveries: getFailedDeliveries });
}
