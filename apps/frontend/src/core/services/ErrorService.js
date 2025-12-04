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
import { StateManager } from '../../domain/core/stateManager';
import { LoggingService } from '../../services/logging';
var ErrorService = /** @class */ (function () {
    function ErrorService() {
        this.errorHistory = [];
        this.maxHistorySize = 100;
        this.eventBus = EventBus.getInstance();
        this.stateManager = StateManager.getInstance();
        this.logger = LoggingService.getInstance();
        this.setupGlobalErrorHandling();
    }
    ErrorService.getInstance = function () {
        if (!ErrorService.instance) {
            ErrorService.instance = new ErrorService();
        }
        return ErrorService.instance;
    };
    ErrorService.prototype.setupGlobalErrorHandling = function () {
        var _this = this;
        window.onerror = function (message, source, lineno, colno, error) {
            _this.handleError(error || new Error(message), {
                source: source,
                line: lineno,
                column: colno
            });
        };
        window.onunhandledrejection = function (event) {
            _this.handleError(event.reason, {
                type: 'unhandled_promise_rejection'
            });
        };
    };
    ErrorService.prototype.handleError = function (error, context) {
        var errorReport = {
            code: error.name,
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: Date.now(),
            handled: true
        };
        this.addToHistory(errorReport);
        this.logger.error(error.message, error);
        this.eventBus.emit('error_occurred', errorReport, 'ErrorService');
        if (this.shouldReportError(errorReport)) {
            this.reportError(errorReport);
        }
    };
    ErrorService.prototype.shouldReportError = function (error) {
        return true;
    };
    ErrorService.prototype.reportError = function (error) {
        return __awaiter(this, void 0, void 0, function () {
            var reportError_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        return [4 /*yield*/, fetch('/api/errors/report', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify(error)
                            })];
                    case 1:
                        _a.sent();
                        return [3 /*break*/, 3];
                    case 2:
                        reportError_1 = _a.sent();
                        this.logger.error('Failed to report error', reportError_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    ErrorService.prototype.addToHistory = function (error) {
        this.errorHistory.push(error);
        if (this.errorHistory.length > this.maxHistorySize) {
            this.errorHistory.shift();
        }
        this.stateManager.setState(['errors', 'history'], this.errorHistory);
    };
    ErrorService.prototype.getErrorHistory = function () {
        return __spreadArray([], this.errorHistory, true);
    };
    ErrorService.prototype.clearHistory = function () {
        this.errorHistory.length = 0;
        this.stateManager.setState(['errors', 'history'], []);
    };
    ErrorService.prototype.getErrorStats = function () {
        return __awaiter(this, void 0, void 0, function () {
            var stats;
            return __generator(this, function (_a) {
                try {
                    stats = {
                        total: this.errorHistory.length,
                        handled: this.errorHistory.filter(function (e) { return e.handled; }).length,
                        unhandled: this.errorHistory.filter(function (e) { return !e.handled; }).length,
                        byType: this.errorHistory.reduce(function (acc, error) {
                            acc[error.code] = (acc[error.code] || 0) + 1;
                            return acc;
                        }, {})
                    };
                    return [2 /*return*/, { success: true, data: stats }];
                }
                catch (error) {
                    this.logger.error('Failed to get error stats', error);
                    return [2 /*return*/, {
                            success: false,
                            error: {
                                code: 'ERROR_STATS_FAILED',
                                message: 'Failed to get error statistics',
                                details: error
                            }
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    ErrorService.prototype.subscribeToErrors = function (callback) {
        return this.eventBus.on('error_occurred', function (event) { return callback(event.payload); });
    };
    ErrorService.prototype.subscribeToErrorHistory = function (callback) {
        return this.stateManager.subscribe(['errors', 'history'], callback);
    };
    return ErrorService;
}());
export { ErrorService };
