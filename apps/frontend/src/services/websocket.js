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
import EventEmitter from 'events';
var WebSocketService = /** @class */ (function (_super) {
    __extends(WebSocketService, _super);
    function WebSocketService() {
        var _this = _super.call(this) || this;
        _this.socket = null;
        _this.reconnectAttempts = 0;
        _this.maxReconnectAttempts = 5;
        _this.reconnectTimeout = 1000;
        _this.connect();
        return _this;
    }
    WebSocketService.prototype.connect = function () {
        var _this = this;
        try {
            this.socket = new WebSocket('ws://localhost:3001');
            this.socket.onopen = function () {
                _this.reconnectAttempts = 0;
            };
            this.socket.onmessage = function (event) {
                try {
                    var data = JSON.parse(event.data);
                    _this.emit(data.type, data.payload);
                }
                catch (error) {
                    console.error('Error parsing WebSocket message:', error);
                }
            };
            this.socket.onclose = function (event) {
                _this.emit('connection_closed', event);
                if (!event.wasClean) {
                    _this.handleReconnect();
                }
            };
            this.socket.onerror = function (error) {
                _this.emit('connection_error', error);
                _this.handleReconnect();
            };
        }
        catch (error) {
            console.error('Error creating WebSocket connection:', error);
            this.handleReconnect();
        }
    };
    WebSocketService.prototype.handleReconnect = function () {
        var _this = this;
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(function () { return _this.connect(); }, this.reconnectTimeout * this.reconnectAttempts);
        }
        else {
            console.error('Max reconnection attempts reached');
        }
    };
    WebSocketService.prototype.send = function (type, payload) {
        var _a;
        if (((_a = this.socket) === null || _a === void 0 ? void 0 : _a.readyState) === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type: type, payload: payload }));
        }
        else {
            console.error('WebSocket is not connected');
        }
    };
    return WebSocketService;
}(EventEmitter));
export var webSocketService = new WebSocketService();
