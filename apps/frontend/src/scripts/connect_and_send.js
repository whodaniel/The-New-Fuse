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
import { LoggingService } from '../services/logging';
import { ProgressTracker } from '../services/progress_tracker';
var ConnectionManager = /** @class */ (function () {
    function ConnectionManager() {
        this.bridge = CascadeBridge.getInstance();
        this.logger = LoggingService.getInstance();
        this.progressTracker = ProgressTracker.getInstance();
    }
    ConnectionManager.prototype.connectAndSend = function (message_1) {
        return __awaiter(this, arguments, void 0, function (message, options) {
            var _a, maxRetries, _b, retryDelay, _c, timeout, taskId, retries, error_1;
            if (options === void 0) { options = {}; }
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        _a = options.maxRetries, maxRetries = _a === void 0 ? 3 : _a, _b = options.retryDelay, retryDelay = _b === void 0 ? 1000 : _b, _c = options.timeout, timeout = _c === void 0 ? 5000 : _c;
                        taskId = this.progressTracker.startTask('connection', {
                            messageType: message.type,
                            retries: 0,
                            maxRetries: maxRetries
                        });
                        retries = 0;
                        _d.label = 1;
                    case 1:
                        if (!(retries < maxRetries)) return [3 /*break*/, 11];
                        _d.label = 2;
                    case 2:
                        _d.trys.push([2, 6, , 10]);
                        if (!!this.bridge.isConnected()) return [3 /*break*/, 4];
                        this.logger.info('Attempting to establish connection', { retry: retries + 1 });
                        this.progressTracker.updateProgress(taskId, ((retries + 1) / maxRetries) * 50, 'Connecting...');
                        return [4 /*yield*/, this.waitForConnection(timeout)];
                    case 3:
                        _d.sent();
                        _d.label = 4;
                    case 4:
                        this.progressTracker.updateProgress(taskId, 75, 'Sending message...');
                        return [4 /*yield*/, this.bridge.send(message)];
                    case 5:
                        _d.sent();
                        this.progressTracker.completeTask(taskId, 'Message sent successfully');
                        this.logger.info('Message sent successfully', { messageType: message.type });
                        return [2 /*return*/];
                    case 6:
                        error_1 = _d.sent();
                        retries++;
                        this.logger.warn('Connection attempt failed', {
                            retry: retries,
                            maxRetries: maxRetries,
                            error: error_1
                        });
                        if (!(retries < maxRetries)) return [3 /*break*/, 8];
                        return [4 /*yield*/, new Promise(function (resolve) { return setTimeout(resolve, retryDelay); })];
                    case 7:
                        _d.sent();
                        return [3 /*break*/, 9];
                    case 8:
                        this.progressTracker.failTask(taskId, 'Failed to send message after max retries');
                        this.logger.error('Max retries reached', error_1);
                        throw new Error('Failed to send message after max retries');
                    case 9: return [3 /*break*/, 10];
                    case 10: return [3 /*break*/, 1];
                    case 11: return [2 /*return*/];
                }
            });
        });
    };
    ConnectionManager.prototype.waitForConnection = function (timeout) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            if (_this.bridge.isConnected()) {
                resolve();
                return;
            }
            var timeoutId = setTimeout(function () {
                cleanup();
                reject(new Error('Connection timeout'));
            }, timeout);
            var handleConnect = function () {
                cleanup();
                resolve();
            };
            var handleError = function (error) {
                cleanup();
                reject(error);
            };
            var cleanup = function () {
                clearTimeout(timeoutId);
                _this.bridge.removeListener('connected', handleConnect);
                _this.bridge.removeListener('error', handleError);
            };
            _this.bridge.once('connected', handleConnect);
            _this.bridge.once('error', handleError);
        });
    };
    return ConnectionManager;
}());
export { ConnectionManager };
