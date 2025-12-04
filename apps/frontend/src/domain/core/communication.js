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
import { LoggingService } from '../../services/logging';
var CommunicationManager = /** @class */ (function (_super) {
    __extends(CommunicationManager, _super);
    function CommunicationManager(config) {
        if (config === void 0) { config = {}; }
        var _this = _super.call(this) || this;
        _this.ws = null;
        _this.reconnectCount = 0;
        _this.logger = LoggingService.getInstance();
        _this.config = Object.assign({ reconnectAttempts: 5, reconnectInterval: 3000, pingInterval: 30000, timeout: 5000 }, config);
        return _this;
    }
    CommunicationManager.getInstance = function (config) {
        if (!CommunicationManager.instance) {
            CommunicationManager.instance = new CommunicationManager(config);
        }
        return CommunicationManager.instance;
    };
    CommunicationManager.prototype.connect = function (url) {
        var _this = this;
        return new Promise(function (resolve, reject) {
            try {
                _this.ws = new WebSocket(url);
                _this.setupWebSocketHandlers(resolve, reject);
                _this.startPingInterval();
            }
            catch (error) {
                _this.logger.error('Failed to create WebSocket connection', error);
                reject(error);
            }
        });
    };
    CommunicationManager.prototype.setupWebSocketHandlers = function (resolve, reject) {
        var _this = this;
        if (!this.ws)
            return;
        var timeout = setTimeout(function () {
            var _a;
            reject(new Error('Connection timeout'));
            (_a = _this.ws) === null || _a === void 0 ? void 0 : _a.close();
        }, this.config.timeout);
        this.ws.onopen = function () {
            clearTimeout(timeout);
            _this.reconnectCount = 0;
            _this.logger.info('WebSocket connection established');
            _this.emit('connected');
            resolve();
        };
        this.ws.onclose = function () {
            _this.handleDisconnect();
        };
        this.ws.onerror = function (error) {
            _this.logger.error('WebSocket error', error);
            _this.emit('error', error);
        };
        this.ws.onmessage = function (event) {
            _this.handleMessage(event);
        };
    };
    CommunicationManager.prototype.handleDisconnect = function () {
        var _this = this;
        this.stopPingInterval();
        this.emit('disconnected');
        this.logger.warn('WebSocket connection closed');
        if (this.reconnectCount < this.config.reconnectAttempts) {
            this.reconnectTimer = setTimeout(function () {
                _this.reconnectCount++;
                _this.logger.info("Attempting to reconnect (".concat(_this.reconnectCount, "/").concat(_this.config.reconnectAttempts, ")"));
                _this.connect(_this.ws.url).catch(function (error) {
                    _this.logger.error('Reconnection attempt failed', error);
                });
            }, this.config.reconnectInterval);
        }
        else {
            this.logger.error('Max reconnection attempts reached');
            this.emit('reconnect_failed');
        }
    };
    CommunicationManager.prototype.handleMessage = function (event) {
        try {
            var wsEvent = JSON.parse(event.data);
            this.emit('message', wsEvent);
            this.emit(wsEvent.type, wsEvent.payload);
        }
        catch (error) {
            this.logger.error('Failed to parse WebSocket message', error);
        }
    };
    CommunicationManager.prototype.startPingInterval = function () {
        var _this = this;
        this.pingTimer = setInterval(function () {
            var _a;
            if (((_a = _this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
                _this.send({
                    type: 'ping',
                    payload: { timestamp: Date.now() }
                });
            }
        }, this.config.pingInterval);
    };
    CommunicationManager.prototype.stopPingInterval = function () {
        if (this.pingTimer) {
            clearInterval(this.pingTimer);
        }
    };
    CommunicationManager.prototype.send = function (event) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
                    throw new Error('WebSocket is not connected');
                }
                try {
                    this.ws.send(JSON.stringify(event));
                }
                catch (error) {
                    this.logger.error('Failed to send message', error);
                    throw error;
                }
                return [2 /*return*/];
            });
        });
    };
    CommunicationManager.prototype.sendMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0: return [4 /*yield*/, this.send({
                            type: 'message',
                            payload: message
                        })];
                    case 1:
                        _b.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    CommunicationManager.prototype.disconnect = function () {
        this.stopPingInterval();
        if (this.reconnectTimer) {
            clearTimeout(this.reconnectTimer);
        }
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    };
    CommunicationManager.prototype.isConnected = function () {
        var _a;
        return ((_a = this.ws) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN;
    };
    return CommunicationManager;
}(EventEmitter));
export { CommunicationManager };
