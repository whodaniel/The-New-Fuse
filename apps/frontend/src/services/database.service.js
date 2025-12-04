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
import { handleApiResponse } from '@/utils/api';
import { LoggingService } from '@/core/services/LoggingService.ts';
import { MetricsService } from '@/core/services/MetricsService.ts';
var API_BASE = '/api/database';
var RETRY_ATTEMPTS = 3;
var RETRY_DELAY = 1000;
var DatabaseService = /** @class */ (function () {
    function DatabaseService() {
        this.logger = new LoggingService('DatabaseService');
        this.metrics = new MetricsService();
    }
    DatabaseService.getInstance = function () {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    };
    DatabaseService.withRetry = function (operation) {
        return __awaiter(this, void 0, void 0, function () {
            var lastError, _loop_1, attempt, state_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _loop_1 = function (attempt) {
                            var startTime, result, duration, error_1;
                            return __generator(this, function (_b) {
                                switch (_b.label) {
                                    case 0:
                                        _b.trys.push([0, 2, , 5]);
                                        startTime = Date.now();
                                        return [4 /*yield*/, operation()];
                                    case 1:
                                        result = _b.sent();
                                        duration = Date.now() - startTime;
                                        DatabaseService.getInstance().metrics.recordDbOperation('success', duration);
                                        return [2 /*return*/, { value: result }];
                                    case 2:
                                        error_1 = _b.sent();
                                        lastError = error_1;
                                        DatabaseService.getInstance().logger.error('Database operation failed', {
                                            error: error_1,
                                            attempt: attempt
                                        });
                                        DatabaseService.getInstance().metrics.recordDbOperation('error');
                                        if (!(attempt < RETRY_ATTEMPTS)) return [3 /*break*/, 4];
                                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, RETRY_DELAY * attempt); })];
                                    case 3:
                                        _b.sent();
                                        _b.label = 4;
                                    case 4: return [3 /*break*/, 5];
                                    case 5: return [2 /*return*/];
                                }
                            });
                        };
                        attempt = 1;
                        _a.label = 1;
                    case 1:
                        if (!(attempt <= RETRY_ATTEMPTS)) return [3 /*break*/, 4];
                        return [5 /*yield**/, _loop_1(attempt)];
                    case 2:
                        state_1 = _a.sent();
                        if (typeof state_1 === "object")
                            return [2 /*return*/, state_1.value];
                        _a.label = 3;
                    case 3:
                        attempt++;
                        return [3 /*break*/, 1];
                    case 4: throw lastError;
                }
            });
        });
    };
    DatabaseService.getStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/stats"))];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    DatabaseService.getConfigurations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/configurations"))];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    DatabaseService.createBackup = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/backup"), {
                                        method: 'POST',
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    DatabaseService.restoreFromBackup = function (formData) {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/restore"), {
                                        method: 'POST',
                                        body: formData,
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    DatabaseService.runMigrations = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/migrations/run"), {
                                        method: 'POST',
                                    })];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    DatabaseService.checkConnection = function () {
        return __awaiter(this, void 0, void 0, function () {
            var response, result, error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, fetch("".concat(API_BASE, "/check"))];
                    case 1:
                        response = _a.sent();
                        return [4 /*yield*/, handleApiResponse(response)];
                    case 2:
                        result = _a.sent();
                        DatabaseService.getInstance().metrics.recordDbOperation('connection_check', undefined, result.connected);
                        return [2 /*return*/, result.connected];
                    case 3:
                        error_2 = _a.sent();
                        DatabaseService.getInstance().logger.error('Database connection check failed:', { error: error_2 });
                        DatabaseService.getInstance().metrics.recordDbOperation('connection_check', undefined, false);
                        return [2 /*return*/, false];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    DatabaseService.getQueryStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var _this = this;
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/query-stats"))];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    DatabaseService.getLogs = function () {
        return __awaiter(this, arguments, void 0, function (limit) {
            var _this = this;
            if (limit === void 0) { limit = 100; }
            return __generator(this, function (_a) {
                return [2 /*return*/, this.withRetry(function () { return __awaiter(_this, void 0, void 0, function () {
                        var response;
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, fetch("".concat(API_BASE, "/logs?limit=").concat(limit))];
                                case 1:
                                    response = _a.sent();
                                    return [2 /*return*/, handleApiResponse(response)];
                            }
                        });
                    }); })];
            });
        });
    };
    return DatabaseService;
}());
export { DatabaseService };
