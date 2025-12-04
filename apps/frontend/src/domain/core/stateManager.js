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
var StateManager = /** @class */ (function () {
    function StateManager() {
        this.state = {};
        this.stateHistory = [];
        this.maxHistorySize = 100;
        this.eventBus = EventBus.getInstance();
        this.logger = LoggingService.getInstance();
        this.subscribers = new Map();
    }
    StateManager.getInstance = function () {
        if (!StateManager.instance) {
            StateManager.instance = new StateManager();
        }
        return StateManager.instance;
    };
    StateManager.prototype.setState = function (path, value) {
        var oldValue = this.getState(path);
        if (this.isEqual(oldValue, value))
            return;
        var current = this.state;
        for (var i = 0; i < path.length - 1; i++) {
            if (!(path[i] in current)) {
                current[path[i]] = {};
            }
            current = current[path[i]];
        }
        var lastKey = path[path.length - 1];
        current[lastKey] = value;
        var changeEvent = {
            path: path,
            oldValue: oldValue,
            newValue: value,
            timestamp: Date.now()
        };
        this.addToHistory(changeEvent);
        this.notifySubscribers(path, value);
        this.eventBus.emit('state_change', changeEvent, 'StateManager');
    };
    StateManager.prototype.getState = function (path) {
        var current = this.state;
        for (var _i = 0, path_1 = path; _i < path_1.length; _i++) {
            var key = path_1[_i];
            if (current === undefined || current === null)
                return undefined;
            current = current[key];
        }
        return current;
    };
    StateManager.prototype.subscribe = function (path, callback) {
        var _this = this;
        var pathString = path.join('.');
        if (!this.subscribers.has(pathString)) {
            this.subscribers.set(pathString, new Set());
        }
        this.subscribers.get(pathString).add(callback);
        var currentValue = this.getState(path);
        if (currentValue !== undefined) {
            callback(currentValue);
        }
        return function () {
            var subscribers = _this.subscribers.get(pathString);
            if (subscribers) {
                subscribers.delete(callback);
                if (subscribers.size === 0) {
                    _this.subscribers.delete(pathString);
                }
            }
        };
    };
    StateManager.prototype.notifySubscribers = function (path, value) {
        var _this = this;
        var pathString = path.join('.');
        var subscribers = this.subscribers.get(pathString);
        if (subscribers) {
            subscribers.forEach(function (callback) {
                try {
                    callback(value);
                }
                catch (error) {
                    _this.logger.error('Error in state subscriber callback:', error);
                }
            });
        }
        var _loop_1 = function (i) {
            var parentPath = path.slice(0, i).join('.');
            var parentSubscribers = this_1.subscribers.get(parentPath);
            if (parentSubscribers) {
                var parentValue_1 = this_1.getState(path.slice(0, i));
                parentSubscribers.forEach(function (callback) {
                    try {
                        callback(parentValue_1);
                    }
                    catch (error) {
                        _this.logger.error('Error in parent state subscriber callback:', error);
                    }
                });
            }
        };
        var this_1 = this;
        for (var i = path.length - 1; i > 0; i--) {
            _loop_1(i);
        }
    };
    StateManager.prototype.addToHistory = function (event) {
        this.stateHistory.push(event);
        if (this.stateHistory.length > this.maxHistorySize) {
            this.stateHistory.shift();
        }
    };
    StateManager.prototype.getHistory = function () {
        return __spreadArray([], this.stateHistory, true);
    };
    StateManager.prototype.getHistoryForPath = function (path) {
        var pathString = path.join('.');
        return this.stateHistory.filter(function (event) { return event.path.join('.') === pathString; });
    };
    StateManager.prototype.clearHistory = function () {
        this.stateHistory = [];
        this.logger.info('State history cleared');
    };
    StateManager.prototype.reset = function () {
        this.state = {};
        this.stateHistory = [];
        this.subscribers.clear();
        this.eventBus.emit('state_reset', null, 'StateManager');
        this.logger.info('State manager reset');
    };
    StateManager.prototype.isEqual = function (a, b) {
        var _this = this;
        if (a === b)
            return true;
        if (a === null || b === null)
            return false;
        if (typeof a !== typeof b)
            return false;
        if (typeof a !== 'object')
            return false;
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        return keysA.every(function (key) { return _this.isEqual(a[key], b[key]); });
    };
    StateManager.prototype.getSnapshot = function () {
        return JSON.parse(JSON.stringify(this.state));
    };
    return StateManager;
}());
export { StateManager };
