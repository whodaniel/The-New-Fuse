var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { WebSocketService } from './websocket';
import { LoggingService } from './logging';
var CascadeBridge = /** @class */ (function (_super) {
    __extends(CascadeBridge, _super);
    function CascadeBridge() {
        var _this = _super.call(this) || this;
        _this.connected = false;
        _this.messageQueue = [];
        _this.ws = WebSocketService.getInstance();
        _this.logger = LoggingService.getInstance();
        _this.setupWebSocketListeners();
        return _this;
    }
    CascadeBridge.getInstance = function () {
        if (!CascadeBridge.instance) {
            CascadeBridge.instance = new CascadeBridge();
        }
        return CascadeBridge.instance;
    };
    CascadeBridge.prototype.setupWebSocketListeners = function () {
        var _this = this;
        this.ws.on('open', function () {
            _this.connected = true;
            _this.logger.info('CascadeBridge: Connected to WebSocket');
            _this.processMessageQueue();
            _this.emit('connected');
        });
        this.ws.on('close', function () {
            _this.connected = false;
            _this.logger.warn('CascadeBridge: Disconnected from WebSocket');
            _this.emit('disconnected');
        });
        this.ws.on('message', function (data) {
            try {
                var message = JSON.parse(data);
                _this.handleMessage(message);
            }
            catch (error) {
                _this.logger.error('CascadeBridge: Error parsing message', error);
            }
        });
        this.ws.on('error', function (error) {
            _this.logger.error('CascadeBridge: WebSocket error', error);
            _this.emit('error', error);
        });
    };
    CascadeBridge.prototype.processMessageQueue = function () {
        return __awaiter(this, void 0, void 0, function () {
            var messages, _i, messages_1, message, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!(this.connected && this.messageQueue.length > 0)) return [3 /*break*/, 6];
                        messages = __spreadArray([], this.messageQueue, true);
                        this.messageQueue = [];
                        _i = 0, messages_1 = messages;
                        _a.label = 1;
                    case 1:
                        if (!(_i < messages_1.length)) return [3 /*break*/, 6];
                        message = messages_1[_i];
                        _a.label = 2;
                    case 2:
                        _a.trys.push([2, 4, , 5]);
                        return [4 /*yield*/, this.send(message)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 5];
                    case 4:
                        error_1 = _a.sent();
                        this.logger.error('CascadeBridge: Error sending queued message', error_1);
                        this.messageQueue.push(message);
                        return [3 /*break*/, 5];
                    case 5:
                        _i++;
                        return [3 /*break*/, 1];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    CascadeBridge.prototype.handleMessage = function (message) {
        this.logger.debug('CascadeBridge: Received message', { type: message.type });
        this.emit('message', message);
        this.emit(message.type, message.payload);
    };
    CascadeBridge.prototype.send = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var error_2;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!this.connected) {
                            this.logger.warn('CascadeBridge: Not connected, queueing message', { type: message.type });
                            this.messageQueue.push(message);
                            return [2 /*return*/];
                        }
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 3, , 4]);
                        return [4 /*yield*/, this.ws.send(JSON.stringify(message))];
                    case 2:
                        _a.sent();
                        this.logger.debug('CascadeBridge: Sent message', { type: message.type });
                        return [3 /*break*/, 4];
                    case 3:
                        error_2 = _a.sent();
                        this.logger.error('CascadeBridge: Error sending message', error_2);
                        throw error_2;
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    CascadeBridge.prototype.isConnected = function () {
        return this.connected;
    };
    CascadeBridge.prototype.getQueuedMessages = function () {
        return __spreadArray([], this.messageQueue, true);
    };
    CascadeBridge.prototype.clearMessageQueue = function () {
        this.messageQueue = [];
    };
    return CascadeBridge;
}(EventEmitter));
export { CascadeBridge };
