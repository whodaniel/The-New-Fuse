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
import { EventEmitter } from 'events';
import { sessionManager } from '@your-org/security';
var WebSocketService = /** @class */ (function (_super) {
    __extends(WebSocketService, _super);
    function WebSocketService(baseUrl, options) {
        if (options === void 0) { options = {
            reconnectDelay: 2000,
            pingInterval: 30000
        }; }
        var _this = _super.call(this) || this;
        _this.baseUrl = baseUrl;
        _this.options = options;
        _this.ws = null;
        _this.reconnectAttempts = 0;
        _this.maxReconnectAttempts = 5;
        _this.reconnectTimeout = null;
        _this.pingInterval = null;
        return _this;
    }
    WebSocketService.prototype.connect = function () {
        return __awaiter(this, void 0, void 0, function () {
            var session, url;
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN)
                            return [2 /*return*/];
                        return [4 /*yield*/, sessionManager.getCurrentSession()];
                    case 1:
                        session = _b.sent();
                        if (!session) {
                            throw new Error('No active session');
                        }
                        url = new URL(this.baseUrl);
                        url.searchParams.set('sessionId', session.id);
                        this.ws = new WebSocket(url.toString());
                        this.setupEventHandlers();
                        this.startPingInterval();
                        return [2 /*return*/];
                }
            });
        });
    };
    WebSocketService.prototype.setupEventHandlers = function () {
        var _this = this;
        if (!this.ws)
            return;
        this.ws.onopen = function () {
            _this.reconnectAttempts = 0;
            _this.emit('connected');
        };
        this.ws.onclose = function () {
            _this.cleanup();
            _this.handleReconnect();
        };
        this.ws.onerror = function (error) {
            _this.emit('error', error);
            _this.cleanup();
            _this.handleReconnect();
        };
        this.ws.onmessage = function (event) {
            try {
                var data = JSON.parse(event.data);
                _this.handleMessage(data);
            }
            catch (error) {
                _this.emit('error', new Error('Invalid message format'));
            }
        };
    };
    WebSocketService.prototype.handleMessage = function (message) {
        if (message.type === 'session_expired') {
            this.handleSessionExpired();
            return;
        }
        this.emit(message.type, message.payload);
    };
    WebSocketService.prototype.handleSessionExpired = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 3, , 4]);
                        return [4 /*yield*/, sessionManager.refreshSession()];
                    case 1:
                        _a.sent();
                        return [4 /*yield*/, this.reconnect()];
                    case 2:
                        _a.sent();
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _a.sent();
                        this.emit('session_error', error_1);
                        return [3 /*break*/, 4];
                    case 4: return [2 /*return*/];
                }
            });
        });
    };
    WebSocketService.prototype.handleReconnect = function () {
        var _this = this;
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            this.emit('max_reconnect_attempts');
            return;
        }
        this.reconnectTimeout = setTimeout(function () {
            _this.reconnectAttempts++;
            _this.connect().catch(function (error) {
                _this.emit('error', error);
            });
        }, this.options.reconnectDelay * Math.pow(2, this.reconnectAttempts));
    };
    WebSocketService.prototype.startPingInterval = function () {
        var _this = this;
        this.pingInterval = setInterval(function () {
            var _a;
            if (((_a = _this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                _this.send('ping');
            }
        }, this.options.pingInterval);
    };
    WebSocketService.prototype.send = function (type, payload) {
        var _a;
        if (((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) !== WebSocket.OPEN) {
            throw new Error('WebSocket is not connected');
        }
        this.ws.send(JSON.stringify({ type: type, payload: payload }));
    };
    WebSocketService.prototype.cleanup = function () {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.ws) {
            this.ws.onopen = null;
            this.ws.onclose = null;
            this.ws.onerror = null;
            this.ws.onmessage = null;
        }
    };
    WebSocketService.prototype.disconnect = function () {
        this.cleanup();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    };
    return WebSocketService;
}(EventEmitter));
export { WebSocketService };
export var webSocketService = new WebSocketService(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3000');
