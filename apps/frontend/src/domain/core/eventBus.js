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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
import { LoggingService } from '../../services/logging';
var EventBus = /** @class */ (function (_super) {
    __extends(EventBus, _super);
    function EventBus() {
        var _this = _super.call(this) || this;
        _this.eventHistory = [];
        _this.maxHistorySize = 1000;
        _this.logger = LoggingService.getInstance();
        _this.setupErrorHandling();
        return _this;
    }
    EventBus.getInstance = function () {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    };
    EventBus.prototype.setupErrorHandling = function () {
        var _this = this;
        this.on('error', function (error) {
            _this.logger.error('EventBus error:', error);
        });
    };
    EventBus.prototype.emit = function (type, payload, source, correlationId) {
        var eventData = {
            type: type,
            payload: payload,
            metadata: {
                timestamp: Date.now(),
                source: source,
                correlationId: correlationId
            }
        };
        this.addToHistory(eventData);
        this.logger.debug("Event emitted: ".concat(type), { source: source, correlationId: correlationId });
        return _super.prototype.emit.call(this, type, eventData);
    };
    EventBus.prototype.on = function (type, listener) {
        return _super.prototype.on.call(this, type, listener);
    };
    EventBus.prototype.once = function (type, listener) {
        return _super.prototype.once.call(this, type, listener);
    };
    EventBus.prototype.addToHistory = function (eventData) {
        this.eventHistory.push(eventData);
        if (this.eventHistory.length > this.maxHistorySize) {
            this.eventHistory.shift();
        }
    };
    EventBus.prototype.getEventHistory = function () {
        return __spreadArray([], this.eventHistory, true);
    };
    EventBus.prototype.getEventsByType = function (type) {
        return this.eventHistory.filter(function (event) { return event.type === type; });
    };
    EventBus.prototype.getEventsByTimeRange = function (startTime, endTime) {
        return this.eventHistory.filter(function (event) { return event.metadata.timestamp >= startTime && event.metadata.timestamp <= endTime; });
    };
    EventBus.prototype.clearHistory = function () {
        this.eventHistory = [];
        this.logger.info('Event history cleared');
    };
    EventBus.prototype.removeAllListeners = function (type) {
        if (type) {
            this.logger.debug("Removing all listeners for event type: ".concat(type));
        }
        else {
            this.logger.debug('Removing all event listeners');
        }
        return _super.prototype.removeAllListeners.call(this, type);
    };
    EventBus.prototype.listenerCount = function (type) {
        return _super.prototype.listenerCount.call(this, type);
    };
    EventBus.prototype.getActiveEventTypes = function () {
        return this.eventNames();
    };
    return EventBus;
}(EventEmitter));
export { EventBus };
